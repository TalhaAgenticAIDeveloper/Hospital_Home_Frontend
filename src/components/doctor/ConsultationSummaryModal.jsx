import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Printer,
  FileText,
  AlertCircle,
  Clock,
  User,
  HeartPulse,
  Activity,
  Calendar,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Stethoscope,
  Pill,
} from 'lucide-react';
import { consultationAiApi } from '../../api/consultationAi';

export function ConsultationSummaryModal({
  isOpen,
  onClose,
  meetingId,
  isDoctor = false,
  doctorName = 'Doctor',
  patientName = 'Patient',
  onOpenPrescription,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extraction, setExtraction] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !meetingId) return;

    fetchData();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, meetingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check status first
      const statusRes = await consultationAiApi.getStatus(meetingId).catch(() => null);

      if (statusRes?.extraction_status === 'completed') {
        const extRes = await consultationAiApi.getExtraction(meetingId);
        setExtraction(extRes);
        setLoading(false);
      } else if (
        statusRes?.extraction_status === 'processing' ||
        statusRes?.transcription_status === 'processing' ||
        statusRes?.transcription_status === 'completed'
      ) {
        // Extraction is still running, start polling
        setPolling(true);
        startPolling();
      } else {
        // Try direct fetch
        const extRes = await consultationAiApi.getExtraction(meetingId).catch(() => null);
        if (extRes && extRes.status === 'completed') {
          setExtraction(extRes);
          setLoading(false);
        } else {
          // If no extraction yet, start extraction or poll
          setPolling(true);
          startPolling();
        }
      }

      // Also fetch transcript if available
      consultationAiApi.getTranscript(meetingId)
        .then((t) => setTranscript(t))
        .catch(() => {});
    } catch (err) {
      console.warn('ConsultationSummaryModal fetch notice:', err);
      // Try polling if not already
      setPolling(true);
      startPolling();
    }
  };

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setPolling(false);
        setLoading(false);
        setError('AI summary generation is taking longer than expected. Please check back in a moment.');
        return;
      }

      try {
        const statusRes = await consultationAiApi.getStatus(meetingId);
        if (statusRes.extraction_status === 'completed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPolling(false);
          const extRes = await consultationAiApi.getExtraction(meetingId);
          setExtraction(extRes);
          setLoading(false);
        } else if (statusRes.extraction_status === 'failed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPolling(false);
          setLoading(false);
          setError(statusRes.error_message || 'AI summary generation could not be completed.');
        }
      } catch (e) {
        // continue polling
      }
    }, 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const data = extraction?.extraction_data || extraction?.approved_extraction_data || {};
  const {
    consultation_summary,
    diagnoses = [],
    symptoms = [],
    medications = [],
    doctor_instructions = [],
    follow_ups = [],
  } = data;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Consultation AI Summary & Key Takeaways
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Doctor: {doctorName} • Patient: {patientName}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!loading && !error && (
              <button
                onClick={handlePrint}
                title="Print Summary"
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                <Printer size={15} /> Print
              </button>
            )}
            <button
              onClick={onClose}
              title="Close Dialog"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', background: '#f8fafc' }}>
          {loading || polling ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '340px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  border: '3px solid #10b981',
                  borderTopColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                AI is Summarizing Consultation Dialogue...
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', maxWidth: '420px', lineHeight: 1.5 }}>
                Analyzing symptoms, illness discussions, recommendations, and important takeaways from the call. This takes just a few seconds.
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #fee2e2',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <AlertCircle size={28} color="#ef4444" />
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#991b1b' }}>
                Summary Unavailable
              </h4>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: '#b91c1c', maxWidth: '440px', marginInline: 'auto' }}>
                {error}
              </p>
              <button
                onClick={fetchData}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <RefreshCw size={15} /> Retry AI Generation
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* 1. Executive Consultation Summary */}
              {consultation_summary && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <FileText size={18} color="#059669" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      Consultation Overview (Kiya Baat Hui)
                    </h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {consultation_summary}
                  </p>
                </div>
              )}

              {/* 2. Illness & Diagnoses */}
              {diagnoses.length > 0 && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <HeartPulse size={18} color="#dc2626" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      Diagnosis & Illness Identified (Kiya Bimari Thi)
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                    {diagnoses.map((dx, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.6rem 0.95rem',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991b1b' }}>
                          {dx.diagnosis_name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            background: dx.certainty === 'confirmed' ? '#bbf7d0' : '#fed7aa',
                            color: dx.certainty === 'confirmed' ? '#166534' : '#9a3412',
                            textTransform: 'capitalize',
                          }}
                        >
                          {dx.certainty || 'Suspected'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Reported Symptoms */}
              {symptoms.length > 0 && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <Activity size={18} color="#f59e0b" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      Reported Symptoms (Kiya Kiya Symptoms Thay)
                    </h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    {symptoms.map((sym, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem 1rem',
                          background: '#fffbeb',
                          border: '1px solid #fef3c7',
                          borderRadius: '10px',
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400e', marginBottom: '0.2rem' }}>
                          {sym.symptom}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                          {sym.duration && <span>Duration: {sym.duration}</span>}
                          {sym.duration && sym.severity && <span> • </span>}
                          {sym.severity && <span>Severity: {sym.severity}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Medications & Treatments Discussed in Call */}
              {medications.length > 0 && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Pill size={18} color="#2563eb" />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        Medications & Treatments Discussed in Call
                      </h4>
                    </div>
                    {isDoctor && onOpenPrescription && (
                      <button
                        onClick={onOpenPrescription}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#059669',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Open Prescription Writer
                      </button>
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.78rem', color: '#64748b' }}>
                    * Summary of medicines discussed during consultation. Official prescriptions are issued by the doctor directly.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {medications.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem 1rem',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                            {m.medication_name}
                          </span>
                          {m.dose_value && (
                            <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>
                              ({m.dose_value} {m.dose_unit || ''})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', gap: '0.5rem' }}>
                          {m.frequency && (
                            <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                              {m.frequency}
                            </span>
                          )}
                          {m.meal_relation && (
                            <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                              {m.meal_relation.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Doctor Instructions & Precautions */}
              {doctor_instructions.length > 0 && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <ShieldAlert size={18} color="#059669" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      Doctor's Advice & Patient Instructions (Hidayat & Ehtiyat)
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {doctor_instructions.map((inst, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.65rem 0.95rem',
                          background: '#f0fdf4',
                          border: '1px solid #dcfce7',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '0.6rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: '#bbf7d0',
                            color: '#166534',
                            textTransform: 'uppercase',
                          }}
                        >
                          {inst.category || 'General'}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#166534', lineHeight: 1.5 }}>
                          {inst.instruction_text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Follow-up & Next Steps */}
              {follow_ups.length > 0 && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <Calendar size={18} color="#6366f1" />
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      Follow-up & Next Steps
                    </h4>
                  </div>
                  {follow_ups.map((fu, idx) => (
                    <div key={idx} style={{ fontSize: '0.875rem', color: '#334155' }}>
                      {fu.follow_up_period && <strong>Timeline: {fu.follow_up_period}. </strong>}
                      {fu.instructions && <span>{fu.instructions}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* 7. Collapsible Conversation Transcript */}
              {transcript?.segments?.length > 0 && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowFullTranscript((v) => !v)}
                    style={{
                      width: '100%',
                      padding: '1rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} color="#64748b" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                        Word-by-Word Consultation Transcript ({transcript.segments.length} segments)
                      </span>
                    </div>
                    {showFullTranscript ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {showFullTranscript && (
                    <div
                      style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid #f1f5f9',
                        maxHeight: '320px',
                        overflowY: 'auto',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                      }}
                    >
                      {transcript.segments.map((seg, idx) => {
                        const isDoc = seg.speaker === 'doctor';
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '0.6rem 0.85rem',
                              borderRadius: '10px',
                              background: isDoc ? '#f0fdf4' : '#eef2ff',
                              border: `1px solid ${isDoc ? '#dcfce7' : '#e0e7ff'}`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: isDoc ? '#166534' : '#3730a3',
                                marginBottom: '0.2rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>{isDoc ? `Dr. ${doctorName}` : patientName}</span>
                              {seg.start_time !== undefined && (
                                <span style={{ color: '#94a3b8' }}>
                                  {Math.floor(seg.start_time / 60)}:{(seg.start_time % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.4 }}>
                              {seg.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.875rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
