import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Loader } from './Loader';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  blobUrl,
  isLoading,
  error,
  onDownload,
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Reset zoom/rotation when a new document is opened
    setZoom(1);
    setRotation(0);
    setIsFullscreen(false);
  }, [document?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const isPdf = document.mime_type === 'application/pdf';
  const isImage = document.mime_type?.startsWith('image/');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isFullscreen ? '0' : '1.5rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: isFullscreen ? '0' : 'var(--radius-lg, 12px)',
          width: isFullscreen ? '100vw' : '92vw',
          maxWidth: isFullscreen ? '100vw' : '1100px',
          height: isFullscreen ? '100vh' : '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div
              style={{
                padding: '0.5rem',
                borderRadius: '8px',
                background: isPdf ? '#fef3c7' : '#e0e7ff',
                color: isPdf ? '#d97706' : '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                id="doc-viewer-title"
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #0f172a)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {document.label || document.original_filename}
              </h3>
              {document.label && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted, #64748b)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {document.original_filename}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                  style={{
                    padding: '0.4rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ZoomOut size={16} />
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '42px', textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  aria-label="Zoom In"
                  style={{
                    padding: '0.4rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Rotate Clockwise"
                  aria-label="Rotate Clockwise"
                  style={{
                    padding: '0.4rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <RotateCw size={16} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              style={{
                padding: '0.4rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {onDownload && (
              <Button
                variant="outline"
                onClick={onDownload}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Download size={15} />
                <span>Download</span>
              </Button>
            )}

            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new window"
                style={{
                  padding: '0.4rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={16} />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              title="Close viewer"
              aria-label="Close viewer"
              style={{
                padding: '0.4rem',
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '0.25rem',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            background: isPdf ? '#525659' : '#0f172a',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {isLoading ? (
            <div style={{ color: '#ffffff', textAlign: 'center', padding: '2rem' }}>
              <Loader text="Loading document preview..." />
            </div>
          ) : error ? (
            <div
              style={{
                background: '#ffffff',
                padding: '2rem',
                borderRadius: '12px',
                maxWidth: '420px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Unable to preview document</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</p>
              {onDownload && (
                <Button variant="primary" onClick={onDownload}>
                  Download file instead
                </Button>
              )}
            </div>
          ) : !blobUrl ? (
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No document data available.</div>
          ) : isPdf ? (
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title="PDF Document Viewer"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#ffffff',
              }}
            />
          ) : isImage ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
            >
              <img
                src={blobUrl}
                alt={document.label || document.original_filename}
                style={{
                  maxWidth: zoom === 1 ? '100%' : 'none',
                  maxHeight: zoom === 1 ? '100%' : 'none',
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  borderRadius: '4px',
                  objectFit: 'contain',
                }}
              />
            </div>
          ) : (
            <div style={{ color: '#ffffff', textAlign: 'center', padding: '2rem' }}>
              <p>Preview is not available for this file type.</p>
              {onDownload && (
                <Button variant="primary" onClick={onDownload}>
                  Download Document
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
