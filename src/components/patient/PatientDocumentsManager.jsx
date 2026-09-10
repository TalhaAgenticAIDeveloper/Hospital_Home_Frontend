import React, { useState, useEffect, useRef, useCallback } from 'react';
import { patientDocumentsApi } from '../../api/patientDocuments';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { Loader } from '../common/Loader';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  File,
  Image,
  HardDrive,
  Tag,
  Eye,
} from 'lucide-react';
import { DocumentViewerModal } from '../common/DocumentViewerModal';

const MAX_DOCS = 5;
const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = '.pdf, .jpg, .jpeg, .png';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return <Image size={20} />;
  if (mimeType === 'application/pdf') return <FileText size={20} />;
  return <File size={20} />;
}

export function PatientDocumentsManager() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [label, setLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // In-browser preview modal
  const [viewerDoc, setViewerDoc] = useState(null);
  const [viewerBlobUrl, setViewerBlobUrl] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState(null);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleViewDoc = async (doc) => {
    setViewerDoc(doc);
    setViewerLoading(true);
    setViewerError(null);
    setViewerBlobUrl(null);
    try {
      const url = await patientDocumentsApi.getDocumentBlobUrl(doc.id);
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

  // ── Load Documents ──────────────────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientDocumentsApi.listDocuments();
      setDocuments(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load documents.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // ── File Validation ─────────────────────────────────────────────────────
  const validateFile = (file) => {
    if (!file) return 'No file selected.';
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type "${file.type || 'unknown'}" is not allowed. Only PDF, JPEG, and PNG files are accepted.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File size (${formatFileSize(file.size)}) exceeds the ${MAX_SIZE_MB} MB limit.`;
    }
    if (file.size === 0) {
      return 'File is empty. Please select a valid file.';
    }
    return null;
  };

  // ── File Selection ──────────────────────────────────────────────────────
  const handleFileSelect = (file) => {
    const error = validateFile(file);
    if (error) {
      setToast({ type: 'error', message: error });
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;
    if (documents.length >= MAX_DOCS) {
      setToast({
        type: 'error',
        message: `Maximum ${MAX_DOCS} documents allowed. Please delete an existing document first.`,
      });
      return;
    }

    setIsUploading(true);
    try {
      await patientDocumentsApi.uploadDocument(selectedFile, label);
      setToast({ type: 'success', message: 'Document uploaded successfully!' });
      setSelectedFile(null);
      setLabel('');
      await loadDocuments();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to upload document.' });
    } finally {
      setIsUploading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (docId) => {
    setIsDeleting(true);
    try {
      await patientDocumentsApi.deleteDocument(docId);
      setToast({ type: 'success', message: 'Document deleted successfully.' });
      setDeleteConfirmId(null);
      await loadDocuments();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete document.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Download ────────────────────────────────────────────────────────────
  const handleDownload = async (doc) => {
    try {
      await patientDocumentsApi.downloadDocument(doc.id, doc.original_filename);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to download document.' });
    }
  };

  const canUpload = documents.length < MAX_DOCS;
  const remainingSlots = MAX_DOCS - documents.length;

  return (
    <div className="patient-documents-manager">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
              <HardDrive size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Medical Documents</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Upload your medical history documents for sharing with doctors
              </p>
            </div>
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: canUpload ? '#ecfdf5' : '#fef2f2',
              color: canUpload ? '#059669' : '#dc2626',
              border: `1px solid ${canUpload ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {documents.length} / {MAX_DOCS} Documents
          </div>
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>
            Accepted formats: <strong>PDF, JPEG, PNG</strong>. Maximum file size: <strong>{MAX_SIZE_MB} MB</strong>.
            You can upload up to <strong>{MAX_DOCS}</strong> documents. These will be available for sharing during appointment booking.
          </span>
        </div>
      </div>

      {/* Upload Section */}
      {canUpload && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }} className="heading-gradient-dark">
            <Upload size={18} color="var(--primary)" />
            Upload New Document
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining)
            </span>
          </h4>

          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            role="button"
            tabIndex={0}
            aria-label="Drag and drop a file here, or click to browse"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            style={{
              border: `2px dashed ${isDragOver ? 'var(--primary)' : selectedFile ? '#a7f3d0' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isDragOver
                ? 'rgba(13, 148, 136, 0.04)'
                : selectedFile
                ? '#f0fdf4'
                : 'var(--bg-alt)',
              marginBottom: '1rem',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleInputChange}
              style={{ display: 'none' }}
              aria-hidden="true"
            />

            {selectedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem', background: '#dcfce7', borderRadius: '50%', color: '#16a34a' }}>
                  <CheckCircle2 size={28} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {formatFileSize(selectedFile.size)} • Click to change file
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.6rem', background: isDragOver ? 'var(--primary-light)' : '#e2e8f0', borderRadius: '50%', color: isDragOver ? 'var(--primary)' : 'var(--text-muted)' }}>
                  <Upload size={26} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {isDragOver ? 'Drop your file here' : 'Drag & drop a file here, or click to browse'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  PDF, JPEG, PNG • Max {MAX_SIZE_MB} MB
                </div>
              </div>
            )}
          </div>

          {/* Label Input */}
          {selectedFile && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="document-label"
                style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}
              >
                <Tag size={14} color="var(--primary)" />
                Document Label <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
              </label>
              <input
                id="document-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Blood Test Report Aug 2026, X-Ray Left Knee..."
                maxLength={255}
                className="form-control"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          )}

          {/* Upload Button */}
          {selectedFile && (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setLabel('');
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpload}
                isLoading={isUploading}
                icon={<Upload size={16} />}
              >
                Upload Document
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Documents List */}
      <div className="card">
        <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }} className="heading-gradient-dark">
          <FileText size={18} color="var(--primary)" />
          Your Uploaded Documents
        </h4>

        {isLoading ? (
          <Loader text="Loading your medical documents..." />
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No documents uploaded yet</p>
            <p style={{ fontSize: '0.85rem' }}>
              Upload your medical history documents above. They'll be available for selection when booking appointments.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-alt)',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* File Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      padding: '0.5rem',
                      background: doc.mime_type === 'application/pdf' ? '#fef3c7' : '#dbeafe',
                      color: doc.mime_type === 'application/pdf' ? '#d97706' : '#2563eb',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                    }}
                  >
                    {getFileIcon(doc.mime_type)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {doc.label && (
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {doc.label}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: doc.label ? '0.8rem' : '0.9rem',
                        fontWeight: doc.label ? 400 : 600,
                        color: doc.label ? 'var(--text-muted)' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={doc.original_filename}
                    >
                      {doc.original_filename}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatFileSize(doc.file_size)} • {doc.mime_type?.split('/')[1]?.toUpperCase()} • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleViewDoc(doc)}
                    className="btn-action-view"
                    title="View document in browser"
                    aria-label={`View ${doc.label || doc.original_filename}`}
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="btn-action-download"
                    title="Download document"
                    aria-label={`Download ${doc.label || doc.original_filename}`}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(doc.id)}
                    className="btn-action-delete"
                    title="Delete document"
                    aria-label={`Delete ${doc.label || doc.original_filename}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm document deletion"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '420px', padding: '1.75rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: '#fee2e2', color: '#dc2626', borderRadius: '50%' }}>
                <AlertCircle size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Delete Document?</h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              This will permanently delete this document from your account.
              If this document is attached to any appointments, the doctor will no longer be able to access it.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Trash2 size={15} />
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Browser Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDoc)}
        onClose={handleCloseViewer}
        document={viewerDoc}
        blobUrl={viewerBlobUrl}
        isLoading={viewerLoading}
        error={viewerError}
        onDownload={viewerDoc ? () => handleDownload(viewerDoc) : undefined}
      />
    </div>
  );
}
