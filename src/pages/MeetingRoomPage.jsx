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
} from 'lucide-react';
import { DoctorRatingModal } from '../components/patient/DoctorRatingModal';
import { PrescriptionWriter } from '../components/doctor/PrescriptionWriter';
import { PrescriptionView } from '../components/patient/PrescriptionView';
import { ratingApi } from '../api/rating';
import { prescriptionApi } from '../api/prescription';


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
  const [showPrescriptionView, setShowPrescriptionView] = useState(false);
  const [prescription, setPrescription] = useState(null);

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
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const wsRef = useRef(null);

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
        // If doctor and no prescription yet, auto-open prescription writer
        if (isMounted && user?.role === 'doctor') {
          setShowPrescriptionWriter(true);
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
          navigator.mediaDevices.getUserMedia({ video: true, audio: true }),
          timeoutPromise,
        ]);

        localStreamRef.current = stream;
        setLocalStream(stream);
        setMediaStatus('ready');
      } catch (videoErr) {
        console.warn('Video acquisition failed or timed out. Trying audio-only:', videoErr);

        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          localStreamRef.current = stream;
          setLocalStream(stream);
          setIsVideoMuted(true);
          setMediaStatus('no-camera');
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
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks if available
    const activeStream = stream || localStreamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach((track) => {
        pc.addTrack(track, activeStream);
      });
    }

    // Remote track handler
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setPeerConnected(true);
        setBothJoined(true);
      }
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
    const parsedApi = new URL(API_BASE_URL);
    const wsUrl = `${wsProto}//${parsedApi.host}/api/v1/meetings/ws/${meetingData.room_id}?token=${accessToken}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to meeting signaling server');
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
                setPeerConnected(true);
                setBothJoined(true);
              }
            }
            break;

          case 'peer-joined': {
            setPeerName(data.name || 'Participant');
            setToast({ type: 'info', message: `${data.name} joined the consultation.` });

            // Initiator creates and sends offer
            const pc = createPeerConnection(meetingData, activeStream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            ws.send(
              JSON.stringify({
                type: 'offer',
                sdp: pc.localDescription,
              })
            );
            break;
          }

          case 'offer': {
            const pcAns = createPeerConnection(meetingData, activeStream);
            await pcAns.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pcAns.createAnswer();
            await pcAns.setLocalDescription(answer);

            ws.send(
              JSON.stringify({
                type: 'answer',
                sdp: pcAns.localDescription,
              })
            );
            break;
          }

          case 'answer': {
            const pcOffer = peerConnectionRef.current;
            if (pcOffer && pcOffer.signalingState !== 'stable') {
              await pcOffer.setRemoteDescription(new RTCSessionDescription(data.sdp));
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

          case 'meeting-ended':
            setSessionState('completed');
            setToast({ type: 'info', message: 'Consultation has been ended by the other party.' });
            cleanupCall();
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
        setIsAudioMuted(!audioTrack.enabled);
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
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'peer-left-voluntary',
            role: user?.role,
          })
        );
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
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'meeting-ended',
            ended_by: user?.role,
          })
        );
      }

      await meetingApi.endMeeting(meeting.id, {
        doctor_notes: doctorNotes.trim() || undefined,
      });

      setShowEndModal(false);
      setSessionState('completed');
      setToast({ type: 'success', message: 'Consultation ended successfully!' });
      cleanupCall();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to end consultation.' });
    } finally {
      setIsEnding(false);
    }
  };

  function cleanupCall() {
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
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                    variant="primary"
                    onClick={() => setShowPrescriptionWriter(true)}
                    icon={<Pill size={16} />}
                  >
                    Write Prescription & Medicine Plan
                  </Button>
                )}
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
