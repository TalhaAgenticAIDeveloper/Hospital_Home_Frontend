import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Toast } from '../common/Toast';
import { adminApi } from '../../api/admin';
import { Check, X, ShieldCheck, AlertOctagon, ExternalLink, User, Users } from 'lucide-react';

export function DoctorReviewModal({ isOpen, onClose, doctorUserId, onReviewed }) {
  const [doctorDetail, setDoctorDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    if (isOpen && doctorUserId) {
      loadDoctorDetail();
      setRejectMode(false);
      setFeedback('');
      setToast(null);
    }
  }, [isOpen, doctorUserId]);

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
          <p>Loading application details...</p>
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
                Specify clearly what is missing or invalid (e.g. invalid PMDC registration number, name mismatch with PMDC registry). This feedback will be displayed directly to the doctor so they can correct it and re-submit.
              </p>
              <textarea
                rows="4"
                className="form-control"
                style={{ background: '#ffffff', borderColor: '#f43f5e' }}
                placeholder="e.g. The PMDC registration number provided does not match official PMDC registry records or invalid Father's name. Please update your details and re-submit."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Professional Credentials Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Doctor Full Name</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {doctorDetail.full_name || 'N/A'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Father's Name</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {doctorDetail.father_name || 'N/A'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>PMDC Reg. Number</span>
              <p style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace', marginTop: '2px' }}>
                {doctorDetail.pmdc_registration_number || doctorDetail.license_number || 'N/A'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Specialization</span>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {doctorDetail.specialization || 'N/A'}
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

          {/* PMDC Regulatory Verification Card */}
          <div style={{ background: 'var(--bg-alt)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                <h4 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700 }}>
                  PMDC Regulatory Verification
                </h4>
              </div>
              <a
                href="https://www.pmdc.pk"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', fontSize: '0.78rem' }}
              >
                <ExternalLink size={13} />
                <span>Verify on PMDC Portal</span>
              </a>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #10b981' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#065f46' }}>
                <strong>No document upload required:</strong> Verify this applicant against PMDC records using their <strong>PMDC Registration No. ({doctorDetail.pmdc_registration_number || doctorDetail.license_number})</strong>, <strong>Full Name ({doctorDetail.full_name})</strong>, and <strong>Father's Name ({doctorDetail.father_name || 'N/A'})</strong>.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
