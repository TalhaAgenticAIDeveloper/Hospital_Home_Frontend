import React, { useState, useRef } from 'react';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { doctorApi } from '../../api/doctor';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';

export function DocumentUploader({ documents = [], onDocumentsChanged, disabled = false }) {
  const [docType, setDocType] = useState('medical_license');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: 'medical_license', label: 'Medical Practice License' },
    { value: 'degree_certificate', label: 'Medical Degree / Certificate' },
    { value: 'id_proof', label: 'Government ID / Passport Proof' },
    { value: 'profile_photo', label: 'Professional Profile Photo' },
    { value: 'other', label: 'Other Supporting Document' },
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', message: 'File exceeds maximum allowed size of 10MB.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check type
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setToast({ type: 'error', message: 'Only PDF, JPEG, and PNG files are accepted.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setToast(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setToast({ type: 'warning', message: 'Please select a file to upload.' });
      return;
    }

    setIsUploading(true);
    setToast(null);

    try {
      await doctorApi.uploadDocument(selectedFile, docType);
      setToast({ type: 'success', message: `Uploaded "${selectedFile.name}" successfully!` });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onDocumentsChanged) onDocumentsChanged();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to upload document.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    setDeletingId(docId);
    try {
      await doctorApi.deleteDocument(docId);
      setToast({ type: 'info', message: 'Document removed.' });
      if (onDocumentsChanged) onDocumentsChanged();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete document.' });
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDocTypeLabel = (val) => {
    const item = documentTypes.find((d) => d.value === val);
    return item ? item.label : val;
  };

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3>Verification Documents</h3>
        <p style={{ fontSize: '0.85rem' }}>
          Upload certified copies of your medical license, degree certificates, and identity verification documents.
        </p>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {!disabled && (
        <form onSubmit={handleUpload} style={{ background: 'var(--bg-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px dashed var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Document Category</label>
              <select
                className="form-control"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                {documentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Choose File (PDF, PNG, JPG &lt; 10MB)</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                className="form-control"
                style={{ padding: '0.45rem' }}
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                loading={isUploading}
                disabled={!selectedFile}
                icon={<Upload size={16} />}
                block
              >
                Upload File
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Uploaded Documents List */}
      <div>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCheck size={18} color="var(--primary)" />
          <span>Uploaded Files ({documents.length})</span>
        </h4>

        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
            <FileText size={36} strokeWidth={1.5} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>No verification documents uploaded yet.</p>
            <p style={{ fontSize: '0.8rem' }}>At least 1 document (such as your Medical License) is required for submission.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Original Filename</th>
                  <th>Size</th>
                  <th>Upload Date</th>
                  {!disabled && <th style={{ textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="badge badge-role" style={{ fontSize: '0.75rem' }}>
                        {getDocTypeLabel(doc.document_type)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                        <FileText size={16} color="var(--text-secondary)" />
                        <span>{doc.original_filename}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    {!disabled && (
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(doc.id, doc.original_filename)}
                          loading={deletingId === doc.id}
                          icon={<Trash2 size={14} />}
                        >
                          Delete
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
