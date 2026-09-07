import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  Globe,
  ShieldCheck,
  User,
  Stethoscope,
  Send,
  AlertTriangle,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogIn,
} from 'lucide-react';

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
  const [sessionNumber, setSessionNumber] = useState(1);
  const [canRejoin, setCanRejoin] = useState(false);

  // Bilingual Speech Recognition state
  const [speechLanguage, setSpeechLanguage] = useState('ur-PK'); // 'ur-PK' or 'en-US'
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [transcripts, setTranscripts] = useState([]);
  const [sessionTranscripts, setSessionTranscripts] = useState([]); // Current session only
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(true);
  const [manualNote, setManualNote] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');

  // Track if both participants have joined (for transcription control)
  const [bothJoined, setBothJoined] = useState(false);

  // DOM and WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const sessionTranscriptsRef = useRef([]);

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
        setIsLoadingMeeting(false); // <── Unblock UI immediately!

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

  // Attach local stream to <video> as soon as element and stream are both available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef.current]);

  // ─── Transcription Control: Only start when BOTH have joined ──────────
  useEffect(() => {
    if (!meeting || sessionState !== 'active') return;

    if (bothJoined) {
      setupSpeechRecognition();
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [speechLanguage, meeting, sessionState, bothJoined]);

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
  const initializeMediaAndSignaling = async (meetingData) => {
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
            message: 'Camera/Mic not detected or blocked. You can still join and use live text/transcript.',
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
        setBothJoined(true); // Both participants are now connected
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
            if (data.existing_transcripts) {
              setTranscripts(data.existing_transcripts);
            }
            if (data.peer_count >= 2) {
              const other = data.participants.find((p) => p.user_id !== user?.id);
              if (other) {
                setPeerName(other.name);
                setPeerConnected(true);
                setBothJoined(true);
              }
            }
            break;

          case 'peer-joined':
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

          case 'transcript-segment':
            if (data.segment) {
              setTranscripts((prev) => [...prev, data.segment]);
              setSessionTranscripts((prev) => [...prev, data.segment]);
              sessionTranscriptsRef.current = [...sessionTranscriptsRef.current, data.segment];
            }
            break;

          case 'peer-left':
            setPeerConnected(false);
            setBothJoined(false);
            setPeerName('Participant disconnected');
            setToast({ type: 'info', message: 'The other participant has left the consultation.' });
            // Stop speech recognition when peer leaves
            if (recognitionRef.current) {
              try { recognitionRef.current.stop(); } catch (e) {}
            }
            break;

          case 'meeting-ended':
            setSessionState('completed');
            setToast({ type: 'info', message: 'Consultation has been ended by the other party.' });
            cleanupCall();
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

  // ─── 4. Bilingual Speech Recognition (Web Speech API) ───────────────────
  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = speechLanguage; // 'ur-PK' or 'en-US'

      recognition.onstart = () => {
        setIsRecognizing(true);
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.trim();

        if (transcriptText) {
          const myRole = user?.role === 'doctor' ? 'doctor' : 'patient';
          const myName =
            user?.role === 'doctor'
              ? meeting?.doctor_name || 'Dr. ' + user.email.split('@')[0]
              : user?.email.split('@')[0];

          const segment = {
            speaker: myRole,
            speaker_name: myName,
            text: transcriptText,
            timestamp: new Date().toTimeString().split(' ')[0],
            language: speechLanguage,
          };

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'transcript-segment',
                ...segment,
              })
            );
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
      };

      recognition.onend = () => {
        if (sessionState === 'active' && bothJoined && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        } else {
          setIsRecognizing(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition could not be started:', e);
    }
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

  const toggleLanguage = () => {
    const nextLang = speechLanguage === 'ur-PK' ? 'en-US' : 'ur-PK';
    setSpeechLanguage(nextLang);
    setToast({
      type: 'info',
      message: `Speech transcription language switched to: ${nextLang === 'ur-PK' ? 'Urdu (اردو)' : 'English'}`,
    });
  };

  const handleSendManualNote = (e) => {
    e.preventDefault();
    if (!manualNote.trim()) return;

    const myRole = user?.role === 'doctor' ? 'doctor' : 'patient';
    const myName =
      user?.role === 'doctor'
        ? meeting?.doctor_name || 'Dr. ' + user.email.split('@')[0]
        : user?.email.split('@')[0];

    const segment = {
      speaker: myRole,
      speaker_name: myName,
      text: manualNote.trim(),
      timestamp: new Date().toTimeString().split(' ')[0],
      language: speechLanguage,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'transcript-segment',
          ...segment,
        })
      );
    }

    setManualNote('');
  };

  // ─── Leave Call (NOT end meeting) ─────────────────────────────────────
  const handleLeaveCall = async () => {
    setShowLeaveWarning(false);

    try {
      // If user is doctor, save this session's transcript
      if (user?.role === 'doctor' && sessionTranscriptsRef.current.length > 0) {
        await meetingApi.saveSessionTranscript(meeting.id, {
          session_number: sessionNumber,
          doctor_notes: doctorNotes || undefined,
          segments: sessionTranscriptsRef.current,
        });
        setToast({ type: 'success', message: `Session ${sessionNumber} transcript saved!` });
      }

      // Notify peer we're leaving (but NOT ending the meeting)
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
      setToast({ type: 'error', message: err.message || 'Failed to save session transcript.' });
      // Still leave even if save fails
      cleanupCall();
      setSessionState('left');
    }
  };

  // ─── Rejoin Meeting ───────────────────────────────────────────────────
  const handleRejoin = async () => {
    setSessionState('active');
    setSessionNumber((prev) => prev + 1);
    setSessionTranscripts([]);
    sessionTranscriptsRef.current = [];
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
  const handleEndMeeting = async () => {
    setShowLeaveWarning(false);

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'meeting-ended',
            ended_by: user?.role,
          })
        );
      }

      await meetingApi.endMeetingAndSaveTranscript(meeting.id, {
        doctor_notes: doctorNotes || undefined,
        segments: transcripts,
      });

      setSessionState('completed');
      setToast({ type: 'success', message: 'Consultation ended and transcript saved!' });
      cleanupCall();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to finalize meeting transcript.' });
    }
  };

  const cleanupCall = () => {
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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setLocalStream(null);
  };

  // ─── Loading Screen (Only while fetching metadata, max 100ms) ───────────
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
              ? `You have left session ${sessionNumber}. ${
                  user?.role === 'doctor'
                    ? 'Your session transcript has been saved. '
                    : ''
                }You can rejoin the consultation as the scheduled end time has not passed yet.`
              : 'The scheduled meeting time has expired. You can no longer rejoin this consultation.'}
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

          {/* Doctor download links for saved sessions */}
          {user?.role === 'doctor' && sessionNumber > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Session Transcripts Saved: {sessionNumber}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                You can download all session transcripts from your Doctor Portal after the consultation is fully completed.
              </p>
            </div>
          )}
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
            The speech transcription dialogue (English & Urdu) has been compiled into a secure file.
            {user?.role === 'doctor'
              ? ' You can view and download the full transcript anytime from your doctor portal.'
              : ' Your doctor has received the consultation transcript and record.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {user?.role === 'doctor' && (
              <Button
                variant="primary"
                onClick={() => meetingApi.downloadTranscript(meeting.id)}
                icon={<Download size={16} />}
              >
                Download Transcript (.txt)
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

        {/* Security, Language & Transcription Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Transcription status indicator */}
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
            {bothJoined ? 'Transcription Active' : 'Waiting for Both Participants'}
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

          <button
            onClick={toggleLanguage}
            title="Click to switch speech language between Urdu and English"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              background: 'rgba(255,255,255,0.1)',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Globe size={14} color="#60a5fa" />
            Language: <strong>{speechLanguage === 'ur-PK' ? 'اردو (Urdu)' : 'English'}</strong>
          </button>
        </div>
      </div>

      {/* Main Video & Transcript Grid */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Video Area */}
        <div
          style={{
            flex: showTranscriptPanel ? '1 1 70%' : '1 1 100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#020617',
          }}
        >
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
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed rgba(255,255,255,0.2)',
                }}
              >
                <User size={36} color="#64748b" />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#f1f5f9', marginBottom: '0.35rem' }}>
                {peerName}
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                You have entered the consultation room. When the other party joins, your audio and video will connect instantly.
              </p>
              <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.75rem' }}>
                ⏳ Speech transcription will start automatically once both participants join.
              </p>
            </div>
          )}

          {/* Local Video Picture-in-Picture */}
          <div
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              width: '210px',
              height: '140px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
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
                transform: 'scaleX(-1)', // mirror selfie
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
                background: 'rgba(0,0,0,0.65)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              You ({user?.role})
            </div>
          </div>
        </div>

        {/* Right Side: Live Bilingual Speech Transcript Panel */}
        {showTranscriptPanel && (
          <div
            style={{
              width: '380px',
              background: '#1e293b',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 5,
            }}
          >
            <div
              style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} color="#60a5fa" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Live Speech Transcript</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: isRecognizing ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
                {isRecognizing ? '● Listening' : bothJoined ? 'Transcript Ready' : '● Waiting for Peer'}
              </span>
            </div>

            {/* Transcript Messages Feed */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {transcripts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '2rem' }}>
                  <p>Spoken conversation will be transcribed here live.</p>
                  <p style={{ fontSize: '0.75rem', color: '#475569' }}>
                    {bothJoined
                      ? 'Supports English and Urdu (اردو) speech.'
                      : 'Transcription will begin once both participants join.'}
                  </p>
                </div>
              ) : (
                transcripts.map((seg, idx) => {
                  const isUrdu = seg.language === 'ur-PK' || /[\u0600-\u06FF]/.test(seg.text);
                  const isDoctor = seg.speaker === 'doctor';

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isDoctor ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        borderLeft: isDoctor ? '3px solid #3b82f6' : '3px solid #10b981',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          marginBottom: '0.2rem',
                          color: isDoctor ? '#93c5fd' : '#86efac',
                          fontWeight: 700,
                        }}
                      >
                        <span>{seg.speaker_name || seg.speaker}</span>
                        <span style={{ color: '#94a3b8', fontWeight: 400 }}>{seg.timestamp}</span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: '#f8fafc',
                          direction: isUrdu ? 'rtl' : 'ltr',
                          textAlign: isUrdu ? 'right' : 'left',
                          fontFamily: isUrdu ? "'Noto Nastaliq Urdu', 'Segoe UI', Tahoma, sans-serif" : 'inherit',
                          lineHeight: isUrdu ? 1.8 : 1.4,
                        }}
                      >
                        {seg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Doctor Clinical Notes input (Doctor only) */}
            {user?.role === 'doctor' && (
              <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Doctor Clinical Summary (saved with transcript)..."
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    resize: 'none',
                  }}
                />
              </div>
            )}

            {/* Manual Quick Note / Message Input */}
            <form
              onSubmit={handleSendManualNote}
              style={{
                padding: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <input
                type="text"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Type a clinical note or message..."
                style={{
                  flex: 1,
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#3b82f6',
                  border: 'none',
                  color: '#fff',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        style={{
          padding: '1rem',
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
            width: '46px',
            height: '46px',
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
          {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleVideo}
          title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
          style={{
            width: '46px',
            height: '46px',
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
          {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        {/* Transcript Panel Toggle */}
        <button
          onClick={() => setShowTranscriptPanel(!showTranscriptPanel)}
          title="Toggle live transcript side panel"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: showTranscriptPanel ? '#3b82f6' : 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <MessageSquare size={20} />
        </button>

        {/* Leave Call Button */}
        <button
          onClick={() => setShowLeaveWarning(true)}
          title="Leave Consultation"
          style={{
            padding: '0 1.25rem',
            height: '46px',
            borderRadius: 'var(--radius-full)',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          <PhoneOff size={18} /> Leave
        </button>

        {/* End Meeting Button (Doctor only) */}
        {user?.role === 'doctor' && (
          <button
            onClick={handleEndMeeting}
            title="End Meeting & Save Final Transcript"
            style={{
              padding: '0 1.25rem',
              height: '46px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#fff',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            }}
          >
            <CheckCircle2 size={18} /> End & Save Transcript
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

// ─── Small Helper: Rejoin Countdown Component ──────────────────────────────
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
