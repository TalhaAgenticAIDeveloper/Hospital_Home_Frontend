import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Toast } from '../common/Toast';
import { adminApi } from '../../api/admin';
import { Check, X, FileText, User, Award, FileCheck, AlertOctagon, Phone, Clock, GraduationCap, Eye, Download } from 'lucide-react';

export function DoctorReviewModal({ isOpen, onClose, doctorUserId, onReviewed }) {
  const [doctorDetail, setDoctorDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen && doctorUserId) {
      loadDoctorDetail();
      setRejectMode(false);
      setFeedback('');
      setToast(null);
    }
  }, [isOpen, doctorUserId]);

  const loadDoctorDetail = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getDoctorDetail(doctorUserId);
      setDoctorDetail(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load doctor details.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to APPROVE this doctor? Their account will become active immediately.')) {
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      await adminApi.reviewDoctor(doctorUserId, {
        action: 'approve',
        feedback: 'Approved by SaaS Administration.',
      });
      if (onReviewed) onReviewed();
      onClose();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to approve application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      setToast({
        type: 'error',
        message: 'Feedback reason is mandatory when rejecting. Please state why the application was not approved.',
      });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      await adminApi.reviewDoctor(doctorUserId, {
        action: 'reject',
        feedback: feedback.trim(),
      });
      if (onReviewed) onReviewed();
      onClose();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to reject application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Doctor Credential Application"
      maxWidth="750px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!rejectMode ? (
              <>
                {doctorDetail?.status !== 'active' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => setRejectMode(true)}
                      disabled={isSubmitting || isLoading}
                      icon={<X size={16} />}
                    >
                      Reject with Feedback
                    </Button>
                    <Button
                      variant="success"
                      onClick={handleApprove}
                      loading={isSubmitting}
                      disabled={isLoading}
                      icon={<Check size={16} />}
                    >
                      Approve Doctor
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setRejectMode(false)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  variant="danger"
                  onClick={handleReject}
                  loading={isSubmitting}
                  icon={<AlertOctagon size={16} />}
                >
                  Confirm Rejection & Send Feedback
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>Loading application details & documents...</p>
        </div>
      ) : doctorDetail ? (
        <div>
          {/* Header Summary */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.2rem' }}>
                {doctorDetail.full_name || 'Name not provided'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doctorDetail.email}</p>
            </div>
            <Badge status={doctorDetail.status} />
          </div>

          {/* Rejection Feedback Box if in Reject Mode */}
          {rejectMode && (
            <div className="feedback-card animate-fade-in" style={{ marginBottom: '1.25rem' }}>
              <div className="feedback-header">
                <AlertOctagon size={20} />
                <span>Enter Mandatory Rejection Reason / Feedback</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#881337', marginBottom: '0.5rem' }}>
                Specify clearly what is missing or invalid (e.g. illegible license copy, expired certificate, missing credentials). This feedback will be displayed directly to the doctor so they can correct it and re-submit.
              </p>
              <textarea
                rows="4"
                className="form-control"
                style={{ background: '#ffffff', borderColor: '#f43f5e' }}
                placeholder="e.g. The uploaded Medical License copy is blurry and expired. Please upload a certified renewal copy."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Professional Credentials Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Specialization</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {doctorDetail.specialization || 'N/A'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Medical License No.</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '2px' }}>
                {doctorDetail.license_number || 'N/A'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</span>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                {doctorDetail.phone_number || 'N/A'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Experience</span>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                {doctorDetail.years_of_experience ? `${doctorDetail.years_of_experience} Years` : 'N/A'}
              </p>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Qualifications</span>
              <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>
                {doctorDetail.qualification || 'N/A'}
              </p>
            </div>

            {doctorDetail.bio && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bio</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {doctorDetail.bio}
                </p>
              </div>
            )}
          </div>

          {/* Uploaded Verification Documents */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileCheck size={18} color="var(--primary)" />
              <span>Uploaded Documents ({doctorDetail.documents.length})</span>
            </h4>

            {doctorDetail.documents.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--status-rejected)', background: 'var(--status-rejected-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                Warning: No verification files uploaded by this applicant.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {doctorDetail.documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '220px', flex: 1 }}>
                      <FileText size={20} color="var(--primary)" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.original_filename}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {doc.document_type.replace('_', ' ').toUpperCase()} • {formatFileSize(doc.file_size)} • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <a
                        href={adminApi.getDocumentViewUrl(doc.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                        title="View document in browser"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </a>
                      <a
                        href={adminApi.getDocumentDownloadUrl(doc.id)}
                        download={doc.original_filename}
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                        title="Download document"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
