import React from 'react';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import {
  X,
  Sparkles,
  RefreshCw,
  Eye,
  Download,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export function DocumentSummaryModal({
  isOpen,
  onClose,
  document,
  summaryData,
  isLoading,
  error,
  onRegenerate,
  onViewDocument,
  onDownload,
}) {
  if (!isOpen || !document) return null;

  const isUnclear = summaryData?.status === 'unclear';
  const isCached = summaryData?.is_cached;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg, 12px)',
          width: '92vw',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div
              style={{
                padding: '0.6rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3
                  id="summary-modal-title"
                  style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  AI Clinical Summary
                </h3>
                {isCached && !isLoading && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: '#e0e7ff',
                      color: '#4338ca',
                    }}
                  >
                    Saved Summary
                  </span>
                )}
                {isUnclear && !isLoading && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: '#fef3c7',
                      color: '#b45309',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <AlertTriangle size={12} /> Low Legibility
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: '#64748b',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {document.label ? `${document.label} (${document.original_filename})` : document.original_filename}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              padding: '0.4rem',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            lineHeight: 1.6,
            color: '#1e293b',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <Loader text="Analyzing document with Groq LLM & extracting clinical findings..." />
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1rem' }}>
                Extracting text, inspecting lab values, and identifying medications...
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <AlertTriangle size={18} />
                Failed to Generate AI Summary
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>{error}</p>
              <div style={{ marginTop: '1rem' }}>
                <Button variant="outline" onClick={onRegenerate}>
                  Retry Summarization
                </Button>
              </div>
            </div>
          ) : isUnclear ? (
            <div>
              {/* Amber notice for blurry/unclear docs */}
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <div style={{ color: '#d97706', marginTop: '2px' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#92400e', fontSize: '0.95rem', fontWeight: 700 }}>
                    Document Image / Text Is Unclear
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f' }}>
                    The AI was unable to reliably extract all medical metrics because the document appears blurry, low-resolution, or cropped. Please inspect the original file directly.
                  </p>
                </div>
              </div>

              {/* Summary Text Content */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  fontSize: '0.92rem',
                  whiteSpace: 'pre-line',
                }}
              >
                {summaryData?.summary}
              </div>
            </div>
          ) : (
            <div>
              {/* AI Disclaimer Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  marginBottom: '1rem',
                }}
              >
                <ShieldCheck size={14} color="#059669" />
                Clinical AI Assistant (Review original documents for diagnostic decisions)
              </div>

              {/* Formatted Summary Content */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem 1.5rem',
                  fontSize: '0.92rem',
                  whiteSpace: 'pre-line',
                }}
              >
                {summaryData?.summary}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            flexWrap: 'wrap',
            gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onViewDocument && (
              <Button
                variant="outline"
                onClick={onViewDocument}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Eye size={15} />
                <span>View Original File</span>
              </Button>
            )}

            {onDownload && (
              <Button
                variant="outline"
                onClick={onDownload}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <Download size={15} />
                <span>Download</span>
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onRegenerate && (
              <Button
                variant="outline"
                onClick={onRegenerate}
                disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                <span>Regenerate AI</span>
              </Button>
            )}

            <Button variant="primary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
