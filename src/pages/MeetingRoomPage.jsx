import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingApi } from '../api/meeting';
import { getStoredTokens, API_BASE_URL } from '../api/client';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { Loader } from '../components/common/Loader';
import { LeaveWarningModal } from '../components/common/LeaveWarningModal';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ShieldCheck,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogIn,
  FileText,
  X,
  FolderOpen,
  ArrowLeft,
  Eye,
  Sparkles,
  BookOpen,
  ChevronRight,
  Maximize2,
  Minimize2,
  List,
  Star,
  Pill,
  MessageSquare,
} from 'lucide-react';
import { DoctorRatingModal } from '../components/patient/DoctorRatingModal';
import { PrescriptionWriter } from '../components/doctor/PrescriptionWriter';
import { PrescriptionView } from '../components/patient/PrescriptionView';
import { AIExtractionReview } from '../components/doctor/AIExtractionReview';
import { ConsultationSummaryModal } from '../components/doctor/ConsultationSummaryModal';
import { prescriptionApi } from '../api/prescription';
import { consultationAiApi } from '../api/consultationAi';


const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function MeetingRoomPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [meetingError, setMeetingError] = useState(null);
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(true);
  const [toast, setToast] = useState(null);

  // Call & Media states
  const [localStream, setLocalStream] = useState(null);
  const [mediaStatus, setMediaStatus] = useState('requesting'); // 'requesting' | 'ready' | 'no-camera' | 'blocked'
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerName, setPeerName] = useState('Waiting for participant to join...');

  // ─── Session & Leave/Rejoin States ─────────────────────────────────────
  const [sessionState, setSessionState] = useState('active');
  // 'active' = in meeting | 'left' = user left (can rejoin) | 'completed' = meeting ended fully
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [canRejoin, setCanRejoin] = useState(false);
  const [bothJoined, setBothJoined] = useState(false);

  // ─── Post-Consultation (Rating & Prescription) States ──────────────────
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [showPrescriptionWriter, setShowPrescriptionWriter] = useState(false);
  const [showAIExtractionReview, setShowAIExtractionReview] = useState(false);
  const [showPrescriptionView, setShowPrescriptionView] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [aiDraftState, setAiDraftState] = useState(null); // null | 'processing' | 'ready' | 'failed'
  const [aiDraftMessage, setAiDraftMessage] = useState('');
  const aiPollingTimerRef = useRef(null);

  // ─── Live Transcription & Consultation AI Summary States ─────────────────
  const [showConsultationSummary, setShowConsultationSummary] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState([]);
  const liveTranscriptRef = useRef([]);
  const [showLiveTranscriptDrawer, setShowLiveTranscriptDrawer] = useState(false);
  const [interimCaption, setInterimCaption] = useState(null);
  const [speechLang, setSpeechLang] = useState('en-US'); // 'en-US' | 'ur-PK'
  const speechLangRef = useRef('en-US');
  const [transcriptionStatus, setTranscriptionStatus] = useState('transcribing'); // 'transcribing' | 'reconnecting' | 'permission_denied' | 'muted' | 'unsupported'

  // Resilient SpeechRecognition lifecycle refs
  const recognitionRef = useRef(null);
  const shouldRecognizeRef = useRef(false);
  const isStartingRef = useRef(false);
  const isRecognizingRef = useRef(false);
  const restartTimerRef = useRef(null);
  const restartAttemptsRef = useRef(0);
  const lastFinalTextRef = useRef('');
  const lastFinalTimeRef = useRef(0);
  const transcriptBottomRef = useRef(null);
  const callStartTimeRef = useRef(Date.now());

  // Auto-scroll transcript drawer when new segments arrive
  useEffect(() => {
    if (showLiveTranscriptDrawer && transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveTranscript, showLiveTranscriptDrawer]);

  // ─── Document Panel States ────────────────────────────────────────────
  const [showDocPanel, setShowDocPanel] = useState(false);
  const [meetingDocs, setMeetingDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docPanelTab, setDocPanelTab] = useState('all_summaries'); // 'all_summaries' | 'files'
  const [docViewMode, setDocViewMode] = useState('summary'); // 'summary' | 'original'
  const [docBlobUrl, setDocBlobUrl] = useState(null);
  const [docBlobLoading, setDocBlobLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isBulkSummarizing, setIsBulkSummarizing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentFileName: '' });
  const [panelExpanded, setPanelExpanded] = useState(false);

  // DOM and WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ─── 1. Load Meeting Details and Unblock UI Immediately ───────────────────
  useEffect(() => {
    let isMounted = true;

    const loadMeeting = async () => {
      setIsLoadingMeeting(true);
      setMeetingError(null);
      try {
        const data = await meetingApi.getMeetingDetails(meetingId);
        if (!isMounted) return;
        setMeeting(data);
        if (data.attached_documents && data.attached_documents.length > 0) {
          setMeetingDocs(data.attached_documents);
        }
        setIsLoadingMeeting(false);

        if (data.status === 'completed') {
          setSessionState('completed');
          setToast({ type: 'info', message: 'This consultation was previously marked as completed.' });
          return;
        }

        // Check if we're within the meeting window
        const now = Date.now();
        const endTime = new Date(data.end_time).getTime();
        if (now > endTime) {
          setSessionState('completed');
          setToast({ type: 'info', message: 'This consultation time window has expired.' });
          return;
        }

        // Start media & WebRTC signaling in the background
        initializeMediaAndSignaling(data);
      } catch (err) {
        if (!isMounted) return;
        setMeetingError(err.message || 'Could not load meeting details.');
        setIsLoadingMeeting(false);
      }
    };

    loadMeeting();

    return () => {
      isMounted = false;
      cleanupCall();
    };
  }, [meetingId]);

  // ─── Post-Consultation (Rating & Prescription) Loader ──────────────────
  useEffect(() => {
    if (sessionState !== 'completed' || !meetingId) return;

    let isMounted = true;
    const loadPostConsultation = async () => {
      // 1. Fetch prescription if any
      try {
        const rx = await prescriptionApi.getMeetingPrescription(meetingId);
        if (isMounted && rx) {
          setPrescription(rx);
        }
      } catch (err) {
        // If doctor and no prescription yet, inspect AI documentation status
        if (isMounted && user?.role === 'doctor') {
          consultationAiApi.getStatus(meetingId)
            .then((status) => {
              if (!isMounted) return;
              if (status.has_approved_extraction) {
                prescriptionApi.getMeetingPrescription(meetingId).then((p) => {
                  if (isMounted && p) setPrescription(p);
                }).catch(() => {});
              } else if (status.extraction_status === 'completed') {
                setAiDraftState('ready');
                setAiDraftMessage('AI prescription draft is ready for review.');
              } else if (
                status.extraction_status === 'processing' ||
                status.transcription_status === 'processing' ||
                status.has_doctor_audio ||
                status.has_patient_audio
              ) {
                setAiDraftState('processing');
                setAiDraftMessage('AI is preparing the prescription from consultation dialogue...');
              }
            })
            .catch(() => {});
        }
      }

      // 2. If patient, check if already rated
      if (user?.role === 'patient') {
        try {
          const r = await ratingApi.getMeetingRating(meetingId);
          if (isMounted && r) {
            setHasRated(true);
            setUserRating(r.rating);
          }
        } catch (err) {
          // Not rated yet -> auto open rating modal
          if (isMounted) {
            setShowRatingModal(true);
          }
        }
      }
    };

    loadPostConsultation();
    return () => {
      isMounted = false;
    };
  }, [sessionState, meetingId, user?.role]);

  // ─── AI Extraction Background Poller (Doctor Only) ──────────────────────
  useEffect(() => {
    if (aiDraftState !== 'processing' || !meetingId || user?.role !== 'doctor') {
      if (aiPollingTimerRef.current) {
        clearInterval(aiPollingTimerRef.current);
        aiPollingTimerRef.current = null;
      }
      return;
    }

    let isPolling = true;

    const pollStatus = async () => {
      try {
        const targetId = meeting?.id || meetingId;
        const res = await consultationAiApi.getStatus(targetId);
        if (!isPolling) return;

        if (res.has_approved_extraction) {
          setAiDraftState(null);
          prescriptionApi.getMeetingPrescription(targetId).then((p) => {
            if (isPolling && p) setPrescription(p);
          }).catch(() => {});
          return;
        }

        if (res.extraction_status === 'completed') {
          setAiDraftState('ready');
          setAiDraftMessage('Prescription draft ready!');
          setShowAIExtractionReview(true);
          setToast({
            type: 'success',
            message: 'Prescription draft prepared by AI! Opening review dialog...',
          });
          if (aiPollingTimerRef.current) {
            clearInterval(aiPollingTimerRef.current);
            aiPollingTimerRef.current = null;
          }
        } else if (res.extraction_status === 'failed' || res.transcription_status === 'failed') {
          setAiDraftState('failed');
          setAiDraftMessage(
            res.extraction_error || res.transcript_error || 'AI transcription/extraction could not be completed.'
          );
          setToast({
            type: 'warning',
            message: 'AI draft preparation failed. You can write the prescription manually or retry.',
          });
          if (aiPollingTimerRef.current) {
            clearInterval(aiPollingTimerRef.current);
            aiPollingTimerRef.current = null;
          }
        } else if (res.extraction_status === 'processing') {
          setAiDraftMessage('Extracting diagnoses, medicines, dosages, and instructions...');
        } else if (res.transcription_status === 'processing') {
          setAiDraftMessage('Transcribing dialogue with Whisper Speech-to-Text...');
        }
      } catch (err) {
        console.warn('AI background poller error:', err);
      }
    };

    // Run immediate check and then every 2.5 seconds
    pollStatus();
    aiPollingTimerRef.current = setInterval(pollStatus, 2500);

    return () => {
      isPolling = false;
      if (aiPollingTimerRef.current) {
        clearInterval(aiPollingTimerRef.current);
        aiPollingTimerRef.current = null;
      }
    };
  }, [aiDraftState, meetingId, meeting?.id, user?.role]);


  // Attach local stream to <video> as soon as element and stream are both available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ─── Fetch meeting documents immediately and refresh on panel toggle ───
  useEffect(() => {
    if (!meeting) return;

    const fetchDocs = async () => {
      setDocsLoading(true);
      try {
        const targetId = meeting.id || meetingId;
        const docs = await meetingApi.getMeetingPatientDocuments(targetId);
        if (docs && docs.length > 0) {
          setMeetingDocs(docs);
        }
      } catch (err) {
        console.error('Failed to load meeting documents:', err);
      } finally {
        setDocsLoading(false);
      }
    };

    fetchDocs();
  }, [meeting?.id, meetingId, showDocPanel]);

  // ─── Auto-fetch document blob URL whenever in original mode ───────────
  useEffect(() => {
    if (docViewMode !== 'original' || !selectedDoc || !meeting) return;
    const docId = selectedDoc.patient_document_id || selectedDoc.id;
    if (!docId) return;

    let isMounted = true;
    setDocBlobLoading(true);

    const targetMeetingId = meeting.id || meetingId;
    meetingApi
      .getMeetingPatientDocumentBlobUrl(targetMeetingId, docId)
      .then((blobUrl) => {
        if (!isMounted) {
          window.URL.revokeObjectURL(blobUrl);
          return;
        }
        setDocBlobUrl(blobUrl);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load document for viewing:', err);
        setToast({ type: 'error', message: 'Could not load document preview.' });
      })
      .finally(() => {
        if (isMounted) setDocBlobLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [docViewMode, selectedDoc?.patient_document_id, selectedDoc?.id, meeting?.id, meetingId]);

  // ─── Cleanup blob URL when changing docs or closing ────────────────────
  useEffect(() => {
    return () => {
      if (docBlobUrl) {
        window.URL.revokeObjectURL(docBlobUrl);
      }
    };
  }, [docBlobUrl]);

  // ─── Document Panel Handlers ──────────────────────────────────────────
  const handleSelectDoc = useCallback((doc, mode = 'summary') => {
    if (docBlobUrl) {
      window.URL.revokeObjectURL(docBlobUrl);
      setDocBlobUrl(null);
    }
    setSelectedDoc(doc);
    setDocPanelTab('files');
    setDocViewMode(mode);
  }, [docBlobUrl]);

  const handleBackToList = useCallback(() => {
    if (docBlobUrl) {
      window.URL.revokeObjectURL(docBlobUrl);
      setDocBlobUrl(null);
    }
    setSelectedDoc(null);
    setDocViewMode('summary');
  }, [docBlobUrl]);

  const handleViewOriginal = useCallback(() => {
    setDocViewMode('original');
  }, []);

  const handleViewOriginalForDoc = useCallback((doc) => {
    if (docBlobUrl) {
      window.URL.revokeObjectURL(docBlobUrl);
      setDocBlobUrl(null);
    }
    setSelectedDoc(doc);
    setDocPanelTab('files');
    setDocViewMode('original');
  }, [docBlobUrl]);

  const handleSummarizeSingleDoc = useCallback(async (docToSummarize) => {
    const targetDoc = docToSummarize || selectedDoc;
    if (!targetDoc || !meeting) return;
    setIsSummarizing(true);
    try {
      const result = await meetingApi.summarizeMeetingPatientDocument(
        meeting.id,
        targetDoc.patient_document_id,
        true
      );
      setMeetingDocs((prev) =>
        prev.map((d) =>
          d.patient_document_id === targetDoc.patient_document_id
            ? {
                ...d,
                ai_summary: result.summary,
                ai_summary_status: result.status,
                ai_summary_generated_at: result.generated_at,
              }
            : d
        )
      );
      if (selectedDoc && selectedDoc.patient_document_id === targetDoc.patient_document_id) {
        setSelectedDoc((prev) => ({
          ...prev,
          ai_summary: result.summary,
          ai_summary_status: result.status,
          ai_summary_generated_at: result.generated_at,
        }));
      }
      setToast({ type: 'success', message: `Summary generated for ${targetDoc.label || targetDoc.original_filename}` });
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'documents-updated' }));
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to generate summary.' });
    } finally {
      setIsSummarizing(false);
    }
  }, [selectedDoc, meeting]);

  const handleSummarizeAllDocs = useCallback(async (forceRefresh = true) => {
    if (!meeting || meetingDocs.length === 0) return;
    setIsBulkSummarizing(true);
    setBulkProgress({ current: 0, total: meetingDocs.length, currentFileName: '' });
    setDocPanelTab('all_summaries');
    setSelectedDoc(null);

    let updatedDocs = [...meetingDocs];

    for (let i = 0; i < meetingDocs.length; i++) {
      const doc = meetingDocs[i];
      const fileName = doc.label || doc.original_filename;
      setBulkProgress({ current: i + 1, total: meetingDocs.length, currentFileName: fileName });

      try {
        const result = await meetingApi.summarizeMeetingPatientDocument(
          meeting.id,
          doc.patient_document_id,
          true
        );
        updatedDocs = updatedDocs.map((d) =>
          d.patient_document_id === doc.patient_document_id
            ? {
                ...d,
                ai_summary: result.summary,
                ai_summary_status: result.status,
                ai_summary_generated_at: result.generated_at,
              }
            : d
        );
        setMeetingDocs([...updatedDocs]);
      } catch (err) {
        console.error(`Failed to summarize doc ${doc.id}:`, err);
      }
    }

    setIsBulkSummarizing(false);
    setToast({ type: 'success', message: 'All documents processed by AI!' });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'documents-updated' }));
    }
  }, [meeting, meetingDocs]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ─── Check rejoin eligibility whenever sessionState changes ───────────
  useEffect(() => {
    if (!meeting || sessionState !== 'left') return;

    const checkRejoin = () => {
      const now = Date.now();
      const endTime = new Date(meeting.end_time).getTime();
      if (now < endTime) {
        setCanRejoin(true);
      } else {
        setCanRejoin(false);
        setSessionState('completed');
      }
    };

    checkRejoin();
    const id = setInterval(checkRejoin, 1000);
    return () => clearInterval(id);
  }, [meeting, sessionState]);

  // ─── Resilient Web Speech Live Transcription Manager ──────────────────
  const commitFinalSegment = (text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    const role = user?.role === 'doctor' ? 'doctor' : 'patient';
    const defaultName = role === 'doctor'
      ? (meeting?.doctor_name ? `Dr. ${meeting.doctor_name}` : (user?.full_name || 'Doctor'))
      : (meeting?.patient_name || (user?.full_name || 'Patient'));

    const segment = {
      id: `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      speaker: role,
      participant: role,
      speakerName: defaultName,
      text: trimmed,
      is_final: true,
      timestamp: parseFloat(Math.max(0, (Date.now() - callStartTimeRef.current) / 1000).toFixed(2)),
      start_time: parseFloat(Math.max(0, (Date.now() - callStartTimeRef.current) / 1000).toFixed(2)),
      lang: speechLangRef.current || 'en-US',
    };

    // 1. Commit to local live transcript state (with deduplication)
    setLiveTranscript((prev) => {
      const isDuplicate = prev.some(
        (s) =>
          s.id === segment.id ||
          (s.speaker === segment.speaker &&
            s.text.toLowerCase() === segment.text.toLowerCase() &&
            Math.abs(s.timestamp - segment.timestamp) < 2.5)
      );
      if (isDuplicate) return prev;
      const next = [...prev, segment];
      next.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      liveTranscriptRef.current = next;
      return next;
    });

    // 2. Clear interim caption
    setInterimCaption(null);

    // 3. Broadcast final segment to peer via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'transcript-segment',
          ...segment,
        })
      );
    }
    console.log(`[SPEECH_RECOGNITION] [FINAL] [${role.toUpperCase()}]: "${trimmed}"`);
  };

  const updateInterimSegment = (text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    const role = user?.role === 'doctor' ? 'doctor' : 'patient';
    const defaultName = role === 'doctor'
      ? (meeting?.doctor_name ? `Dr. ${meeting.doctor_name}` : (user?.full_name || 'Doctor'))
      : (meeting?.patient_name || (user?.full_name || 'Patient'));

    // 1. Update local interim caption display
    setInterimCaption({
      speaker: role,
      speakerName: defaultName,
      text: trimmed,
    });

    // 2. Broadcast interim caption to peer via WebSocket so remote sees live speech
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'transcript-segment',
          speaker: role,
          participant: role,
          speakerName: defaultName,
          text: trimmed,
          is_final: false,
        })
      );
    }
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[SPEECH_RECOGNITION] SpeechRecognition API not supported in this browser');
      setTranscriptionStatus('unsupported');
      return null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = speechLangRef.current || 'en-US';

      recognition.onstart = () => {
        isStartingRef.current = false;
        isRecognizingRef.current = true;
        restartAttemptsRef.current = 0;
        if (shouldRecognizeRef.current) {
          setTranscriptionStatus('transcribing');
        }
        console.log(`[SPEECH_RECOGNITION] Started listening in language: ${recognition.lang}`);
      };

      recognition.onresult = (event) => {
        if (!shouldRecognizeRef.current) return;

        let interimText = '';
        const now = Date.now();

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript?.trim();
          if (!text) continue;

          if (res.isFinal) {
            // Prevent immediate duplicate sentence commit (same text within 3s)
            if (
              lastFinalTextRef.current === text &&
              now - lastFinalTimeRef.current < 3000
            ) {
              console.debug('[SPEECH_RECOGNITION] Suppressed duplicate final segment:', text);
              continue;
            }

            lastFinalTextRef.current = text;
            lastFinalTimeRef.current = now;
            commitFinalSegment(text);
          } else {
            interimText += (interimText ? ' ' : '') + text;
          }
        }

        if (interimText) {
          updateInterimSegment(interimText);
        }
      };

      recognition.onerror = (event) => {
        const error = event.error;
        console.warn(`[SPEECH_RECOGNITION] Error: ${error}`);
        isStartingRef.current = false;

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          shouldRecognizeRef.current = false;
          isRecognizingRef.current = false;
          setTranscriptionStatus('permission_denied');
          setToast({
            type: 'warning',
            message: 'Microphone/speech recognition permission is required for live transcription.',
          });
          return;
        }

        if (error === 'no-speech') {
          // Normal pause in speech — onend will follow and restart smoothly
          return;
        }

        if (error === 'aborted') {
          // Aborted intentionally or via restart
          return;
        }

        if (shouldRecognizeRef.current) {
          setTranscriptionStatus('reconnecting');
          scheduleRestart(500);
        }
      };

      recognition.onend = () => {
        isStartingRef.current = false;
        isRecognizingRef.current = false;
        console.log('[SPEECH_RECOGNITION] Ended (onend fired)');

        // Clear interim caption on speech end
        setInterimCaption(null);

        // If consultation is still active, schedule controlled automatic restart
        if (shouldRecognizeRef.current) {
          setTranscriptionStatus('reconnecting');
          scheduleRestart(250);
        }
      };

      recognitionRef.current = recognition;
      return recognition;
    } catch (err) {
      console.warn('[SPEECH_RECOGNITION] Initialization failed:', err);
      setTranscriptionStatus('unsupported');
      return null;
    }
  };

  const scheduleRestart = (delay = 250) => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (!shouldRecognizeRef.current) return;

    restartAttemptsRef.current = (restartAttemptsRef.current || 0) + 1;
    // Controlled exponential backoff after multiple rapid restarts
    const backoff = restartAttemptsRef.current > 4 ? 1200 : delay;

    restartTimerRef.current = setTimeout(() => {
      if (!shouldRecognizeRef.current) return;
      startRecognition();
    }, backoff);
  };

  const startRecognition = () => {
    if (!shouldRecognizeRef.current) return;
    if (isStartingRef.current || isRecognizingRef.current) return;

    try {
      let rec = recognitionRef.current;
      if (!rec) {
        rec = initSpeechRecognition();
      }
      if (!rec) return;

      isStartingRef.current = true;
      rec.start();
    } catch (err) {
      isStartingRef.current = false;
      console.warn('[SPEECH_RECOGNITION] Start failed, re-initializing instance:', err);
      try {
        const freshRec = initSpeechRecognition();
        if (freshRec && shouldRecognizeRef.current) {
          isStartingRef.current = true;
          freshRec.start();
        }
      } catch (retryErr) {
        isStartingRef.current = false;
        scheduleRestart(800);
      }
    }
  };

  const stopRecognition = () => {
    shouldRecognizeRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    isStartingRef.current = false;
    isRecognizingRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        try { recognitionRef.current.abort(); } catch (e2) {}
      }
    }
    setInterimCaption(null);
    console.log('[SPEECH_RECOGNITION] Stopped cleanly');
  };

  const handleLanguageChange = (newLang) => {
    if (newLang === speechLang) return;
    setSpeechLang(newLang);
    speechLangRef.current = newLang;
    console.log(`[SPEECH_RECOGNITION] Switching language to: ${newLang}`);

    if (shouldRecognizeRef.current) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = newLang;
          recognitionRef.current.stop();
        } catch (e) {}
      }
      scheduleRestart(150);
    }
  };

  // ─── MediaRecorder Consultation Audio Capture ───────────────────────────
  const startAudioRecording = (stream) => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const audioStream = new MediaStream([audioTrack]);
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      audioChunksRef.current = [];
      const recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      console.log('Consultation audio recording started for AI documentation');
    } catch (err) {
      console.warn('MediaRecorder could not be started:', err);
    }
  };

  const stopAndUploadAudio = async (targetMeetingId) => {
    const id = targetMeetingId || meeting?.id || meetingId;
    if (!id) return null;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = () => resolve();
          mediaRecorderRef.current.stop();
          setTimeout(resolve, 800); // Safety fallback
        });
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (audioChunksRef.current.length > 0) {
      try {
        const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        const ext = mime.includes('mp4') ? '.mp4' : '.webm';
        const role = user?.role || 'doctor';
        console.log(`Uploading ${role} consultation audio (${audioBlob.size} bytes)...`);
        const res = await consultationAiApi.uploadAudio(id, audioBlob, `${role}${ext}`);
        return res;
      } catch (err) {
        console.error('Failed to upload consultation audio:', err);
      }
    }
    return null;
  };

  // Helper to ensure audio and video tracks are attached to the PeerConnection
  const attachTracksToPC = (pc, stream) => {
    const activeStream = stream || localStreamRef.current;
    if (!pc || !activeStream) return;
    const senders = pc.getSenders();
    activeStream.getTracks().forEach((track) => {
      const already = senders.some((s) => s.track && s.track.id === track.id);
      if (!already) {
        try {
          pc.addTrack(track, activeStream);
          console.log(`Attached ${track.kind} track to PC (enabled: ${track.enabled})`);
        } catch (err) {
          console.warn(`Failed to add ${track.kind} track to PC:`, err);
        }
      }
    });
  };

  const unlockAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().then(() => {
        setAudioAutoplayBlocked(false);
      }).catch((e) => console.warn('Audio play still prevented by browser:', e));
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().catch(() => {});
    }
  };

  // ─── 2. Safe Media Acquisition with Timeout Fallback ─────────────────────
  async function initializeMediaAndSignaling(meetingData) {
    let stream = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        setMediaStatus('requesting');

        // Race against a 6-second timeout so user is never frozen
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('permission_timeout')), 6000)
        );

        stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }),
          timeoutPromise,
        ]);

        // Explicitly ensure audio tracks are enabled
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
          console.log('Local mic audio track ready:', track.label, track.enabled);
        });

        localStreamRef.current = stream;
        setLocalStream(stream);
        setMediaStatus('ready');
        startAudioRecording(stream);
        shouldRecognizeRef.current = true;
        startRecognition();
      } catch (videoErr) {
        console.warn('Video acquisition failed or timed out. Trying audio-only:', videoErr);

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          stream.getAudioTracks().forEach((track) => {
            track.enabled = true;
          });
          localStreamRef.current = stream;
          setLocalStream(stream);
          setIsVideoMuted(true);
          setMediaStatus('no-camera');
          startAudioRecording(stream);
          shouldRecognizeRef.current = true;
          startRecognition();
        } catch (audioErr) {
          console.warn('Microphone also unavailable/blocked:', audioErr);
          setMediaStatus('blocked');
          setToast({
            type: 'warning',
            message: 'Camera and microphone are blocked or not detected. You can still join to view the screen.',
          });
        }
      }
    } else {
      setMediaStatus('blocked');
      setToast({
        type: 'warning',
        message: 'Media devices are not supported on this browser or insecure connection.',
      });
    }

    // Always connect WebSocket signaling so the room functions regardless of local media
    connectWebSocket(meetingData, stream);
  };

  const createPeerConnection = (meetingData, stream) => {
    if (peerConnectionRef.current) {
      attachTracksToPC(peerConnectionRef.current, stream);
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    attachTracksToPC(pc, stream);

    // Remote track handler - routes audio and video cleanly to respective elements
    pc.ontrack = (event) => {
      console.log('WebRTC ontrack received:', event.track.kind, event.track.id);

      // Dedicated audio track routing to ensure microphone sound is never muted
      if (event.track.kind === 'audio') {
        if (remoteAudioRef.current) {
          const audioStream = (event.streams && event.streams[0])
            ? event.streams[0]
            : new MediaStream([event.track]);
          remoteAudioRef.current.srcObject = audioStream;
          remoteAudioRef.current.play().then(() => {
            setAudioAutoplayBlocked(false);
          }).catch((err) => {
            console.warn('Remote audio autoplay blocked by browser policy:', err);
            setAudioAutoplayBlocked(true);
          });
        }
      }

      // Video track routing
      if (remoteVideoRef.current) {
        if (event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        } else {
          let currentStream = remoteVideoRef.current.srcObject;
          if (!currentStream) {
            currentStream = new MediaStream();
            remoteVideoRef.current.srcObject = currentStream;
          }
          if (!currentStream.getTracks().includes(event.track)) {
            currentStream.addTrack(event.track);
          }
        }
        remoteVideoRef.current.play().catch((err) => {
          console.warn('Remote video autoplay blocked:', err);
        });
      }

      setPeerConnected(true);
      setBothJoined(true);
    };

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
          })
        );
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setPeerConnected(true);
        setBothJoined(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setPeerConnected(false);
        setBothJoined(false);
      }
    };

    return pc;
  };

  // ─── 3. WebSocket Signaling ─────────────────────────────────────────────
  const connectWebSocket = (meetingData, activeStream) => {
    const { accessToken } = getStoredTokens();
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Safely extract hostname for WebSocket signaling server
    let host = window.location.host;
    try {
      if (API_BASE_URL) {
        const parsedApi = new URL(API_BASE_URL, window.location.origin);
        host = parsedApi.host || window.location.host;
      }
    } catch (err) {
      console.warn('Could not parse API_BASE_URL, defaulting to window.location.host:', err);
    }

    const wsUrl = `${wsProto}//${host}/api/v1/meetings/ws/${meetingData.room_id}?token=${accessToken}`;
    console.log('Connecting to meeting signaling server:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to meeting signaling server:', wsUrl);
      setTranscriptionStatus('transcribing');
    };

    ws.onerror = (err) => {
      console.error('Signaling WebSocket error:', err);
      setTranscriptionStatus('connecting');
      setToast({
        type: 'error',
        message: 'Could not connect to video signaling server. Please check your network or server proxy.',
      });
    };

    ws.onclose = (e) => {
      console.log('Signaling WebSocket closed:', e.code, e.reason);
      setTranscriptionStatus('connecting');
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'room-status':
            if (data.peer_count >= 2) {
              const other = data.participants.find((p) => p.user_id !== user?.id);
              if (other) {
                setPeerName(other.name);
              }
            }
            break;

          case 'peer-joined': {
            setPeerName(data.name || 'Participant');
            setToast({ type: 'info', message: `${data.name} joined the consultation.` });

            // Create PeerConnection and initiate offer to newcomer
            try {
              const pc = createPeerConnection(meetingData, activeStream);
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
              });
              await pc.setLocalDescription(offer);

              ws.send(
                JSON.stringify({
                  type: 'offer',
                  sdp: pc.localDescription,
                })
              );
              console.log('WebRTC offer sent to newly joined participant');
            } catch (err) {
              console.error('Failed to create offer on peer-joined:', err);
            }
            break;
          }

          case 'offer': {
            try {
              const pcAns = createPeerConnection(meetingData, activeStream);

              // Handle WebRTC glare if we happened to have a local offer
              if (pcAns.signalingState === 'have-local-offer') {
                await pcAns.setLocalDescription({ type: 'rollback' });
              }

              await pcAns.setRemoteDescription(new RTCSessionDescription(data.sdp));
              const answer = await pcAns.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
              });
              await pcAns.setLocalDescription(answer);

              ws.send(
                JSON.stringify({
                  type: 'answer',
                  sdp: pcAns.localDescription,
                })
              );
              console.log('WebRTC answer sent back');
            } catch (err) {
              console.error('Failed to handle incoming offer:', err);
            }
            break;
          }

          case 'answer': {
            try {
              const pcOffer = peerConnectionRef.current;
              if (pcOffer && pcOffer.signalingState === 'have-local-offer') {
                await pcOffer.setRemoteDescription(new RTCSessionDescription(data.sdp));
                console.log('WebRTC remote description set from answer successfully');
              }
            } catch (err) {
              console.error('Failed to handle incoming answer:', err);
            }
            break;
          }

          case 'ice-candidate': {
            const pcCandidate = peerConnectionRef.current;
            if (pcCandidate && data.candidate) {
              try {
                await pcCandidate.addIceCandidate(new RTCIceCandidate(data.candidate));
              } catch (e) {
                console.warn('Error adding ICE candidate:', e);
              }
            }
            break;
          }

          case 'peer-left':
            setPeerConnected(false);
            setBothJoined(false);
            setPeerName('Participant disconnected');
            setToast({ type: 'info', message: 'The other participant has left the consultation.' });
            break;

          case 'transcript-segment': {
            const isFinal = data.is_final !== false;
            const speaker = data.speaker || data.participant || 'peer';
            const speakerName = data.speakerName || data.speaker_name || (speaker === 'doctor' ? 'Doctor' : 'Patient');
            const text = (data.text || '').trim();
            if (!text) break;

            if (!isFinal) {
              // Remote peer's live interim speech preview
              setInterimCaption({
                speaker,
                speakerName,
                text,
              });
              setTimeout(() => {
                setInterimCaption((curr) => (curr?.text === text ? null : curr));
              }, 3500);
            } else {
              // Final committed segment from remote peer
              const segment = {
                id: data.id || `${speaker}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                speaker,
                participant: speaker,
                speakerName,
                text,
                is_final: true,
                timestamp: typeof data.timestamp === 'number'
                  ? data.timestamp
                  : parseFloat(Math.max(0, (Date.now() - callStartTimeRef.current) / 1000).toFixed(2)),
                start_time: data.start_time ?? data.timestamp ?? 0,
              };

              setLiveTranscript((prev) => {
                const already = prev.some(
                  (s) =>
                    s.id === segment.id ||
                    (s.speaker === segment.speaker &&
                      s.text.toLowerCase() === segment.text.toLowerCase() &&
                      Math.abs(s.timestamp - segment.timestamp) < 2.5)
                );
                if (already) return prev;
                const next = [...prev, segment];
                next.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                liveTranscriptRef.current = next;
                return next;
              });

              setInterimCaption(null);
            }
            break;
          }

          case 'meeting-ended':
            setSessionState('completed');
            setToast({ type: 'info', message: 'Consultation has been concluded.' });

            // Upload patient's audio recording BEFORE cleanup destroys the MediaRecorder
            // This ensures the patient's voice is available for Whisper transcription
            if (meetingData?.id) {
              (async () => {
                try {
                  await stopAndUploadAudio(meetingData.id);
                  console.log('Patient audio uploaded on meeting-ended');
                } catch (audioErr) {
                  console.warn('Patient audio upload on meeting-ended failed:', audioErr);
                }
                // Save live transcript segments as fallback
                try {
                  await consultationAiApi.saveLiveTranscript(meetingData.id, {
                    segments: liveTranscriptRef.current,
                  });
                } catch (saveErr) {
                  console.warn('Live transcript save on meeting-ended failed:', saveErr);
                }
                cleanupCall();
              })();
            } else {
              cleanupCall();
            }
            break;

          case 'documents-updated':
            if (meetingData) {
              meetingApi.getMeetingPatientDocuments(meetingData.id)
                .then((docs) => {
                  setMeetingDocs(docs || []);
                  setToast({ type: 'info', message: 'Medical document summaries updated.' });
                })
                .catch((e) => console.warn('Failed to refresh docs on WS update:', e));
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling signaling message:', err);
      }
    };

    ws.onclose = (e) => {
      console.log('Signaling WebSocket closed:', e.code, e.reason);
    };
  };

  // ─── Controls & Actions ────────────────────────────────────────────────
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muted = !audioTrack.enabled;
        setIsAudioMuted(muted);

        if (muted) {
          shouldRecognizeRef.current = false;
          stopRecognition();
          setTranscriptionStatus('muted');
        } else {
          shouldRecognizeRef.current = true;
          setTranscriptionStatus('transcribing');
          startRecognition();
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  // ─── Leave Call (NOT end meeting) ─────────────────────────────────────
  const handleLeaveCall = async () => {
    setShowLeaveWarning(false);

    try {
      stopRecognition();

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'peer-left-voluntary',
            role: user?.role,
          })
        );
      }

      // Upload audio for BOTH doctor and patient when leaving
      try {
        await stopAndUploadAudio(meeting?.id || meetingId);
      } catch (uploadErr) {
        console.warn('Audio upload on leave failed:', uploadErr);
      }

      cleanupCall();
      setSessionState('left');
      setBothJoined(false);
      setPeerConnected(false);
    } catch (err) {
      console.error('Error during leave:', err);
      cleanupCall();
      setSessionState('left');
    }
  };

  // ─── Rejoin Meeting ───────────────────────────────────────────────────
  const handleRejoin = async () => {
    setSessionState('active');
    setPeerName('Waiting for participant to join...');
    setMediaStatus('requesting');

    try {
      const data = await meetingApi.getMeetingDetails(meetingId);
      setMeeting(data);

      if (data.status === 'completed') {
        setSessionState('completed');
        return;
      }

      const now = Date.now();
      const endTime = new Date(data.end_time).getTime();
      if (now > endTime) {
        setSessionState('completed');
        setToast({ type: 'info', message: 'Meeting time has expired. Cannot rejoin.' });
        return;
      }

      await initializeMediaAndSignaling(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to rejoin meeting.' });
      setSessionState('left');
    }
  };

  // ─── End Meeting Fully (Doctor only) ──────────────────────────────────
  const handleConfirmEndMeeting = async () => {
    setIsEnding(true);
    try {
      stopRecognition();

      // Notify peer that meeting is ending (patient will upload their audio too)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'meeting-ended',
            ended_by: user?.role,
          })
        );
      }

      // Upload doctor's audio recording BEFORE ending the meeting
      // This is critical — without this, doctor's voice is never transcribed by Whisper
      try {
        await stopAndUploadAudio(meeting.id);
        console.log('Doctor audio uploaded successfully for Whisper transcription');
      } catch (audioErr) {
        console.warn('Doctor audio upload failed (live transcript will still be used):', audioErr);
      }

      // Save live transcript to backend (this auto-triggers AI Consultation Summary!)
      const segmentsToSave = liveTranscriptRef.current || [];
      try {
        await consultationAiApi.saveLiveTranscript(meeting.id, {
          segments: segmentsToSave,
          doctor_notes: doctorNotes.trim() || undefined,
        });
      } catch (saveErr) {
        console.warn('Live transcript save notice:', saveErr);
      }

      // End meeting in DB
      await meetingApi.endMeeting(meeting.id, {
        doctor_notes: doctorNotes.trim() || undefined,
      });

      // Trigger Whisper audio transcription if audio files were uploaded
      // This produces a much more accurate transcript than the live SpeechRecognition API
      // Wait 3s for patient's audio upload to arrive (they upload in parallel on meeting-ended event)
      try {
        await new Promise((r) => setTimeout(r, 3000));
        await consultationAiApi.startTranscription(meeting.id);
        console.log('Whisper transcription pipeline triggered');
      } catch (transcribeErr) {
        // Non-fatal — live transcript is already saved as fallback
        console.warn('Whisper transcription trigger failed (live transcript is the fallback):', transcribeErr);
      }

      setShowEndModal(false);
      setSessionState('completed');
      setToast({ type: 'info', message: 'Consultation concluded. AI is preparing the consultation summary.' });
      cleanupCall();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to end consultation.' });
    } finally {
      setIsEnding(false);
    }
  };

  function cleanupCall() {
    stopRecognition();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setLocalStream(null);
  };

  // ─── Loading Screen ──────────────────────────────────────────────────────
  if (isLoadingMeeting) {
    return <Loader fullScreen text="Entering secure telemedicine consultation..." />;
  }

  // ─── Error Screen ────────────────────────────────────────────────────────
  if (meetingError) {
    return (
      <div className="container page-wrapper" style={{ maxWidth: '550px', textAlign: 'center', marginTop: '3rem' }}>
        <div className="card animate-slide-up" style={{ padding: '2.5rem 1.5rem' }}>
          <AlertCircle size={44} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Unable to Access Consultation</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {meetingError}
          </p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // ─── Left Session — Rejoin Available ─────────────────────────────────────
  if (sessionState === 'left') {
    return (
      <div className="container page-wrapper" style={{ maxWidth: '650px', textAlign: 'center', marginTop: '2rem' }}>
        <div className="card animate-slide-up" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '1rem',
              background: canRejoin ? '#dbeafe' : '#fee2e2',
              borderRadius: '50%',
              color: canRejoin ? '#2563eb' : '#dc2626',
              marginBottom: '1rem',
            }}
          >
            {canRejoin ? <RefreshCw size={44} /> : <AlertCircle size={44} />}
          </div>

          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
            {canRejoin ? 'You Left the Consultation' : 'Session Time Expired'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {canRejoin
              ? 'You have exited the meeting room. You can rejoin the consultation at any time before the scheduled window expires.'
              : 'The scheduled meeting window has expired. You can no longer rejoin this consultation.'}
          </p>

          {/* End time countdown for rejoin window */}
          {canRejoin && meeting && (
            <RejoinCountdown endTime={meeting.end_time} />
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            {canRejoin && (
              <Button
                variant="primary"
                onClick={handleRejoin}
                icon={<LogIn size={16} />}
              >
                Rejoin Consultation
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => navigate(user?.role === 'doctor' ? '/doctor/portal' : '/patient/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Call Concluded Summary View ─────────────────────────────────────────
  if (sessionState === 'completed') {
    return (
      <div className="container page-wrapper" style={{ maxWidth: '650px', textAlign: 'center', marginTop: '2rem' }}>
        <div className="card animate-slide-up" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '1rem',
              background: '#dcfce7',
              borderRadius: '50%',
              color: '#16a34a',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle2 size={44} />
          </div>

          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Consultation Completed</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            The consultation has been successfully concluded and recorded in your medical history.
          </p>

          {doctorNotes && (
            <div
              style={{
                textAlign: 'left',
                background: 'var(--bg-alt)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <FileText size={16} color="var(--primary)" /> Doctor Clinical Notes
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {doctorNotes}
              </p>
            </div>
          )}

          {/* Post-Consultation Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            {user?.role === 'patient' && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="primary"
                  onClick={() => setShowConsultationSummary(true)}
                  icon={<Sparkles size={16} />}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  View Consultation AI Summary
                </Button>

                {prescription && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowPrescriptionView(true)}
                    icon={<Pill size={16} color="#059669" />}
                  >
                    View Prescription ({prescription.medicines?.length || 0} Meds)
                  </Button>
                )}

                {hasRated ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1rem',
                      background: '#fef9c3',
                      border: '1px solid #fde047',
                      borderRadius: '8px',
                      color: '#854d0e',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                    }}
                  >
                    <Star size={16} fill="#eab308" color="#eab308" />
                    <span>You Rated: {userRating}/5 Stars</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setShowRatingModal(true)}
                    icon={<Star size={16} fill="#ffffff" />}
                  >
                    Rate Doctor (1–5 Stars)
                  </Button>
                )}
              </div>
            )}

            {user?.role === 'doctor' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <Button
                    variant="primary"
                    onClick={() => setShowConsultationSummary(true)}
                    icon={<Sparkles size={16} />}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    View Consultation AI Summary
                  </Button>

                  {prescription ? (
                    <Button
                      variant="secondary"
                      onClick={() => setShowPrescriptionView(true)}
                      icon={<Pill size={16} color="#059669" />}
                    >
                      View Issued Prescription ({prescription.medicines?.length || 0} Meds)
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => setShowPrescriptionWriter(true)}
                      icon={<Pill size={16} />}
                    >
                      Write Prescription Manually
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button
              variant="secondary"
              onClick={() => navigate(user?.role === 'doctor' ? '/doctor/portal' : '/patient/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Post-Consultation Modals */}
        <DoctorRatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          meetingId={meetingId}
          doctorName={meeting?.doctor_name}
          onSuccess={(r) => {
            setHasRated(true);
            setUserRating(r.rating);
            setToast({ type: 'success', message: 'Thank you for your rating and feedback!' });
          }}
        />

        {/* Consultation AI Summary Modal */}
        <ConsultationSummaryModal
          isOpen={showConsultationSummary}
          onClose={() => setShowConsultationSummary(false)}
          meetingId={meetingId}
          isDoctor={user?.role === 'doctor'}
          doctorName={meeting?.doctor_name || 'Doctor'}
          patientName={meeting?.patient_name || 'Patient'}
          onOpenPrescription={() => {
            setShowConsultationSummary(false);
            setShowPrescriptionWriter(true);
          }}
        />

        <AIExtractionReview
          isOpen={showAIExtractionReview}
          onClose={() => setShowAIExtractionReview(false)}
          meetingId={meetingId}
          patientName={meeting?.patient_name}
          onApproved={(rx) => {
            setPrescription(rx);
            setShowAIExtractionReview(false);
            setToast({ type: 'success', message: 'Prescription approved & scheduled for reminders!' });
          }}
          onSwitchToManual={() => {
            setShowAIExtractionReview(false);
            setShowPrescriptionWriter(true);
          }}
        />

        <PrescriptionWriter
          isOpen={showPrescriptionWriter}
          onClose={() => setShowPrescriptionWriter(false)}
          meetingId={meetingId}
          patientName={meeting?.patient_name}
          onSuccess={(rx) => {
            setPrescription(rx);
            setToast({ type: 'success', message: 'Prescription issued! Automated reminders scheduled for patient.' });
          }}
        />

        <PrescriptionView
          isOpen={showPrescriptionView}
          onClose={() => setShowPrescriptionView(false)}
          prescription={prescription}
        />
      </div>
    );
  }

  // ─── Active Video Meeting Room View ──────────────────────────────────────
  return (
    <div
      onClick={unlockAudio}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 65px)',
        background: '#0f172a',
        color: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Leave Warning Modal */}
      <LeaveWarningModal
        isOpen={showLeaveWarning}
        onConfirm={handleLeaveCall}
        onCancel={() => setShowLeaveWarning(false)}
        isDoctor={user?.role === 'doctor'}
      />

      {/* Doctor End Consultation Confirmation Modal */}
      {showEndModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#1e293b',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '1.75rem',
              color: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={22} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>End Consultation</h3>
              </div>
              <button
                onClick={() => setShowEndModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Ending this consultation will mark it as <strong>completed</strong> for both you and the patient. You can optionally add clinical notes below.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Clinical Notes / Prescription Advice (Optional)
              </label>
              <textarea
                rows={4}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Enter diagnosis summary, recommended medicines, or follow-up instructions..."
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEndModal(false)}
                disabled={isEnding}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmEndMeeting}
                isLoading={isEnding}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#059669',
                }}
              >
                Complete Consultation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.4rem', background: '#3b82f6', borderRadius: 'var(--radius-sm)' }}>
            <Stethoscope size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Telemedicine Consultation Room
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Doctor: <strong>Dr. {meeting?.doctor_name || 'Specialist'}</strong> • Patient: <strong>{meeting?.patient_email}</strong>
            </div>
          </div>
        </div>

        {/* Security & Connection Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              background: bothJoined
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
              color: bothJoined ? '#34d399' : '#fbbf24',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${bothJoined ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: bothJoined ? '#34d399' : '#fbbf24',
              animation: bothJoined ? 'none' : 'blink 1.5s ease-in-out infinite',
            }} />
            {bothJoined ? 'Peer Connected' : 'Waiting for Peer'}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <ShieldCheck size={14} /> E2E Encrypted WebRTC
          </div>
        </div>
      </div>

      {/* Main Video Area + Document Panel (Flex Row) */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Video Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#020617' }}>
          {/* Dedicated Remote Audio Player (Unmuted, Always Active) */}
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
          />

          {/* Autoplay Audio Block Banner */}
          {audioAutoplayBlocked && (
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 50,
                background: 'rgba(239, 68, 68, 0.95)',
                color: '#fff',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
              }}
              onClick={unlockAudio}
            >
              <Mic size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Audio blocked by browser. Click here to enable sound!
              </span>
            </div>
          )}

          {/* Remote Video (Peer) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: peerConnected ? 'block' : 'none',
            }}
          />

          {/* Peer Waiting Placeholder */}
          {!peerConnected && (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8', padding: '2rem', position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  margin: '0 auto 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed rgba(255,255,255,0.2)',
                }}
              >
                <User size={40} color="#64748b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#f1f5f9', marginBottom: '0.5rem', fontWeight: 600 }}>
                {peerName}
              </h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.6, color: '#94a3b8' }}>
                You have entered the secure consultation room. When the other participant joins, your audio and video will connect automatically.
              </p>
            </div>
          )}

          {/* Local Video Picture-in-Picture */}
          <div
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              width: '220px',
              height: '145px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
              border: '2px solid rgba(255,255,255,0.2)',
              background: '#1e293b',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: mediaStatus === 'ready' && !isVideoMuted ? 'block' : 'none',
              }}
            />

            {mediaStatus === 'requesting' && (
              <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                Connecting camera...
              </div>
            )}

            {mediaStatus === 'no-camera' && (
              <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <Mic size={20} color="#10b981" style={{ marginBottom: '4px' }} />
                <div>Audio Only</div>
              </div>
            )}

            {mediaStatus === 'blocked' && (
              <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.7rem', color: '#f87171' }}>
                Camera/Mic blocked in browser
              </div>
            )}

            {mediaStatus === 'ready' && isVideoMuted && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Camera Off
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '8px',
                fontSize: '0.7rem',
                background: 'rgba(0,0,0,0.7)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              You ({user?.role === 'doctor' ? 'Doctor' : 'Patient'})
            </div>
          </div>
        </div>

        {/* ─── Document Panel (Right Side) ────────────────────────────── */}
        {showDocPanel && (
          <div className={`meeting-doc-panel ${panelExpanded ? 'expanded' : ''}`}>
            {/* Panel Header */}
            <div className="meeting-doc-panel-header">
              <h3>
                <FolderOpen size={16} color="#60a5fa" />
                Consultation Documents {meetingDocs.length > 0 && `(${meetingDocs.length})`}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="doc-panel-expand-btn"
                  onClick={() => setPanelExpanded((prev) => !prev)}
                  title={panelExpanded ? 'Compact panel width' : 'Expand panel width for easier reading'}
                  aria-label={panelExpanded ? 'Compact panel width' : 'Expand panel width'}
                >
                  {panelExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  type="button"
                  className="doc-panel-close-btn"
                  onClick={() => { setShowDocPanel(false); setSelectedDoc(null); }}
                  title="Close documents panel"
                  aria-label="Close documents panel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {docsLoading && (
              <div className="meeting-doc-loading">
                <div className="meeting-doc-loading-spinner" />
                <span>Loading documents...</span>
              </div>
            )}

            {/* Empty State */}
            {!docsLoading && meetingDocs.length === 0 && (
              <div className="meeting-doc-empty">
                <div className="meeting-doc-empty-icon">
                  <FileText size={24} color="#475569" />
                </div>
                <h4>No Documents Attached</h4>
                <p>No medical documents were shared for this consultation appointment.</p>
              </div>
            )}

            {/* Navigation Bar & Bulk Actions Toolbar (when docs exist) */}
            {!docsLoading && meetingDocs.length > 0 && (
              <div className="meeting-doc-subnav">
                <div className="meeting-doc-nav-tabs">
                  <button
                    type="button"
                    className={`meeting-doc-nav-tab ${docPanelTab === 'all_summaries' && !selectedDoc ? 'active' : ''}`}
                    onClick={() => {
                      setDocPanelTab('all_summaries');
                      setSelectedDoc(null);
                    }}
                  >
                    <Sparkles size={12} />
                    All Summaries
                    {meetingDocs.filter((d) => d.ai_summary).length > 0 && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.2)', color: '#93c5fd', padding: '1px 5px', borderRadius: '999px' }}>
                        {meetingDocs.filter((d) => d.ai_summary).length}/{meetingDocs.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`meeting-doc-nav-tab ${docPanelTab === 'files' || selectedDoc ? 'active' : ''}`}
                    onClick={() => {
                      setDocPanelTab('files');
                    }}
                  >
                    <List size={12} />
                    Files ({meetingDocs.length})
                  </button>
                </div>

                {/* Doctor Bulk Summarize Button */}
                {user?.role === 'doctor' && (
                  <button
                    type="button"
                    className="meeting-doc-btn-summarize-all"
                    onClick={() => handleSummarizeAllDocs(false)}
                    disabled={isBulkSummarizing}
                    title="AI analyzes each attached medical document sequentially and produces distinct summaries"
                  >
                    {isBulkSummarizing ? (
                      <>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#ffffff',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 0.6s linear infinite',
                          }}
                        />
                        <span>Analyzing ({bulkProgress.current}/{bulkProgress.total})...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>
                          {meetingDocs.every((d) => d.ai_summary)
                            ? 'Re-summarize All'
                            : 'Summarize All Documents'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Bulk Summarize Progress Indicator */}
            {isBulkSummarizing && (
              <div className="meeting-doc-bulk-progress">
                <div className="meeting-doc-bulk-progress-info">
                  <span>
                    Analyzing document {bulkProgress.current} of {bulkProgress.total}:{' '}
                    <strong style={{ color: '#ffffff' }}>{bulkProgress.currentFileName}</strong>
                  </span>
                  <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                </div>
                <div className="meeting-doc-bulk-progress-track">
                  <div
                    className="meeting-doc-bulk-progress-fill"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tab 1: All Summaries View */}
            {!docsLoading && meetingDocs.length > 0 && docPanelTab === 'all_summaries' && !selectedDoc && (
              <div className="meeting-doc-all-summaries">
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.25rem' }}>
                  <ShieldCheck size={14} color="#34d399" />
                  Clinical AI Summaries — Sequential Analysis per File
                </div>

                {meetingDocs.map((doc) => (
                  <div key={doc.id} className="meeting-doc-summary-card">
                    {/* Header with Document Name & Tag */}
                    <div className="meeting-doc-summary-card-header">
                      <div className="meeting-doc-card-title-group">
                        <FileText
                          size={16}
                          color={doc.mime_type === 'application/pdf' ? '#d97706' : '#3b82f6'}
                          style={{ flexShrink: 0 }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div className="meeting-doc-card-title">
                            {doc.label || doc.original_filename}
                          </div>
                          {doc.label && (
                            <div className="meeting-doc-card-subname">
                              {doc.original_filename}
                            </div>
                          )}
                        </div>
                        <span
                          className={`meeting-doc-item-badge ${
                            doc.ai_summary ? 'has-summary' : 'no-summary'
                          }`}
                        >
                          {doc.ai_summary ? 'Summary Ready' : 'Pending'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="meeting-doc-card-btn-view"
                        onClick={() => handleViewOriginalForDoc(doc)}
                        title={`View original ${doc.label || doc.original_filename}`}
                      >
                        <Eye size={12} />
                        View Original
                      </button>
                    </div>

                    {/* Summary Body */}
                    <div className="meeting-doc-summary-card-body">
                      {doc.ai_summary ? (
                        <>
                          {doc.ai_summary.split('\n').map((line, i) => (
                            <p key={i} style={{ margin: line.trim() ? '0 0 0.45rem' : '0 0 0.2rem' }}>
                              {line || '\u00A0'}
                            </p>
                          ))}
                        </>
                      ) : (
                        <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>No summary generated yet for this file.</span>
                          {user?.role === 'doctor' && (
                            <button
                              type="button"
                              className="meeting-doc-generate-btn"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                              onClick={() => handleSummarizeSingleDoc(doc)}
                              disabled={isSummarizing || isBulkSummarizing}
                            >
                              <Sparkles size={11} /> Summarize
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {doc.ai_summary_generated_at && (
                      <div className="meeting-doc-summary-card-footer">
                        <span>Generated: {new Date(doc.ai_summary_generated_at).toLocaleString()}</span>
                        <span>{doc.mime_type === 'application/pdf' ? 'PDF' : 'Image'} • {formatFileSize(doc.file_size)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Document List (when in Files tab and no doc is selected) */}
            {!docsLoading && meetingDocs.length > 0 && docPanelTab === 'files' && !selectedDoc && (
              <div className="meeting-doc-list">
                {meetingDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="meeting-doc-item"
                    onClick={() => handleSelectDoc(doc, 'summary')}
                  >
                    <div className="meeting-doc-item-icon">
                      <FileText size={18} />
                    </div>
                    <div className="meeting-doc-item-info">
                      <div className="meeting-doc-item-name">
                        {doc.label || doc.original_filename}
                      </div>
                      <div className="meeting-doc-item-meta">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{doc.mime_type === 'application/pdf' ? 'PDF' : 'Image'}</span>
                        <span>•</span>
                        <span
                          className={`meeting-doc-item-badge ${
                            doc.ai_summary ? 'has-summary' : 'no-summary'
                          }`}
                        >
                          {doc.ai_summary ? 'Summary Ready' : 'No Summary'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="meeting-doc-card-btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOriginalForDoc(doc);
                        }}
                        title={`View original ${doc.label || doc.original_filename}`}
                      >
                        <Eye size={12} />
                        Original
                      </button>
                      <ChevronRight size={16} color="#475569" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Document Viewer (when a specific doc is selected) */}
            {!docsLoading && selectedDoc && (
              <div className="meeting-doc-viewer">
                {/* Viewer Header */}
                <div className="meeting-doc-viewer-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                    <FileText size={14} color={selectedDoc.mime_type === 'application/pdf' ? '#d97706' : '#3b82f6'} />
                    <span className="meeting-doc-viewer-title">
                      {selectedDoc.label || selectedDoc.original_filename}
                    </span>
                  </div>
                  <button className="meeting-doc-viewer-back" onClick={handleBackToList}>
                    <ArrowLeft size={12} /> Back to Files
                  </button>
                </div>

                {/* View Mode Tabs */}
                <div className="meeting-doc-tabs">
                  <button
                    type="button"
                    className={`meeting-doc-tab ${docViewMode === 'summary' ? 'active' : ''}`}
                    onClick={() => setDocViewMode('summary')}
                  >
                    <Sparkles size={13} /> AI Summary
                  </button>
                  <button
                    type="button"
                    className={`meeting-doc-tab ${docViewMode === 'original' ? 'active' : ''}`}
                    onClick={handleViewOriginal}
                  >
                    <Eye size={13} /> View Original (Read-Only)
                  </button>
                </div>

                {/* Summary View */}
                {docViewMode === 'summary' && (
                  <>
                    {selectedDoc.ai_summary ? (
                      <div className="meeting-doc-summary-content">
                        <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                          <Sparkles size={12} />
                          AI-Generated Clinical Summary
                        </div>
                        {selectedDoc.ai_summary.split('\n').map((line, i) => (
                          <p key={i} style={{ margin: line.trim() ? '0 0 0.5rem' : '0 0 0.25rem' }}>
                            {line || '\u00A0'}
                          </p>
                        ))}
                        {selectedDoc.ai_summary_generated_at && (
                          <div style={{ marginTop: '1rem', fontSize: '0.68rem', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                            Generated: {new Date(selectedDoc.ai_summary_generated_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="meeting-doc-summary-empty">
                        <BookOpen size={32} color="#475569" />
                        <p>No AI summary has been generated for this document yet.</p>
                        {user?.role === 'doctor' && (
                          <button
                            type="button"
                            className="meeting-doc-generate-btn"
                            onClick={() => handleSummarizeSingleDoc(selectedDoc)}
                            disabled={isSummarizing || isBulkSummarizing}
                          >
                            {isSummarizing ? (
                              <><div className="meeting-doc-loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Generating...</>
                            ) : (
                              <><Sparkles size={14} /> Generate AI Summary</>
                            )}
                          </button>
                        )}
                        {user?.role === 'patient' && (
                          <p style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.5rem' }}>
                            The doctor can generate a summary during this consultation.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Original Document View (Strictly Read-Only, No Download) */}
                {docViewMode === 'original' && (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      height: '100%',
                      minHeight: '400px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {docBlobLoading ? (
                      <div className="meeting-doc-loading" style={{ minHeight: '300px' }}>
                        <div className="meeting-doc-loading-spinner" />
                        <span>Loading document preview...</span>
                      </div>
                    ) : docBlobUrl ? (
                      <div
                        className="meeting-doc-original-viewer"
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                          flex: 1,
                          width: '100%',
                          height: '100%',
                          minHeight: '400px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: selectedDoc.mime_type === 'application/pdf' ? '#525659' : '#0f172a',
                          overflow: 'hidden',
                        }}
                      >
                        {selectedDoc.mime_type === 'application/pdf' ? (
                          <iframe
                            src={`${docBlobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                            title={selectedDoc.original_filename || 'PDF Preview'}
                            style={{
                              width: '100%',
                              height: '100%',
                              minHeight: '400px',
                              border: 'none',
                              background: '#ffffff',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              minHeight: '350px',
                              overflow: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '1rem',
                            }}
                          >
                            <img
                              src={docBlobUrl}
                              alt={selectedDoc.label || selectedDoc.original_filename}
                              draggable={false}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                pointerEvents: 'none',
                                userSelect: 'none',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="meeting-doc-loading" style={{ minHeight: '300px' }}>
                        <AlertCircle size={28} color="#f87171" />
                        <span style={{ color: '#f87171', fontWeight: 600 }}>Unable to load document preview</span>
                        <button
                          type="button"
                          className="meeting-doc-generate-btn"
                          style={{ marginTop: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            const docId = selectedDoc.patient_document_id || selectedDoc.id;
                            const targetMeetingId = meeting?.id || meetingId;
                            setDocBlobLoading(true);
                            meetingApi
                              .getMeetingPatientDocumentBlobUrl(targetMeetingId, docId)
                              .then((url) => setDocBlobUrl(url))
                              .catch(() => setToast({ type: 'error', message: 'Failed to reload preview.' }))
                              .finally(() => setDocBlobLoading(false));
                          }}
                        >
                          <RefreshCw size={13} /> Try Reloading
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        style={{
          padding: '1rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
        }}
      >
        {/* Mic Toggle */}
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isAudioMuted ? '#ef4444' : 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleVideo}
          title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isVideoMuted ? '#ef4444' : 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {isVideoMuted ? <VideoOff size={22} /> : <Video size={22} />}
        </button>

        {/* Documents Toggle */}
        <button
          className={`meeting-doc-toggle-btn ${showDocPanel ? 'panel-open' : 'panel-closed'}`}
          onClick={() => setShowDocPanel((v) => !v)}
          title={showDocPanel ? 'Close Documents Panel' : 'Open Documents Panel'}
        >
          <FileText size={22} />
          {meetingDocs.length > 0 && (
            <span className="doc-count-badge">{meetingDocs.length}</span>
          )}
        </button>

        {/* Live Captions / Transcript Drawer Toggle */}
        <button
          onClick={() => setShowLiveTranscriptDrawer((v) => !v)}
          title={showLiveTranscriptDrawer ? 'Hide Live Transcript' : 'Show Live Transcript'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: showLiveTranscriptDrawer ? '#2563eb' : 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.15s ease',
          }}
        >
          <MessageSquare size={22} />
          {liveTranscript.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#10b981',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {liveTranscript.length}
            </span>
          )}
        </button>

        {/* Write Prescription (Doctor only, available during call) */}
        {user?.role === 'doctor' && (
          <button
            onClick={() => setShowPrescriptionWriter(true)}
            title="Write / Manage Prescription for Patient"
            style={{
              padding: '0 1.25rem',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              background: prescription
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Pill size={18} />
            {prescription ? 'Prescription Saved' : 'Prescription'}
          </button>
        )}

        {/* Leave Call Button */}
        <button
          onClick={() => setShowLeaveWarning(true)}
          title="Leave Consultation Room"
          style={{
            padding: '0 1.5rem',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
          }}
        >
          <PhoneOff size={18} /> Leave Call
        </button>

        {/* End Meeting Button (Doctor only) */}
        {user?.role === 'doctor' && (
          <button
            onClick={() => setShowEndModal(true)}
            title="Conclude Consultation Session"
            style={{
              padding: '0 1.5rem',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#fff',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
            }}
          >
            <CheckCircle2 size={18} /> End Consultation
          </button>
        )}
      </div>

      {/* Live Subtitle Overlay */}
      {interimCaption && (
        <div
          style={{
            position: 'absolute',
            bottom: '95px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            padding: '0.55rem 1.25rem',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            maxWidth: '80%',
            zIndex: 30,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: interimCaption.speaker === 'doctor' ? '#34d399' : '#818cf8',
              whiteSpace: 'nowrap',
            }}
          >
            {interimCaption.speakerName || (interimCaption.speaker === 'doctor' ? 'Doctor' : 'Patient')}:
          </span>
          <span style={{ color: '#f8fafc', wordBreak: 'break-word' }}>{interimCaption.text}</span>
        </div>
      )}

      {/* Live Transcript Side Drawer */}
      {showLiveTranscriptDrawer && (
        <div
          style={{
            position: 'absolute',
            top: '75px',
            right: '20px',
            bottom: '95px',
            width: '340px',
            maxWidth: '90vw',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 40,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}
        >
          {/* Header & Language Selector */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>
              <MessageSquare size={16} color="#34d399" />
              <span>Live Transcript</span>
            </div>

            {/* Language Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                type="button"
                onClick={() => handleLanguageChange('en-US')}
                title="Transcribe English"
                style={{
                  padding: '2px 7px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  borderRadius: '5px',
                  border: '1px solid',
                  borderColor: speechLang === 'en-US' ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                  background: speechLang === 'en-US' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                  color: speechLang === 'en-US' ? '#93c5fd' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ur-PK')}
                title="اردو ٹرانسکرپشن (Transcribe Urdu)"
                style={{
                  padding: '2px 7px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  borderRadius: '5px',
                  border: '1px solid',
                  borderColor: speechLang === 'ur-PK' ? '#10b981' : 'rgba(255,255,255,0.15)',
                  background: speechLang === 'ur-PK' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                  color: speechLang === 'ur-PK' ? '#6ee7b7' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                اردو
              </button>
              <button
                onClick={() => setShowLiveTranscriptDrawer(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '3px', marginLeft: '4px' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Status Indicator Bar */}
          <div
            style={{
              padding: '0.4rem 1rem',
              background: 'rgba(0, 0, 0, 0.35)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.725rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor:
                    transcriptionStatus === 'transcribing'
                      ? '#10b981'
                      : transcriptionStatus === 'reconnecting'
                      ? '#f59e0b'
                      : transcriptionStatus === 'muted'
                      ? '#94a3b8'
                      : '#ef4444',
                  boxShadow:
                    transcriptionStatus === 'transcribing'
                      ? '0 0 8px #10b981'
                      : 'none',
                  animation: transcriptionStatus === 'transcribing' ? 'blink 2s infinite' : 'none',
                }}
              />
              <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
                {transcriptionStatus === 'transcribing'
                  ? `● Transcribing (${speechLang === 'ur-PK' ? 'اردو' : 'English'})`
                  : transcriptionStatus === 'reconnecting'
                  ? '⟳ Reconnecting transcription...'
                  : transcriptionStatus === 'muted'
                  ? 'Microphone muted'
                  : transcriptionStatus === 'permission_denied'
                  ? '⚠ Permission required'
                  : '⚠ Live transcription unavailable'}
              </span>
            </div>
            <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>
              {liveTranscript.length} {liveTranscript.length === 1 ? 'line' : 'lines'}
            </span>
          </div>

          {/* Transcript Content List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            {liveTranscript.length === 0 && !interimCaption ? (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', padding: '2.5rem 1rem' }}>
                <MessageSquare size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ margin: 0 }}>Doctor and patient speech will appear live here.</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.725rem', color: '#475569' }}>
                  Select EN or اردو above to switch transcription language.
                </p>
              </div>
            ) : (
              <>
                {liveTranscript.map((seg, idx) => {
                  const isDoc = seg.speaker === 'doctor' || seg.participant === 'doctor';
                  const timeStr = typeof seg.timestamp === 'number'
                    ? `[${String(Math.floor(seg.timestamp / 60)).padStart(2, '0')}:${String(Math.floor(seg.timestamp % 60)).padStart(2, '0')}]`
                    : '';
                  return (
                    <div
                      key={seg.id || idx}
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: '10px',
                        background: isDoc ? 'rgba(5, 150, 105, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        border: `1px solid ${isDoc ? 'rgba(52, 211, 153, 0.25)' : 'rgba(129, 140, 248, 0.25)'}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: isDoc ? 'rgba(52, 211, 153, 0.2)' : 'rgba(129, 140, 248, 0.2)',
                            color: isDoc ? '#34d399' : '#818cf8',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {isDoc ? 'DOCTOR' : 'PATIENT'}
                        </span>
                        {timeStr && (
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            {timeStr}
                          </span>
                        )}
                      </div>
                      <div
                        dir="auto"
                        style={{
                          fontSize: '0.85rem',
                          color: '#f1f5f9',
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                        }}
                      >
                        {seg.text}
                      </div>
                    </div>
                  );
                })}

                {/* Interim Live Speech Preview */}
                {interimCaption && interimCaption.text && (
                  <div
                    style={{
                      padding: '0.6rem 0.8rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px dashed rgba(255, 255, 255, 0.2)',
                      fontStyle: 'italic',
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.2rem' }}>
                      {interimCaption.speaker === 'doctor' ? 'Doctor (speaking...)' : 'Patient (speaking...)'}
                    </div>
                    <div dir="auto" style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {interimCaption.text}
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={transcriptBottomRef} />
          </div>
        </div>
      )}

      {/* In-Call Prescription Writer Modal (Doctor only) */}
      <PrescriptionWriter
        isOpen={showPrescriptionWriter}
        onClose={() => setShowPrescriptionWriter(false)}
        meetingId={meetingId}
        patientName={meeting?.patient_name}
        onSuccess={(rx) => {
          setPrescription(rx);
          setToast({ type: 'success', message: 'Prescription saved to patient records!' });
        }}
      />

      {/* In-Call Prescription View Modal */}
      <PrescriptionView
        isOpen={showPrescriptionView}
        onClose={() => setShowPrescriptionView(false)}
        prescription={prescription}
      />

      {/* Blink animation for waiting indicator */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ─── Rejoin Countdown Helper Component ─────────────────────────────────────
function RejoinCountdown({ endTime }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const end = new Date(endTime).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));

      if (diff <= 0) {
        setRemaining('Expired');
        return;
      }

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      const pad = (n) => String(n).padStart(2, '0');
      setRemaining(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (remaining === 'Expired') return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.85rem',
        color: '#1d4ed8',
        fontWeight: 600,
      }}
    >
      <RefreshCw size={14} />
      Rejoin window closes in: <strong style={{ fontFamily: "'Courier New', monospace" }}>{remaining}</strong>
    </div>
  );
}
