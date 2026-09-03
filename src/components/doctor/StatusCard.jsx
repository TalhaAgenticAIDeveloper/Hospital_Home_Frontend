import React, { useState } from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { doctorApi } from '../../api/doctor';
import { Send, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export function StatusCard({ status, submittedAt, reviewedAt, onSubmitted }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setToast(null);

    try {
      const res = await doctorApi.submitApplication();
      setToast({ type: 'success', message: res.message || 'Application submitted for review!' });
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to submit application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUnderReview = status === 'pending' && submittedAt;
  const isDraft = status === 'pending' && !submittedAt;
  const isRejected = status === 'rejected';
  const isActive = status === 'active';

  return (
    <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderLeft: '5px solid var(--primary)' }}>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <h3 style={{ margin: 0 }}>Application Status</h3>
            <Badge status={status} />
          </div>

          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            {isActive && 'Your medical profile has been verified and approved by the SaaS Administrator.'}
            {isUnderReview && `Submitted on ${new Date(submittedAt).toLocaleString()}. Our administration team is reviewing your documents.`}
            {isDraft && 'Please complete all profile details and upload at least one verification document before submitting.'}
            {isRejected && 'Your application requires revisions. Please review the admin feedback above, make changes, and re-submit.'}
          </p>
        </div>

        <div>
          {isDraft && (
            <Button
              variant="primary"
              onClick={handleSubmitApplication}
              loading={isSubmitting}
              icon={<Send size={16} />}
            >
              Submit Application
            </Button>
          )}

          {isRejected && (
            <Button
              variant="danger"
              onClick={handleSubmitApplication}
              loading={isSubmitting}
              icon={<Send size={16} />}
            >
              Re-Submit Application
            </Button>
          )}

          {isUnderReview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-pending-text)', fontWeight: 600, fontSize: '0.9rem', background: 'var(--status-pending-bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
              <Clock size={16} />
              <span>Under Administrative Review</span>
            </div>
          )}

          {isActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-active-text)', fontWeight: 600, fontSize: '0.9rem', background: 'var(--status-active-bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
              <ShieldCheck size={18} />
              <span>Verified Medical Provider</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
