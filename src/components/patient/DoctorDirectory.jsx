import React, { useState, useEffect } from 'react';
import { meetingApi } from '../../api/meeting';
import { patientDocumentsApi } from '../../api/patientDocuments';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { Loader } from '../common/Loader';
import {
  Stethoscope,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  HeartPulse,
  Paperclip,
  AlertCircle,
} from 'lucide-react';

export function DoctorDirectory({ onMeetingBooked }) {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Selected doctor for slot expansion
  const [expandedDoctorId, setExpandedDoctorId] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Booking modal / form
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [patientNotes, setPatientNotes] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Patient documents for attachment selection
  const [patientDocs, setPatientDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    loadDoctors();
    loadPatientDocs();
  }, []);

  const loadPatientDocs = async () => {
    setDocsLoading(true);
    try {
      const docs = await patientDocumentsApi.listDocuments();
      setPatientDocs(docs);
    } catch (err) {
      // Silently fail — documents are optional
    } finally {
      setDocsLoading(false);
    }
  };

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const data = await meetingApi.getDoctors();
      setDoctors(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load doctors directory.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDoctor = async (doctorId) => {
    if (expandedDoctorId === doctorId) {
      setExpandedDoctorId(null);
      setDoctorSlots([]);
      return;
    }

    setExpandedDoctorId(doctorId);
    setSlotsLoading(true);
    try {
      const slots = await meetingApi.getDoctorSlots(doctorId);
      setDoctorSlots(slots);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not fetch doctor free timings.' });
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    // Validate mandatory reason
    const trimmedNotes = patientNotes.trim();
    if (!trimmedNotes) {
      setReasonError('Please enter a reason for consultation. This field is required.');
      return;
    }
    setReasonError('');

    setIsBooking(true);
    try {
      await meetingApi.bookMeeting({
        doctor_id: selectedSlot.doctor_id,
        availability_id: selectedSlot.id,
        patient_notes: trimmedNotes,
        document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      });

      setToast({
        type: 'success',
        message: 'Consultation booked successfully! It has been added to your appointments.',
      });

      setSelectedSlot(null);
      setPatientNotes('');
      setReasonError('');
      setSelectedDocIds([]);
      // Reload slots for this doctor
      handleToggleDoctor(selectedSlot.doctor_id);
      if (onMeetingBooked) onMeetingBooked();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to book consultation.' });
    } finally {
      setIsBooking(false);
    }
  };

  const toggleDocSelection = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <div className="doctor-directory">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>Verified Specialist Doctors</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Select a doctor below to view their free timings and book your online video/audio consultation.
        </p>
      </div>

      {isLoading ? (
        <Loader text="Loading verified specialists..." />
      ) : doctors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <Stethoscope size={40} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
          <h3>No Doctors Available Right Now</h3>
          <p style={{ fontSize: '0.85rem' }}>Please check back shortly as doctors set their availability.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {doctors.map((doc) => {
            const isExpanded = expandedDoctorId === doc.doctor_id;

            return (
              <div
                key={doc.doctor_id}
                className="card"
                style={{
                  border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Doctor Summary Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleToggleDoctor(doc.doctor_id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 700,
                      }}
                    >
                      {doc.full_name ? doc.full_name[0] : 'D'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                          Dr. {doc.full_name || 'Specialist Doctor'}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: '#dbeafe',
                            color: '#1e40af',
                            fontWeight: 700,
                          }}
                        >
                          {doc.specialization || 'General Physician'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {doc.qualification && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Award size={14} color="var(--primary)" /> {doc.qualification}
                          </span>
                        )}
                        {doc.years_of_experience && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={14} color="var(--accent)" /> {doc.years_of_experience} yrs exp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: doc.available_slots_count > 0 ? '#059669' : 'var(--text-muted)',
                        background: doc.available_slots_count > 0 ? '#ecfdf5' : '#f1f5f9',
                        padding: '0.3rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid',
                        borderColor: doc.available_slots_count > 0 ? '#a7f3d0' : '#e2e8f0',
                      }}
                    >
                      {doc.available_slots_count} Free Slot(s)
                    </span>

                    <Button
                      variant={isExpanded ? 'secondary' : 'primary'}
                      size="sm"
                      icon={isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    >
                      {isExpanded ? 'Hide Timings' : 'View Free Timings'}
                    </Button>
                  </div>
                </div>

                {/* Doctor Bio (if present) */}
                {doc.bio && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.75rem 0 0 0', lineHeight: 1.5 }}>
                    {doc.bio}
                  </p>
                )}

                {/* Expanded Free Slots Section */}
                {isExpanded && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={16} color="var(--primary)" />
                      Available Consultation Timings:
                    </div>

                    {slotsLoading ? (
                      <Loader text="Fetching open time slots..." />
                    ) : doctorSlots.length === 0 ? (
                      <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No open time slots available for this doctor currently. Please check back later.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem' }}>
                        {doctorSlots.map((slot) => {
                          const sDt = new Date(slot.start_time);
                          const eDt = new Date(slot.end_time);

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #93c5fd',
                                background: '#eff6ff',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#93c5fd')}
                            >
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {sDt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                                {sDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {eDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600, marginTop: '4px' }}>
                                Click to Book
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {selectedSlot && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartPulse size={22} color="var(--primary)" />
              Confirm Video Consultation
            </h3>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><strong>Date:</strong> {new Date(selectedSlot.start_time).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div style={{ marginTop: '4px' }}>
                <strong>Time:</strong> {new Date(selectedSlot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(selectedSlot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Mandatory Reason Field */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="patient-reason"
                style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}
              >
                Reason for Consultation / Symptoms
                <span style={{ color: '#dc2626', fontSize: '0.9rem' }}>*</span>
              </label>
              <textarea
                id="patient-reason"
                rows={3}
                value={patientNotes}
                onChange={(e) => {
                  setPatientNotes(e.target.value);
                  if (e.target.value.trim()) setReasonError('');
                }}
                placeholder="Describe your symptoms or what you would like to discuss with the doctor..."
                required
                aria-required="true"
                aria-invalid={!!reasonError}
                aria-describedby={reasonError ? 'reason-error' : undefined}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${reasonError ? '#ef4444' : 'var(--border-color)'}`,
                  boxShadow: reasonError ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                }}
              />
              {reasonError && (
                <div
                  id="reason-error"
                  role="alert"
                  style={{
                    fontSize: '0.8rem',
                    color: '#dc2626',
                    fontWeight: 500,
                    marginTop: '0.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <AlertCircle size={14} />
                  {reasonError}
                </div>
              )}
            </div>

            {/* Document Attachment Section (Optional) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.5rem',
                }}
              >
                <Paperclip size={15} color="var(--primary)" />
                Attach Medical Documents
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Optional)</span>
              </label>

              {docsLoading ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>Loading your documents...</div>
              ) : patientDocs.length === 0 ? (
                <div
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.75rem',
                    background: 'var(--bg-alt)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  No documents uploaded yet. You can upload medical documents from the
                  <strong> "My Medical Documents" </strong> tab on your dashboard.
                </div>
              ) : (
                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {patientDocs.map((doc, idx) => (
                    <label
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.65rem 0.85rem',
                        borderBottom: idx < patientDocs.length - 1 ? '1px solid var(--border-color)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease',
                        background: selectedDocIds.includes(doc.id) ? '#f0fdf4' : 'transparent',
                        fontSize: '0.85rem',
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedDocIds.includes(doc.id)) e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedDocIds.includes(doc.id)) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.id)}
                        onChange={() => toggleDocSelection(doc.id)}
                        aria-label={`Select ${doc.label || doc.original_filename} to share with doctor`}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: 'var(--primary)',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                        <FileText size={15} color={doc.mime_type === 'application/pdf' ? '#d97706' : '#2563eb'} style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.label || doc.original_filename}
                          </div>
                          {doc.label && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.original_filename}
                            </div>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {doc.mime_type?.split('/')[1]?.toUpperCase()}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {selectedDocIds.length > 0 && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#059669',
                    fontWeight: 600,
                    marginTop: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <CheckCircle2 size={13} />
                  {selectedDocIds.length} document{selectedDocIds.length !== 1 ? 's' : ''} selected to share
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedSlot(null);
                  setReasonError('');
                  setSelectedDocIds([]);
                }}
                disabled={isBooking}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmBooking}
                isLoading={isBooking}
                disabled={!patientNotes.trim()}
              >
                Confirm Appointment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
