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
  Paperclip,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
} from 'lucide-react';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { DocumentSummaryModal } from './DocumentSummaryModal';

export function DoctorMeetingsList() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);


  // Patient document viewing
  const [expandedDocsMeetingId, setExpandedDocsMeetingId] = useState(null);
  const [meetingDocs, setMeetingDocs] = useState({});
  const [docsLoading, setDocsLoading] = useState({});

  // Document in-browser viewer modal
  const [viewerDoc, setViewerDoc] = useState(null);
  const [viewerBlobUrl, setViewerBlobUrl] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(null);
  const [viewerMeetingId, setViewerMeetingId] = useState(null);

  // Document AI Summary modal
  const [summaryDoc, setSummaryDoc] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [summaryMeetingId, setSummaryMeetingId] = useState(null);

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

  const handleTogglePatientDocs = async (meetingId) => {
    if (expandedDocsMeetingId === meetingId) {
      setExpandedDocsMeetingId(null);
      return;
    }
    setExpandedDocsMeetingId(meetingId);

    // Fetch if not already loaded
    if (!meetingDocs[meetingId]) {
      setDocsLoading((prev) => ({ ...prev, [meetingId]: true }));
      try {
        const docs = await meetingApi.getMeetingPatientDocuments(meetingId);
        setMeetingDocs((prev) => ({ ...prev, [meetingId]: docs }));
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Failed to load patient documents.' });
      } finally {
        setDocsLoading((prev) => ({ ...prev, [meetingId]: false }));
      }
    }
  };

  const handleDownloadPatientDoc = async (meetingId, doc) => {
    try {
      await meetingApi.downloadMeetingPatientDocument(
        meetingId,
        doc.patient_document_id || doc.id,
        doc.original_filename || 'document'
      );
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to download document.' });
    }
  };

  const handleViewPatientDoc = async (meetingId, doc) => {
    setViewerDoc(doc);
    setViewerMeetingId(meetingId);
    setViewerLoading(true);
    setViewerError(null);
    setViewerBlobUrl(null);
    try {
      const url = await meetingApi.getMeetingPatientDocumentBlobUrl(
        meetingId,
        doc.patient_document_id || doc.id
      );
      setViewerBlobUrl(url);
    } catch (err) {
      setViewerError(err.message || 'Failed to load document preview.');
    } finally {
      setViewerLoading(false);
    }
  };

  const handleCloseViewer = () => {
    if (viewerBlobUrl) {
      window.URL.revokeObjectURL(viewerBlobUrl);
    }
    setViewerDoc(null);
    setViewerBlobUrl(null);
    setViewerError(null);
  };

  const handleSummarizePatientDoc = async (meetingId, doc, forceRefresh = false) => {
    setSummaryDoc(doc);
    setSummaryMeetingId(meetingId);
    setSummaryError(null);

    // If already has summary and not forcing refresh, display immediately
    if (doc.ai_summary && !forceRefresh) {
      setSummaryData({
        status: doc.ai_summary_status || 'completed',
        summary: doc.ai_summary,
        is_cached: true,
        generated_at: doc.ai_summary_generated_at,
      });
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    try {
      const data = await meetingApi.summarizeMeetingPatientDocument(
        meetingId,
        doc.patient_document_id || doc.id,
        forceRefresh
      );
      setSummaryData(data);
      // Update local doc cache
      setMeetingDocs((prev) => {
        const mDocs = prev[meetingId] || [];
        return {
          ...prev,
          [meetingId]: mDocs.map((d) =>
            (d.patient_document_id === (doc.patient_document_id || doc.id) || d.id === doc.id)
              ? { ...d, ai_summary: data.summary, ai_summary_status: data.status }
              : d
          ),
        };
      });
    } catch (err) {
      setSummaryError(err.message || 'Failed to generate AI summary.');
    } finally {
      setSummaryLoading(false);
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
                          marginBottom: '0.75rem',
                          border: '1px solid rgba(0,0,0,0.05)',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Reason / Symptoms:</span>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>{m.patient_notes}</span>
                      </div>
                    )}

                    {/* Patient Documents Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePatientDocs(m.id)}
                      aria-expanded={expandedDocsMeetingId === m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        background: 'rgba(255,255,255,0.8)',
                        border: '1px solid var(--primary-light)',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        marginBottom: '0.75rem',
                        transition: 'all 0.15s ease',
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <Paperclip size={14} />
                      {expandedDocsMeetingId === m.id ? 'Hide' : 'View'} Patient Documents
                      {expandedDocsMeetingId === m.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Expanded Patient Documents */}
                    {expandedDocsMeetingId === m.id && (
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.85)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem',
                          marginBottom: '0.75rem',
                          animation: 'fadeIn 0.2s ease-out',
                        }}
                      >
                        {docsLoading[m.id] ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                            Loading patient documents...
                          </div>
                        ) : !meetingDocs[m.id] || meetingDocs[m.id].length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                            No documents were attached to this appointment.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.15rem' }}>
                              Shared Medical Documents ({meetingDocs[m.id].length})
                            </div>
                            {meetingDocs[m.id].map((doc) => (
                              <div
                                key={doc.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.5rem 0.65rem',
                                  background: '#f8fafc',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid #e2e8f0',
                                  gap: '0.5rem',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                                  <FileText
                                    size={16}
                                    color={doc.mime_type === 'application/pdf' ? '#d97706' : '#2563eb'}
                                    style={{ flexShrink: 0 }}
                                  />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {doc.label || doc.original_filename}
                                    </div>
                                    {doc.label && (
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {doc.original_filename}
                                      </div>
                                    )}
                                    {doc.ai_summary && (
                                      <span
                                        style={{
                                          fontSize: '0.68rem',
                                          background: '#e0e7ff',
                                          color: '#4338ca',
                                          padding: '0.15rem 0.45rem',
                                          borderRadius: '4px',
                                          fontWeight: 700,
                                          whiteSpace: 'nowrap',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.2rem',
                                        }}
                                      >
                                        <Sparkles size={11} /> Summarized
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    onClick={() => handleViewPatientDoc(m.id, doc)}
                                    title={`View ${doc.label || doc.original_filename} in browser`}
                                    aria-label={`View ${doc.label || doc.original_filename}`}
                                    style={{
                                      padding: '0.3rem 0.55rem',
                                      background: '#e0e7ff',
                                      color: '#4338ca',
                                      border: '1px solid #c7d2fe',
                                      borderRadius: 'var(--radius-sm)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <Eye size={13} />
                                    View
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSummarizePatientDoc(m.id, doc)}
                                    title={`Summarize ${doc.label || doc.original_filename} with AI`}
                                    aria-label={`Summarize ${doc.label || doc.original_filename} with AI`}
                                    style={{
                                      padding: '0.3rem 0.55rem',
                                      background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
                                      color: '#4f46e5',
                                      border: '1px solid #c7d2fe',
                                      borderRadius: 'var(--radius-sm)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <Sparkles size={13} />
                                    AI Summary
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPatientDoc(m.id, doc)}
                                    title={`Download ${doc.label || doc.original_filename}`}
                                    aria-label={`Download ${doc.label || doc.original_filename}`}
                                    style={{
                                      padding: '0.3rem 0.55rem',
                                      background: '#dbeafe',
                                      color: '#2563eb',
                                      border: '1px solid #93c5fd',
                                      borderRadius: 'var(--radius-sm)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <Download size={13} />
                                    Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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

      {/* ── Section 2: Past Consultations History ──────────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Clock size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Past Consultations History</h3>
        </div>

        {pastMeetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <p>No past consultations completed yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Patient</th>
                  <th>Chief Complaint / Reason</th>
                  <th>Doctor Notes</th>
                  <th>Status</th>
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
                        <div style={{ fontWeight: 600 }}>{m.patient_name || m.patient_email}</div>
                        {m.patient_name && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.patient_email}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', maxWidth: '280px' }}>
                          {m.patient_notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None specified</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', maxWidth: '280px' }}>
                          {m.doctor_notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None recorded</span>}
                        </div>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Document In-Browser Viewer Modal ────────────────────────────── */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDoc)}
        onClose={handleCloseViewer}
        document={viewerDoc}
        blobUrl={viewerBlobUrl}
        isLoading={viewerLoading}
        error={viewerError}
        onDownload={
          viewerDoc && viewerMeetingId
            ? () => handleDownloadPatientDoc(viewerMeetingId, viewerDoc)
            : undefined
        }
      />

      {/* ── Document AI Summary Modal ───────────────────────────────────── */}
      <DocumentSummaryModal
        isOpen={Boolean(summaryDoc)}
        onClose={() => {
          setSummaryDoc(null);
          setSummaryData(null);
          setSummaryError(null);
        }}
        document={summaryDoc}
        summaryData={summaryData}
        isLoading={summaryLoading}
        error={summaryError}
        onRegenerate={
          summaryDoc && summaryMeetingId
            ? () => handleSummarizePatientDoc(summaryMeetingId, summaryDoc, true)
            : undefined
        }
        onViewDocument={
          summaryDoc && summaryMeetingId
            ? () => {
                const doc = summaryDoc;
                const mId = summaryMeetingId;
                setSummaryDoc(null);
                handleViewPatientDoc(mId, doc);
              }
            : undefined
        }
        onDownload={
          summaryDoc && summaryMeetingId
            ? () => handleDownloadPatientDoc(summaryMeetingId, summaryDoc)
            : undefined
        }
      />
    </div>
  );
}
