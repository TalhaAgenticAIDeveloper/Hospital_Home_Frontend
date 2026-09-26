import React, { useState, useEffect } from 'react';
import {
  History,
  Calendar,
  Clock,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  RefreshCw,
  User,
} from 'lucide-react';
import { consultationSummaryApi } from '../../api/consultationSummary';
import { Loader } from '../common/Loader';

/**
 * Shows a patient's full consultation history to the doctor.
 * Used in the meeting room or before a consultation so the doctor
 * has context from previous visits.
 *
 * @param {{ patientId: string, patientName?: string }} props
 */
export function PatientHistoryForDoctor({ patientId, patientName }) {
  const [summaries, setSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (patientId) loadHistory();
  }, [patientId]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await consultationSummaryApi.getPatientHistory(patientId);
      setSummaries(data || []);
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to load patient history.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dStr) => {
    if (!dStr) return '';
    try {
      return new Date(dStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const formatTime = (dStr) => {
    if (!dStr) return '';
    try {
      return new Date(dStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getTimeAgo = (dStr) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      const now = new Date();
      const diffMs = now - d;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
      return `${Math.floor(diffDays / 365)}y ago`;
    } catch {
      return '';
    }
  };

  const renderSummaryText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            style={{
              margin: '0.3rem 0 0.6rem 0',
              paddingLeft: '1.2rem',
              listStyle: 'disc',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              lineHeight: '1.65',
            }}
          >
            {listItems.map((item, i) => (
              <li key={i} style={{ marginBottom: '0.15rem' }}>
                {formatInline(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const formatInline = (str) => {
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) { flushList(); continue; }

      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h5 key={`h-${i}`} style={{
            fontSize: '0.85rem', fontWeight: 700, color: '#6366f1',
            marginTop: elements.length > 0 ? '0.8rem' : '0.2rem', marginBottom: '0.3rem',
          }}>
            {formatInline(line.slice(3))}
          </h5>
        );
        continue;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        listItems.push(line.slice(2));
        continue;
      }

      flushList();
      elements.push(
        <p key={`p-${i}`} style={{
          fontSize: '0.82rem', color: 'var(--text-secondary)',
          lineHeight: '1.65', marginBottom: '0.35rem',
        }}>
          {formatInline(line)}
        </p>
      );
    }
    flushList();
    return elements;
  };

  if (!patientId) return null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.85rem 1rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={16} color="#6366f1" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Patient Visit History
          </span>
          {patientName && (
            <span style={{
              fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-alt)',
              padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)',
            }}>
              {patientName}
            </span>
          )}
          {!isLoading && summaries.length > 0 && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, color: '#6366f1',
              background: 'rgba(99, 102, 241, 0.1)',
              padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)',
            }}>
              {summaries.length} visit{summaries.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={loadHistory}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '4px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center',
          }}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Content */}
      <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
        {isLoading && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Loader text="Loading history..." />
          </div>
        )}

        {error && !isLoading && (
          <div style={{
            padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: 'var(--status-rejected)', fontSize: '0.8rem',
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {!isLoading && !error && summaries.length === 0 && (
          <div style={{
            padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem',
          }}>
            <FileText size={20} style={{ marginBottom: '0.4rem', opacity: 0.4 }} />
            <p>No previous visit records found.</p>
          </div>
        )}

        {!isLoading && summaries.map((summary, idx) => {
          const isExpanded = expandedId === summary.id;

          return (
            <div
              key={summary.id}
              style={{
                borderBottom: idx < summaries.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : summary.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '0.75rem 1rem',
                  background: isExpanded ? 'rgba(99, 102, 241, 0.03)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left', gap: '0.5rem',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'var(--bg-alt)'; }}
                onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                    }}>
                      <Stethoscope size={13} color="var(--primary)" />
                      Dr. {summary.doctor_name || 'Doctor'}
                    </span>
                    {summary.doctor_specialization && (
                      <span style={{
                        fontSize: '0.68rem', color: 'var(--text-muted)',
                        fontWeight: 500,
                      }}>
                        • {summary.doctor_specialization}
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginTop: '0.2rem', flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontSize: '0.72rem', color: '#6366f1', fontWeight: 600,
                    }}>
                      {getTimeAgo(summary.meeting_date || summary.created_at)}
                    </span>
                    <span style={{
                      fontSize: '0.72rem', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', gap: '0.2rem',
                    }}>
                      <Calendar size={10} />
                      {formatDate(summary.meeting_date || summary.created_at)}
                    </span>
                  </div>
                </div>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: isExpanded ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-alt)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {isExpanded ? <ChevronUp size={14} color="#6366f1" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                </div>
              </button>

              {isExpanded && (
                <div style={{
                  padding: '0 1rem 1rem',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.75rem',
                  animation: 'fadeInDoc 0.15s ease-out',
                }}>
                  {summary.summary_text ? (
                    renderSummaryText(summary.summary_text)
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Summary is being generated...
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInDoc {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
