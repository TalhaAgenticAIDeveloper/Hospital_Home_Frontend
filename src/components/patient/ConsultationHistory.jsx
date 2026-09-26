import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Calendar,
  Clock,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  RefreshCw,
  History,
  User,
} from 'lucide-react';
import { consultationSummaryApi } from '../../api/consultationSummary';
import { Loader } from '../common/Loader';
import { Button } from '../common/Button';

export function ConsultationHistory() {
  const [summaries, setSummaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadHistory();
  }, [offset]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await consultationSummaryApi.getMyHistory(limit, offset);
      setSummaries(data.summaries || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to load consultation history.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dStr) => {
    if (!dStr) return '';
    try {
      return new Date(dStr).toLocaleDateString('en-US', {
        weekday: 'short',
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
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
      return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
    } catch {
      return '';
    }
  };

  /**
   * Render markdown-like summary text with basic formatting:
   * ## headings, **bold**, - bullet points
   */
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
              margin: '0.4rem 0 0.8rem 0',
              paddingLeft: '1.4rem',
              listStyle: 'disc',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: '1.7',
            }}
          >
            {listItems.map((item, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>
                {formatInlineText(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const formatInlineText = (str) => {
      // Handle **bold** text
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        flushList();
        continue;
      }

      // ## Heading
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h4
            key={`h-${i}`}
            style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--primary)',
              marginTop: elements.length > 0 ? '1.1rem' : '0.3rem',
              marginBottom: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span
              style={{
                width: '4px',
                height: '16px',
                borderRadius: '2px',
                background: 'var(--primary)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {formatInlineText(line.slice(3))}
          </h4>
        );
        continue;
      }

      // ### Sub-heading
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h5
            key={`h3-${i}`}
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '0.8rem',
              marginBottom: '0.3rem',
            }}
          >
            {formatInlineText(line.slice(4))}
          </h5>
        );
        continue;
      }

      // Bullet points (- or *)
      if (line.startsWith('- ') || line.startsWith('* ')) {
        listItems.push(line.slice(2));
        continue;
      }

      // Numbered list (1. 2. etc.)
      const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        listItems.push(line);
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            marginBottom: '0.5rem',
          }}
        >
          {formatInlineText(line)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="consultation-history">
      {/* ── Header Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
          borderRadius: '14px',
          padding: '1.5rem',
          color: '#ffffff',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History size={26} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              My Visit History
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              {total > 0
                ? `${total} consultation${total > 1 ? 's' : ''} on record`
                : 'Your consultation summaries will appear here'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={15} />}
          onClick={loadHistory}
          style={{
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          Refresh
        </Button>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <Loader text="Loading your consultation history..." />
        </div>
      )}

      {/* ── Error ── */}
      {error && !isLoading && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-rejected-bg)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <AlertCircle size={18} color="var(--status-rejected)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--status-rejected-text)' }}>
            {error}
          </span>
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !error && summaries.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <ClipboardList size={32} color="#6366f1" />
          </div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No Consultations Yet
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto' }}>
            After your first doctor consultation, a detailed summary will automatically appear here for your reference.
          </p>
        </div>
      )}

      {/* ── Timeline ── */}
      {!isLoading && summaries.length > 0 && (
        <div style={{ position: 'relative' }}>
          {/* Vertical timeline line */}
          <div
            style={{
              position: 'absolute',
              left: '22px',
              top: '16px',
              bottom: '16px',
              width: '2px',
              background: 'linear-gradient(to bottom, var(--primary-border) 0%, rgba(99, 102, 241, 0.15) 100%)',
              borderRadius: '1px',
            }}
          />

          {summaries.map((summary, index) => {
            const isExpanded = expandedId === summary.id;

            return (
              <div
                key={summary.id}
                style={{
                  position: 'relative',
                  paddingLeft: '52px',
                  marginBottom: index < summaries.length - 1 ? '1rem' : '0',
                }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '20px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isExpanded
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : 'var(--bg-card)',
                    border: `2px solid ${isExpanded ? '#6366f1' : 'var(--primary-border)'}`,
                    zIndex: 2,
                    transition: 'all var(--transition-normal)',
                    boxShadow: isExpanded ? '0 0 0 4px rgba(99, 102, 241, 0.15)' : 'none',
                  }}
                />

                {/* Card */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isExpanded ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`,
                    overflow: 'hidden',
                    transition: 'all var(--transition-normal)',
                    boxShadow: isExpanded
                      ? '0 8px 25px -5px rgba(99, 102, 241, 0.15), 0 4px 6px -4px rgba(0, 0, 0, 0.05)'
                      : 'var(--shadow-sm)',
                  }}
                >
                  {/* Card Header — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : summary.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: '1rem',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-alt)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.35rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#6366f1',
                            background: 'rgba(99, 102, 241, 0.08)',
                            padding: '0.15rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getTimeAgo(summary.meeting_date || summary.created_at)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Calendar size={12} />
                          {formatDate(summary.meeting_date || summary.created_at)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Clock size={12} />
                          {formatTime(summary.meeting_date || summary.created_at)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Stethoscope size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Dr. {summary.doctor_name || 'Doctor'}
                        </span>
                        {summary.doctor_specialization && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              background: 'var(--bg-alt)',
                              padding: '0.1rem 0.45rem',
                              borderRadius: 'var(--radius-full)',
                              fontWeight: 500,
                            }}
                          >
                            {summary.doctor_specialization}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isExpanded ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-alt)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp size={18} color="#6366f1" />
                      ) : (
                        <ChevronDown size={18} color="var(--text-muted)" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div
                      style={{
                        borderTop: '1px solid var(--border-color)',
                        padding: '1.25rem',
                        animation: 'fadeIn 0.2s ease-out',
                      }}
                    >
                      {summary.summary_text ? (
                        <div className="consultation-summary-content">
                          {renderSummaryText(summary.summary_text)}
                        </div>
                      ) : (
                        <div
                          style={{
                            textAlign: 'center',
                            padding: '2rem',
                            color: 'var(--text-muted)',
                            fontSize: '0.875rem',
                          }}
                        >
                          <FileText size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                          <p>Summary is being generated...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {!isLoading && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Inline animation keyframe */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
