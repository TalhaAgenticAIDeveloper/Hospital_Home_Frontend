import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Activity,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { consultationAiApi } from '../../api/consultationAi';
import { Button } from '../common/Button';

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getFutureDateStr = (days = 5) => {
  const d = new Date();
  d.setDate(d.getDate() + (days || 5));
  return d.toISOString().split('T')[0];
};

const createEmptyMedication = () => ({
  medication_name: '',
  dose_value: '',
  dose_unit: 'mg',
  route: 'oral',
  frequency: 'twice daily',
  morning: true,
  morning_time: '08:00',
  morning_before_meal: false,
  afternoon: false,
  afternoon_time: '13:00',
  afternoon_before_meal: false,
  evening: true,
  evening_time: '18:00',
  evening_before_meal: false,
  night: false,
  night_time: '21:00',
  night_before_meal: false,
  start_date: getTodayStr(),
  end_date: getFutureDateStr(5),
  special_instructions: '',
  status: 'new',
  confidence: 1.0,
  evidence: [],
});

export function AIExtractionReview({
  meetingId,
  patientName,
  isOpen,
  onClose,
  onApproved,
  onSwitchToManual,
}) {
  // Modal states: 'loading' | 'processing' | 'ready' | 'failed' | 'success'
  const [viewStatus, setViewStatus] = useState('loading');
  const [statusMessage, setStatusMessage] = useState('Checking consultation AI status...');
  const [errorMessage, setErrorMessage] = useState('');

  // Extraction Data State
  const [extraction, setExtraction] = useState(null);
  const [medications, setMedications] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [tests, setTests] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [doctorInstructions, setDoctorInstructions] = useState([]);
  const [uncertainItems, setUncertainItems] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState('');

  // Versions & Transcript State
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [expandedEvidence, setExpandedEvidence] = useState({});

  // Action states
  const [isApproving, setIsApproving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const pollingTimerRef = useRef(null);

  // Initialize and load status/extraction when opened
  useEffect(() => {
    if (!isOpen || !meetingId) return;

    loadInitialData();

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [isOpen, meetingId]);

  const loadInitialData = async () => {
    setViewStatus('loading');
    setErrorMessage('');
    setValidationError('');

    try {
      // 1. Fetch current status
      const statusRes = await consultationAiApi.getStatus(meetingId);

      if (statusRes.extraction_status === 'completed') {
        // Extraction is ready
        await fetchExtractionData();
      } else if (
        statusRes.transcription_status === 'processing' ||
        statusRes.transcription_status === 'pending' ||
        statusRes.extraction_status === 'processing' ||
        (!statusRes.transcription_status && (statusRes.has_doctor_audio || statusRes.has_patient_audio))
      ) {
        // Currently in progress, start polling
        setViewStatus('processing');
        setStatusMessage(
          statusRes.extraction_status === 'processing'
            ? 'Analyzing dialogue & extracting clinical documentation...'
            : 'Transcribing consultation audio (Speech-to-Text)...'
        );
        startPolling();
      } else if (
        statusRes.transcription_status === 'completed' &&
        (!statusRes.extraction_status || statusRes.extraction_status === 'failed')
      ) {
        // Transcript is ready, but extraction not started or failed
        // Trigger extraction automatically
        await handleStartExtraction();
      } else if (statusRes.transcription_status === 'failed') {
        setViewStatus('failed');
        setErrorMessage(statusRes.transcript_error || 'Audio transcription encountered an issue.');
      } else {
        // No extraction in DB yet. Attempt to initiate extraction (backend will use transcript or doctor notes)
        try {
          setViewStatus('processing');
          setStatusMessage('Initiating AI clinical extraction...');
          await consultationAiApi.startExtraction(meetingId);
          startPolling();
        } catch (autoErr) {
          // If neither audio nor notes exist, provide helpful medical UI guidance
          setViewStatus('failed');
          setErrorMessage(
            autoErr?.detail ||
            'No audio recording or clinical notes were found for this consultation. Please use the Manual Prescription Writer to create a prescription.'
          );
        }
      }
    } catch (err) {
      console.error('Error fetching consultation AI status:', err);
      setViewStatus('failed');
      setErrorMessage(err?.detail || err?.message || 'Failed to connect to consultation AI service.');
    }
  };

  const startPolling = () => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await consultationAiApi.getStatus(meetingId);

        if (res.extraction_status === 'completed') {
          clearInterval(pollingTimerRef.current);
          await fetchExtractionData();
        } else if (res.transcription_status === 'failed' || res.extraction_status === 'failed') {
          clearInterval(pollingTimerRef.current);
          setViewStatus('failed');
          setErrorMessage(
            res.extraction_error || res.transcript_error || 'Processing failed. You can retry or switch to manual prescription.'
          );
        } else {
          // Update status message based on current stage
          if (res.transcription_status === 'processing') {
            setStatusMessage('Transcribing consultation audio with high-accuracy Whisper model...');
          } else if (res.extraction_status === 'processing') {
            setStatusMessage('Extracting diagnoses, medicines, dosages, and instructions...');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);
  };

  const fetchExtractionData = async (version = null) => {
    try {
      const data = await consultationAiApi.getExtraction(meetingId, version);
      setExtraction(data);
      setSelectedVersion(data.version);

      // Hydrate editable state from extraction_data
      const raw = data.extraction_data || {};

      // Parse and map medications
      const mappedMeds = (raw.medications || []).map((med, idx) => {
        const timings = Array.isArray(med.timings) ? med.timings : [];
        const isMorning = timings.includes('morning') || timings.includes('breakfast');
        const isAfternoon = timings.includes('afternoon') || timings.includes('lunch');
        const isEvening = timings.includes('evening') || timings.includes('dinner');
        const isNight = timings.includes('night') || timings.includes('bedtime');

        // Meal relation: 'before' or 'after'
        const isBefore =
          typeof med.meal_relation === 'string' &&
          med.meal_relation.toLowerCase().includes('before');

        const duration = med.duration_days ? parseInt(med.duration_days, 10) : 5;

        return {
          id: `med-${idx}-${Date.now()}`,
          medication_name: med.medication_name || '',
          dose_value: med.dose_value || '',
          dose_unit: med.dose_unit || 'mg',
          route: med.route || 'oral',
          frequency: med.frequency || '',
          morning: isMorning || (!isMorning && !isAfternoon && !isEvening && !isNight),
          morning_time: '08:00',
          morning_before_meal: isBefore,
          afternoon: isAfternoon,
          afternoon_time: '13:00',
          afternoon_before_meal: isBefore,
          evening: isEvening,
          evening_time: '18:00',
          evening_before_meal: isBefore,
          night: isNight,
          night_time: '21:00',
          night_before_meal: isBefore,
          start_date: med.start_date || getTodayStr(),
          end_date: med.end_date || getFutureDateStr(duration),
          special_instructions: med.special_instructions || '',
          status: med.status || 'new',
          confidence: med.confidence !== undefined ? med.confidence : 0.9,
          evidence: med.evidence || [],
        };
      });

      // Default at least one empty medication if none extracted
      setMedications(mappedMeds.length > 0 ? mappedMeds : [createEmptyMedication()]);
      setDiagnoses(raw.diagnoses || []);
      setSymptoms(raw.symptoms || []);
      setTests(raw.tests || []);
      setFollowUps(raw.follow_ups || []);
      setDoctorInstructions(raw.doctor_instructions || []);
      setUncertainItems(raw.uncertain_items || []);
      setDoctorNotes(raw.consultation_summary || '');

      // Also load versions list
      try {
        const vData = await consultationAiApi.getExtractionVersions(meetingId);
        setVersions(vData.versions || []);
      } catch (e) {
        console.warn('Could not fetch extraction versions:', e);
      }

      // Also load transcript for evidence viewer
      try {
        const tData = await consultationAiApi.getTranscript(meetingId);
        setTranscript(tData);
      } catch (e) {
        console.warn('Could not load transcript:', e);
      }

      setViewStatus('ready');
    } catch (err) {
      console.error('Error fetching extraction details:', err);
      try {
        const s = await consultationAiApi.getStatus(meetingId);
        if (s && (s.extraction_status === 'processing' || s.transcription_status === 'processing' || (!s.extraction_status && s.has_doctor_audio))) {
          setViewStatus('processing');
          setStatusMessage('Clinical documentation is being prepared by AI...');
          startPolling();
          return;
        }
      } catch (e) {}

      setViewStatus('failed');
      setErrorMessage(err?.detail || err?.message || 'Could not load extraction data.');
    }
  };

  const handleStartExtraction = async () => {
    setViewStatus('processing');
    setStatusMessage('Initiating AI extraction pipeline...');
    try {
      await consultationAiApi.startExtraction(meetingId);
      startPolling();
    } catch (err) {
      console.error('Error starting extraction:', err);
      setViewStatus('failed');
      setErrorMessage(err?.detail || err?.message || 'Failed to start AI extraction.');
    }
  };

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setViewStatus('processing');
    setErrorMessage('');
    try {
      const status = await consultationAiApi.getStatus(meetingId);
      if (status.transcription_status === 'completed') {
        setStatusMessage('Generating clinical extraction with Groq AI...');
        await consultationAiApi.startExtraction(meetingId);
      } else if (status.has_doctor_audio || status.has_patient_audio) {
        setStatusMessage('Transcribing consultation audio (Speech-to-Text)...');
        await consultationAiApi.startTranscription(meetingId);
      } else {
        setStatusMessage('Analyzing consultation notes & generating extraction...');
        await consultationAiApi.startExtraction(meetingId);
      }
      startPolling();
    } catch (err) {
      setViewStatus('failed');
      setErrorMessage(err?.detail || err?.message || 'Failed to trigger AI processing. You can write the prescription manually.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // ── Medications Handlers ───────────────────────────────────────────────────

  const handleAddMedication = () => {
    setMedications([...medications, createEmptyMedication()]);
  };

  const handleRemoveMedication = (index) => {
    if (medications.length <= 1) {
      setValidationError('Prescription requires at least one medication.');
      return;
    }
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleUpdateMedField = (index, field, value) => {
    setMedications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ── Diagnoses Handlers ─────────────────────────────────────────────────────

  const handleAddDiagnosis = () => {
    setDiagnoses([
      ...diagnoses,
      { diagnosis_name: '', certainty: 'confirmed', confidence: 1.0, evidence: [] },
    ]);
  };

  const handleRemoveDiagnosis = (index) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const handleUpdateDiagnosis = (index, field, value) => {
    setDiagnoses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ── Tests Handlers ─────────────────────────────────────────────────────────

  const handleAddTest = () => {
    setTests([...tests, { test_name: '', urgency: 'routine', reason: '', evidence: [] }]);
  };

  const handleRemoveTest = (index) => {
    setTests(tests.filter((_, i) => i !== index));
  };

  const handleUpdateTest = (index, field, value) => {
    setTests((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ── Dismiss Uncertain Item ─────────────────────────────────────────────────

  const handleDismissUncertainItem = (index) => {
    setUncertainItems(uncertainItems.filter((_, i) => i !== index));
  };

  // ── Evidence Toggle ────────────────────────────────────────────────────────

  const toggleEvidence = (key) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    setValidationError('');

    if (!medications || medications.length === 0) {
      setValidationError('At least one medication is required before issuing a prescription.');
      return false;
    }

    for (let i = 0; i < medications.length; i++) {
      const m = medications[i];
      if (!m.medication_name || !m.medication_name.trim()) {
        setValidationError(`Medication #${i + 1}: Name cannot be empty.`);
        return false;
      }
      if (!m.morning && !m.afternoon && !m.evening && !m.night) {
        setValidationError(
          `Medication #${i + 1} (${m.medication_name}): Please check at least one dosage time slot (Morning, Afternoon, Evening, or Night).`
        );
        return false;
      }
      if (m.end_date && m.start_date && m.end_date < m.start_date) {
        setValidationError(
          `Medication #${i + 1} (${m.medication_name}): End date cannot be before start date.`
        );
        return false;
      }
    }

    return true;
  };

  // ── Approve & Issue Prescription ───────────────────────────────────────────

  const handleApprove = async () => {
    if (!validate()) return;

    setIsApproving(true);
    setValidationError('');

    try {
      // Structure edited extraction payload for backend approval
      const editedExtraction = {
        medications: medications.map((m) => {
          // Construct formatted medicine string including dose if not already part of name
          let cleanName = m.medication_name.trim();
          if (m.dose_value && !cleanName.toLowerCase().includes(m.dose_value.toLowerCase())) {
            cleanName = `${cleanName} ${m.dose_value}${m.dose_unit ? ' ' + m.dose_unit : ''}`;
          }

          const timings = [];
          if (m.morning) timings.push('morning');
          if (m.afternoon) timings.push('afternoon');
          if (m.evening) timings.push('evening');
          if (m.night) timings.push('night');

          return {
            medication_name: cleanName,
            dose_value: m.dose_value || null,
            dose_unit: m.dose_unit || null,
            route: m.route || 'oral',
            frequency: m.frequency || (timings.length > 0 ? `${timings.length} times daily` : 'daily'),
            timings: timings,
            meal_relation: m.morning_before_meal ? 'before_meals' : 'after_meals',
            start_date: m.start_date || getTodayStr(),
            end_date: m.end_date || getFutureDateStr(5),
            special_instructions: m.special_instructions || null,
            status: m.status || 'new',
            confidence: 1.0,
            evidence: m.evidence || [],
          };
        }),
        diagnoses: diagnoses.filter((d) => d.diagnosis_name && d.diagnosis_name.trim()),
        symptoms: symptoms,
        tests: tests.filter((t) => t.test_name && t.test_name.trim()),
        follow_ups: followUps,
        doctor_instructions: doctorInstructions,
        consultation_summary: doctorNotes.trim() || undefined,
      };

      const payload = {
        edited_extraction: editedExtraction,
        notes: doctorNotes.trim() || undefined,
      };

      const res = await consultationAiApi.approveExtraction(meetingId, payload);

      setViewStatus('success');

      setTimeout(() => {
        if (onApproved) {
          onApproved(res.prescription);
        }
        if (onClose) {
          onClose();
        }
      }, 1400);
    } catch (err) {
      console.error('Approval failed:', err);
      setValidationError(err?.detail || err?.message || 'Failed to approve and save prescription.');
    } finally {
      setIsApproving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '1040px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  AI Consultation Review & Prescription
                </h3>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.18rem 0.55rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Doctor Review Only
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                Patient: <strong style={{ color: '#f8fafc' }}>{patientName || 'Consultation Patient'}</strong>
                {selectedVersion && (
                  <span style={{ marginLeft: '0.75rem', color: '#94a3b8' }}>
                    • Version {selectedVersion}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {transcript?.full_text && (
              <button
                type="button"
                onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: showTranscriptDrawer ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                <FileText size={15} />
                {showTranscriptDrawer ? 'Hide Transcript' : 'View Dialogue'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#cbd5e1',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* ── Modal Body Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', position: 'relative' }}>
          {/* Main Content Area */}
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
            {/* 1. Loading State */}
            {viewStatus === 'loading' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5rem 2rem',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    border: '4px solid #e2e8f0',
                    borderTopColor: '#10b981',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1.25rem',
                  }}
                />
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem' }}>
                  Loading Consultation Analysis...
                </h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  Preparing clinical documentation and transcription data.
                </p>
              </div>
            )}

            {/* 2. Processing Pipeline State */}
            {viewStatus === 'processing' && (
              <div
                style={{
                  padding: '3rem 2rem',
                  maxWidth: '680px',
                  margin: '0 auto',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 1.5rem',
                    borderRadius: '16px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RefreshCw size={32} />
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.3rem', fontWeight: 700 }}>
                  AI Documentation Pipeline in Progress
                </h3>
                <p style={{ margin: '0 0 2rem 0', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {statusMessage}
                </p>

                {/* Progress Steps Visualizer */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '2.5rem',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Audio Saved</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Doctor & Patient tracks</span>
                  </div>

                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Clock size={16} color="#059669" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>Groq Whisper</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#059669' }}>Speech-to-Text STT</span>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Sparkles size={16} color="#64748b" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Extraction</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Clinical structure</span>
                  </div>

                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <ShieldCheck size={16} color="#64748b" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Doctor Review</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Final prescription</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (onSwitchToManual) onSwitchToManual();
                    }}
                  >
                    Switch to Manual Prescription Writer
                  </Button>
                </div>
              </div>
            )}

            {/* 3. Error / Failure State */}
            {viewStatus === 'failed' && (
              <div
                style={{
                  padding: '3rem 2rem',
                  maxWidth: '600px',
                  margin: '0 auto',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    margin: '0 auto 1.25rem',
                    borderRadius: '14px',
                    background: '#fef2f2',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertCircle size={28} />
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b', fontSize: '1.2rem', fontWeight: 700 }}>
                  AI Documentation Unavailable
                </h3>
                <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {errorMessage || 'The automated transcription or extraction could not be completed.'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem' }}>
                  <Button variant="outline" onClick={handleRegenerate} loading={isRegenerating}>
                    <RefreshCw size={15} style={{ marginRight: '0.4rem' }} />
                    Retry AI Extraction
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (onSwitchToManual) onSwitchToManual();
                    }}
                  >
                    Write Manual Prescription Instead
                  </Button>
                </div>
              </div>
            )}

            {/* 4. Success State */}
            {viewStatus === 'success' && (
              <div
                style={{
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  maxWidth: '520px',
                  margin: '0 auto',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 1.25rem',
                    borderRadius: '50%',
                    background: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#14532d', fontSize: '1.35rem', fontWeight: 700 }}>
                  Prescription Issued & Approved!
                </h3>
                <p style={{ margin: 0, color: '#15803d', fontSize: '0.92rem' }}>
                  Official prescription created and automatic patient dosage reminders scheduled.
                </p>
              </div>
            )}

            {/* 5. Ready State: Full Interactive Clinical Workspace */}
            {viewStatus === 'ready' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Validation Error Banner */}
                {validationError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '12px',
                      padding: '0.85rem 1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: '#b91c1c',
                      fontSize: '0.88rem',
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Uncertain Items Amber Caution Banner */}
                {uncertainItems && uncertainItems.length > 0 && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '14px',
                      padding: '1.1rem 1.25rem',
                      boxShadow: '0 2px 6px rgba(217, 119, 6, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <AlertTriangle size={19} color="#d97706" />
                      <h4 style={{ margin: 0, color: '#92400e', fontSize: '0.98rem', fontWeight: 700 }}>
                        Doctor Attention Required — {uncertainItems.length} Ambiguous Item{uncertainItems.length > 1 ? 's' : ''} Detected
                      </h4>
                    </div>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.84rem', color: '#b45309' }}>
                      The AI identified items with potential ambiguity or conflicting statements during the consultation. Please review and clarify them below.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {uncertainItems.map((item, idx) => (
                        <div
                          key={`uncertain-${idx}`}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #fef3c7',
                            borderRadius: '10px',
                            padding: '0.65rem 0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.84rem',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: '#78350f', textTransform: 'capitalize' }}>
                              [{item.field || 'General'}]:{' '}
                            </span>
                            <span style={{ color: '#1e293b' }}>{item.extracted_value}</span>
                            {item.reason && (
                              <span style={{ color: '#9a3412', marginLeft: '0.5rem', fontStyle: 'italic' }}>
                                ({item.reason})
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDismissUncertainItem(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '0.2rem',
                            }}
                            title="Dismiss note"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── SECTION 1: MEDICATIONS (PRIMARY) ── */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.25rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: '#ecfdf5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Pill size={18} color="#059669" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                          Prescribed Medications ({medications.length})
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Mapped to patient reminder schedule slots
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleAddMedication}>
                      <Plus size={14} style={{ marginRight: '0.35rem' }} />
                      Add Medication
                    </Button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    {medications.map((med, idx) => (
                      <div
                        key={med.id || idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '1.1rem',
                          position: 'relative',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        {/* Med Card Top Row */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr auto',
                            gap: '0.85rem',
                            alignItems: 'flex-start',
                            marginBottom: '1rem',
                          }}
                        >
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                              MEDICATION NAME & STRENGTH *
                            </label>
                            <input
                              type="text"
                              value={med.medication_name}
                              onChange={(e) => handleUpdateMedField(idx, 'medication_name', e.target.value)}
                              placeholder="e.g. Paracetamol 500mg, Augmentin 625mg"
                              style={{
                                width: '100%',
                                padding: '0.55rem 0.8rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: '#0f172a',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                              ROUTE
                            </label>
                            <select
                              value={med.route || 'oral'}
                              onChange={(e) => handleUpdateMedField(idx, 'route', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.55rem 0.8rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.86rem',
                                color: '#0f172a',
                                background: '#ffffff',
                              }}
                            >
                              <option value="oral">Oral (Tablet/Syrup)</option>
                              <option value="topical">Topical (Cream/Ointment)</option>
                              <option value="inhalation">Inhalation (Inhaler)</option>
                              <option value="drops">Drops (Eye/Ear)</option>
                              <option value="injection">Injection</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                              FREQUENCY
                            </label>
                            <input
                              type="text"
                              value={med.frequency || ''}
                              onChange={(e) => handleUpdateMedField(idx, 'frequency', e.target.value)}
                              placeholder="e.g. Twice daily, Once daily"
                              style={{
                                width: '100%',
                                padding: '0.55rem 0.8rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.86rem',
                                color: '#0f172a',
                              }}
                            />
                          </div>

                          <div style={{ paddingTop: '1.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(idx)}
                              style={{
                                background: '#fee2e2',
                                border: 'none',
                                color: '#dc2626',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                              }}
                              title="Delete medication"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Dosage Timing Schedule Grid */}
                        <div
                          style={{
                            background: '#ffffff',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                            padding: '0.85rem',
                            marginBottom: '0.85rem',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#64748b',
                              marginBottom: '0.65rem',
                              letterSpacing: '0.02em',
                            }}
                          >
                            DOSAGE TIMING SLOTS (AT LEAST ONE REQUIRED)
                          </span>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(4, 1fr)',
                              gap: '0.75rem',
                            }}
                          >
                            {/* Morning Slot */}
                            <div
                              style={{
                                border: med.morning ? '1px solid #10b981' : '1px solid #e2e8f0',
                                background: med.morning ? '#f0fdf4' : '#fafafa',
                                borderRadius: '8px',
                                padding: '0.65rem',
                              }}
                            >
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  fontSize: '0.84rem',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  cursor: 'pointer',
                                  marginBottom: '0.4rem',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={med.morning}
                                  onChange={(e) => handleUpdateMedField(idx, 'morning', e.target.checked)}
                                />
                                Morning
                              </label>
                              {med.morning && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <input
                                    type="time"
                                    value={med.morning_time || '08:00'}
                                    onChange={(e) => handleUpdateMedField(idx, 'morning_time', e.target.value)}
                                    style={{
                                      fontSize: '0.78rem',
                                      padding: '0.25rem',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      width: '100%',
                                    }}
                                  />
                                  <label style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <input
                                      type="checkbox"
                                      checked={med.morning_before_meal}
                                      onChange={(e) => handleUpdateMedField(idx, 'morning_before_meal', e.target.checked)}
                                    />
                                    Before meal
                                  </label>
                                </div>
                              )}
                            </div>

                            {/* Afternoon Slot */}
                            <div
                              style={{
                                border: med.afternoon ? '1px solid #10b981' : '1px solid #e2e8f0',
                                background: med.afternoon ? '#f0fdf4' : '#fafafa',
                                borderRadius: '8px',
                                padding: '0.65rem',
                              }}
                            >
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  fontSize: '0.84rem',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  cursor: 'pointer',
                                  marginBottom: '0.4rem',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={med.afternoon}
                                  onChange={(e) => handleUpdateMedField(idx, 'afternoon', e.target.checked)}
                                />
                                Afternoon
                              </label>
                              {med.afternoon && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <input
                                    type="time"
                                    value={med.afternoon_time || '13:00'}
                                    onChange={(e) => handleUpdateMedField(idx, 'afternoon_time', e.target.value)}
                                    style={{
                                      fontSize: '0.78rem',
                                      padding: '0.25rem',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      width: '100%',
                                    }}
                                  />
                                  <label style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <input
                                      type="checkbox"
                                      checked={med.afternoon_before_meal}
                                      onChange={(e) => handleUpdateMedField(idx, 'afternoon_before_meal', e.target.checked)}
                                    />
                                    Before meal
                                  </label>
                                </div>
                              )}
                            </div>

                            {/* Evening Slot */}
                            <div
                              style={{
                                border: med.evening ? '1px solid #10b981' : '1px solid #e2e8f0',
                                background: med.evening ? '#f0fdf4' : '#fafafa',
                                borderRadius: '8px',
                                padding: '0.65rem',
                              }}
                            >
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  fontSize: '0.84rem',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  cursor: 'pointer',
                                  marginBottom: '0.4rem',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={med.evening}
                                  onChange={(e) => handleUpdateMedField(idx, 'evening', e.target.checked)}
                                />
                                Evening
                              </label>
                              {med.evening && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <input
                                    type="time"
                                    value={med.evening_time || '18:00'}
                                    onChange={(e) => handleUpdateMedField(idx, 'evening_time', e.target.value)}
                                    style={{
                                      fontSize: '0.78rem',
                                      padding: '0.25rem',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      width: '100%',
                                    }}
                                  />
                                  <label style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <input
                                      type="checkbox"
                                      checked={med.evening_before_meal}
                                      onChange={(e) => handleUpdateMedField(idx, 'evening_before_meal', e.target.checked)}
                                    />
                                    Before meal
                                  </label>
                                </div>
                              )}
                            </div>

                            {/* Night Slot */}
                            <div
                              style={{
                                border: med.night ? '1px solid #10b981' : '1px solid #e2e8f0',
                                background: med.night ? '#f0fdf4' : '#fafafa',
                                borderRadius: '8px',
                                padding: '0.65rem',
                              }}
                            >
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  fontSize: '0.84rem',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  cursor: 'pointer',
                                  marginBottom: '0.4rem',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={med.night}
                                  onChange={(e) => handleUpdateMedField(idx, 'night', e.target.checked)}
                                />
                                Night
                              </label>
                              {med.night && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <input
                                    type="time"
                                    value={med.night_time || '21:00'}
                                    onChange={(e) => handleUpdateMedField(idx, 'night_time', e.target.value)}
                                    style={{
                                      fontSize: '0.78rem',
                                      padding: '0.25rem',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      width: '100%',
                                    }}
                                  />
                                  <label style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <input
                                      type="checkbox"
                                      checked={med.night_before_meal}
                                      onChange={(e) => handleUpdateMedField(idx, 'night_before_meal', e.target.checked)}
                                    />
                                    Before meal
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dates & Instructions Row */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 2fr',
                            gap: '0.85rem',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                              START DATE
                            </label>
                            <input
                              type="date"
                              value={med.start_date}
                              onChange={(e) => handleUpdateMedField(idx, 'start_date', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.84rem',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                              END DATE
                            </label>
                            <input
                              type="date"
                              value={med.end_date}
                              onChange={(e) => handleUpdateMedField(idx, 'end_date', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.84rem',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                              SPECIAL INSTRUCTIONS
                            </label>
                            <input
                              type="text"
                              value={med.special_instructions || ''}
                              onChange={(e) => handleUpdateMedField(idx, 'special_instructions', e.target.value)}
                              placeholder="e.g. Take with warm water, avoid dairy"
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.84rem',
                              }}
                            />
                          </div>
                        </div>

                        {/* Evidence Transcript Excerpt Accordion */}
                        {med.evidence && med.evidence.length > 0 && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={() => toggleEvidence(`med-${idx}`)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#0d9488',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              <MessageSquare size={13} />
                              {expandedEvidence[`med-${idx}`] ? 'Hide spoken evidence' : 'Show spoken dialogue evidence'}
                            </button>

                            {expandedEvidence[`med-${idx}`] && (
                              <div
                                style={{
                                  marginTop: '0.4rem',
                                  padding: '0.55rem 0.8rem',
                                  background: '#f0fdfa',
                                  borderLeft: '3px solid #0d9488',
                                  borderRadius: '0 6px 6px 0',
                                  fontSize: '0.78rem',
                                  color: '#134e4a',
                                }}
                              >
                                {med.evidence.map((ev, evIdx) => (
                                  <div key={evIdx} style={{ fontStyle: 'italic' }}>
                                    "{ev.transcript_excerpt}"
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── SECTION 2: DIAGNOSES & CLINICAL IMPRESSIONS ── */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: '#eff6ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Stethoscope size={18} color="#2563eb" />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                        Diagnoses & Clinical Impressions ({diagnoses.length})
                      </h4>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleAddDiagnosis}>
                      <Plus size={14} style={{ marginRight: '0.35rem' }} />
                      Add Diagnosis
                    </Button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {diagnoses.map((dx, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr auto',
                          gap: '0.75rem',
                          alignItems: 'center',
                          background: '#f8fafc',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <input
                          type="text"
                          value={dx.diagnosis_name || ''}
                          onChange={(e) => handleUpdateDiagnosis(idx, 'diagnosis_name', e.target.value)}
                          placeholder="e.g. Acute Bronchitis, Type 2 Diabetes"
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem',
                          }}
                        />

                        <select
                          value={dx.certainty || 'confirmed'}
                          onChange={(e) => handleUpdateDiagnosis(idx, 'certainty', e.target.value)}
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.84rem',
                            background: '#ffffff',
                          }}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="suspected">Suspected</option>
                          <option value="differential">Differential</option>
                          <option value="ruled_out">Ruled Out</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveDiagnosis(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {diagnoses.length === 0 && (
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No specific diagnoses recorded. You can add one using the button above.
                      </p>
                    )}
                  </div>
                </div>

                {/* ── SECTION 3: LAB TESTS & INVESTIGATIONS ── */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: '#fdf4ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Activity size={18} color="#a855f7" />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                        Recommended Tests & Investigations ({tests.length})
                      </h4>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleAddTest}>
                      <Plus size={14} style={{ marginRight: '0.35rem' }} />
                      Add Test
                    </Button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {tests.map((test, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 2fr auto',
                          gap: '0.75rem',
                          alignItems: 'center',
                          background: '#f8fafc',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <input
                          type="text"
                          value={test.test_name || ''}
                          onChange={(e) => handleUpdateTest(idx, 'test_name', e.target.value)}
                          placeholder="e.g. CBC, HbA1c, Chest X-Ray"
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem',
                          }}
                        />

                        <select
                          value={test.urgency || 'routine'}
                          onChange={(e) => handleUpdateTest(idx, 'urgency', e.target.value)}
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.84rem',
                            background: '#ffffff',
                          }}
                        >
                          <option value="routine">Routine</option>
                          <option value="urgent">Urgent</option>
                          <option value="stat">Immediate (Stat)</option>
                        </select>

                        <input
                          type="text"
                          value={test.reason || ''}
                          onChange={(e) => handleUpdateTest(idx, 'reason', e.target.value)}
                          placeholder="Clinical indication / reason"
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.84rem',
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveTest(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {tests.length === 0 && (
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No diagnostic tests ordered.
                      </p>
                    )}
                  </div>
                </div>

                {/* ── SECTION 4: GENERAL DOCTOR NOTES & LIFESTYLE ADVICE ── */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ClipboardList size={18} color="#d97706" />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      Clinical Advice & Prescription Summary Notes
                    </h4>
                  </div>

                  <textarea
                    rows={3}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="General doctor instructions, dietary precautions, follow-up timeline, or advice..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Transcript Slide-out Drawer ── */}
          {showTranscriptDrawer && transcript && (
            <div
              style={{
                width: '380px',
                borderLeft: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInRight 0.2s ease-out',
              }}
            >
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                  Consultation Dialogue
                </span>
                <button
                  type="button"
                  onClick={() => setShowTranscriptDrawer(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={17} />
                </button>
              </div>

              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {transcript.structured_transcript && transcript.structured_transcript.length > 0 ? (
                  transcript.structured_transcript.map((seg, sIdx) => {
                    const isDoctor = seg.speaker === 'doctor';
                    return (
                      <div
                        key={sIdx}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          background: isDoctor ? '#ecfdf5' : '#ffffff',
                          border: isDoctor ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                          fontSize: '0.82rem',
                          alignSelf: isDoctor ? 'flex-end' : 'flex-start',
                          maxWidth: '92%',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: isDoctor ? '#047857' : '#2563eb',
                            marginBottom: '0.2rem',
                            fontSize: '0.74rem',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isDoctor ? 'Doctor' : 'Patient'}
                        </div>
                        <div style={{ color: '#1e293b', lineHeight: 1.4 }}>{seg.text}</div>
                      </div>
                    );
                  })
                ) : (
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      fontSize: '0.82rem',
                      color: '#334155',
                      margin: 0,
                    }}
                  >
                    {transcript.full_text || 'No dialogue recorded.'}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Action Footer ── */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onSwitchToManual) onSwitchToManual();
              }}
            >
              Manual Writer
            </Button>

            {viewStatus === 'ready' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                loading={isRegenerating}
                title="Re-run LLM extraction from transcript"
              >
                <RefreshCw size={14} style={{ marginRight: '0.35rem' }} />
                Regenerate AI
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Button variant="secondary" onClick={onClose} disabled={isApproving}>
              Cancel
            </Button>

            {viewStatus === 'ready' && (
              <Button
                variant="success"
                onClick={handleApprove}
                loading={isApproving}
                disabled={medications.length === 0}
                style={{
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                }}
              >
                <CheckCircle2 size={17} style={{ marginRight: '0.45rem' }} />
                Approve & Issue Prescription
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
