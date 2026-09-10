import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingApi } from '../../api/meeting';
import { Button } from '../common/Button';
import { CountdownJoinButton } from '../common/CountdownJoinButton';
import { Toast } from '../common/Toast';
import { Loader } from '../common/Loader';
import {
  Video,
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Star,
  Pill,
} from 'lucide-react';
import { DoctorRatingModal } from './DoctorRatingModal';
import { PrescriptionView } from './PrescriptionView';
import { prescriptionApi } from '../../api/prescription';


export function PatientMeetingsList({ refreshTrigger }) {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [toast, setToast] = useState(null);
  const [ratingModalMeeting, setRatingModalMeeting] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loadingRxId, setLoadingRxId] = useState(null);

  const handleViewPrescription = async (m) => {
    setLoadingRxId(m.id);
    try {
      const rx = await prescriptionApi.getMeetingPrescription(m.id);
      setSelectedPrescription(rx);
    } catch (err) {
      setToast({ type: 'info', message: 'No prescription has been issued for this consultation yet.' });
    } finally {
      setLoadingRxId(null);
    }
  };

  useEffect(() => {
    loadMeetings();
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, [refreshTrigger]);

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const data = await meetingApi.getMyMeetings();
      setMeetings(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load your appointments.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Upcoming consultations: only active/scheduled appointments whose scheduled end time is in the future
  const upcomingMeetings = meetings.filter((m) => {
    const endMs = new Date(m.end_time).getTime();
    const isActive = m.status === 'scheduled' || m.status === 'in_progress';
    return isActive && endMs > currentTime;
  });

  // Past consultations: completed, cancelled, or appointments whose time has already passed
  const pastMeetings = meetings.filter((m) => {
    const endMs = new Date(m.end_time).getTime();
    const isFinished = m.status === 'completed' || m.status === 'cancelled';
    return isFinished || endMs <= currentTime;
  });

  return (
    <div className="patient-meetings-list">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Upcoming Consultations */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Video size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }} className="heading-gradient-dark">
              My Scheduled Consultations
            </h3>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Upcoming: <strong>{upcomingMeetings.length}</strong>
          </span>
        </div>

        {isLoading ? (
          <Loader text="Loading your appointments..." />
        ) : upcomingMeetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Calendar size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p>You have no upcoming doctor consultations scheduled.</p>
            <p style={{ fontSize: '0.85rem' }}>Browse available doctors above to book an appointment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {upcomingMeetings.map((m) => {
              const startDt = new Date(m.start_time);
              const endDt = new Date(m.end_time);

              return (
                <div
                  key={m.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #bfdbfe',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ padding: '0.4rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%' }}>
                          <Stethoscope size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            Dr. {m.doctor_name || 'Specialist Doctor'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {m.doctor_specialization || 'Medical Consultation'}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: m.status === 'in_progress' ? '#dcfce7' : '#e0e7ff',
                          color: m.status === 'in_progress' ? '#166534' : '#3730a3',
                          textTransform: 'uppercase',
                        }}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <Calendar size={15} color="var(--primary)" />
                        <strong>{startDt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={15} color="var(--primary)" />
                        <span>
                          {startDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {m.patient_notes && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          background: 'rgba(255,255,255,0.7)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: m.attached_documents?.length ? '0.5rem' : '1rem',
                          border: '1px solid rgba(0,0,0,0.05)',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Reason:</span>{' '}
                        <span>{m.patient_notes}</span>
                      </div>
                    )}

                    {m.attached_documents && m.attached_documents.length > 0 && (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#047857',
                          background: '#ecfdf5',
                          padding: '0.4rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '1rem',
                          border: '1px solid #a7f3d0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 600,
                        }}
                      >
                        <Paperclip size={13} />
                        <span>
                          {m.attached_documents.length} Medical Document{m.attached_documents.length > 1 ? 's' : ''} Attached
                        </span>
                      </div>
                    )}
                  </div>

                  <CountdownJoinButton
                    startTime={m.start_time}
                    endTime={m.end_time}
                    meetingId={m.id}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Completed Consultations */}
      {pastMeetings.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', fontWeight: 800 }} className="heading-gradient-dark">
            Past Consultations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pastMeetings.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#f8fafc',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Dr. {m.doctor_name || 'Specialist'} ({m.doctor_specialization || 'Consultation'})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(m.start_time).toLocaleDateString()} at {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {m.status === 'completed' && (
                    <>
                      <button
                        onClick={() => handleViewPrescription(m)}
                        disabled={loadingRxId === m.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0',
                          background: '#ecfdf5',
                          color: '#047857',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title="View Doctor Prescription"
                      >
                        <Pill size={13} />
                        <span>{loadingRxId === m.id ? 'Loading...' : 'Prescription'}</span>
                      </button>

                      <button
                        onClick={() => setRatingModalMeeting(m)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #fde047',
                          background: '#fef9c3',
                          color: '#854d0e',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title="Rate Doctor"
                      >
                        <Star size={13} fill="#eab308" color="#eab308" />
                        <span>Rate</span>
                      </button>
                    </>
                  )}

                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: m.status === 'completed' ? '#dcfce7' : m.status === 'cancelled' ? '#fee2e2' : '#f1f5f9',
                      color: m.status === 'completed' ? '#166534' : m.status === 'cancelled' ? '#991b1b' : '#475569',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {m.status === 'scheduled' ? 'Time Concluded' : m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModalMeeting && (
        <DoctorRatingModal
          isOpen={Boolean(ratingModalMeeting)}
          onClose={() => setRatingModalMeeting(null)}
          meetingId={ratingModalMeeting.id}
          doctorName={ratingModalMeeting.doctor_name}
          onSuccess={() => {
            setToast({ type: 'success', message: 'Rating submitted successfully!' });
            loadMeetings();
          }}
        />
      )}

      {/* Prescription View Modal */}
      {selectedPrescription && (
        <PrescriptionView
          isOpen={Boolean(selectedPrescription)}
          onClose={() => setSelectedPrescription(null)}
          prescription={selectedPrescription}
        />
      )}
    </div>
  );
}
