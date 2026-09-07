import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingApi } from '../../api/meeting';
import { Button } from '../common/Button';
import { CountdownJoinButton } from '../common/CountdownJoinButton';
import { Toast } from '../common/Toast';
import { Loader } from '../common/Loader';
import {
  Video,
  FileText,
  Download,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  X,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export function DoctorMeetingsList() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Transcript view modal
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const data = await meetingApi.getMyMeetings();
      setMeetings(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load meetings.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTranscript = async (meetingId) => {
    setTranscriptLoading(true);
    try {
      const data = await meetingApi.getTranscriptText(meetingId);
      setSelectedTranscript(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch transcript.' });
    } finally {
      setTranscriptLoading(false);
    }
  };

  const handleDownload = async (meetingId) => {
    try {
      await meetingApi.downloadTranscript(meetingId);
      setToast({ type: 'success', message: 'Transcript download started.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Download failed.' });
    }
  };

  const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled' || m.status === 'in_progress');
  const pastMeetings = meetings.filter((m) => m.status === 'completed' || m.status === 'cancelled');

  return (
    <div className="doctor-meetings-list">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ── Section 1: Upcoming Consultations ────────────────────────────── */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Video size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Upcoming Patient Appointments</h3>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Active: <strong>{upcomingMeetings.length}</strong>
          </span>
        </div>

        {isLoading ? (
          <Loader text="Loading your scheduled appointments..." />
        ) : upcomingMeetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Calendar size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p>No upcoming patient appointments scheduled right now.</p>
            <p style={{ fontSize: '0.85rem' }}>Patients will book meetings based on your set free timings.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
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
                    background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ padding: '0.4rem', background: '#dbeafe', borderRadius: '50%' }}>
                          <User size={18} color="var(--primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            Patient: {m.patient_name || m.patient_email}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {m.patient_email}
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
                          marginBottom: '1rem',
                          border: '1px solid rgba(0,0,0,0.05)',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Reason / Symptoms:</span>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>{m.patient_notes}</span>
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

      {/* ── Section 2: Past Consultations & Transcripts ────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <FileText size={22} color="var(--accent)" />
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Past Consultations & Speech Transcripts</h3>
        </div>

        {pastMeetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <p>No past consultations completed yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Meeting transcript files (English & Urdu) will appear here after consultations end.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Transcript Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pastMeetings.map((m) => {
                  const dt = new Date(m.start_time);
                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{dt.toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div>{m.patient_name || m.patient_email}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: m.status === 'completed' ? '#dcfce7' : '#fee2e2',
                            color: m.status === 'completed' ? '#166534' : '#991b1b',
                            fontWeight: 600,
                          }}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td>
                        {m.has_transcript ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                            <CheckCircle2 size={14} /> Available (.txt)
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewTranscript(m.id)}
                            icon={<FileText size={14} />}
                          >
                            View
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownload(m.id)}
                            icon={<Download size={14} />}
                            title="Download transcript file"
                          >
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Transcript Preview Modal ───────────────────────────────────────── */}
      {selectedTranscript && (
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
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Consultation Transcript & Notes</h3>
              </div>
              <button
                onClick={() => setSelectedTranscript(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontFamily: "'Segoe UI', 'Noto Nastaliq Urdu', Tahoma, Geneva, Verdana, sans-serif",
                fontSize: '0.9rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                color: '#1e293b',
              }}
            >
              {selectedTranscript.transcript_text || 'No transcript text available for this meeting.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(selectedTranscript.meeting_id)}
                icon={<Download size={14} />}
              >
                Download (.txt)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedTranscript(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
