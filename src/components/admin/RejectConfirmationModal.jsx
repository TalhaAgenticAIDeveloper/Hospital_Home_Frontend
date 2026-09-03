import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertOctagon, X, MessageSquare } from 'lucide-react';

export function RejectConfirmationModal({ isOpen, onClose, onConfirm, doctorName, isSubmitting = false }) {
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const trimmed = feedback.trim();
    if (!trimmed) {
      setError('Feedback is mandatory when rejecting an application. Please provide a reason.');
      return;
    }
    if (trimmed.length < 10) {
      setError('Please provide a more detailed explanation (at least 10 characters).');
      return;
    }
    setError('');
    onConfirm(trimmed);
  };

  const handleCancel = () => {
    // Cancel = close modal, doctor stays pending, no status change
    setFeedback('');
    setError('');
    onClose();
  };

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFeedback('');
      setError('');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Confirm Application Rejection"
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            loading={isSubmitting}
            icon={<AlertOctagon size={16} />}
          >
            Confirm Rejection & Send Feedback
          </Button>
        </div>
      }
    >
      {/* Warning Banner */}
      <div style={{
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderLeft: '4px solid #f97316',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
      }}>
        <AlertOctagon size={22} color="#ea580c" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#9a3412', marginBottom: '0.25rem' }}>
            You are about to reject this application
          </div>
          <p style={{ fontSize: '0.85rem', color: '#c2410c', margin: 0 }}>
            {doctorName ? (
              <>Rejecting <strong>{doctorName}</strong>'s application will notify the doctor with your feedback. They can review the feedback and resubmit their application with updated details.</>
            ) : (
              <>This will reject the doctor's application and send them your feedback. They will be able to resubmit after making corrections.</>
            )}
          </p>
        </div>
      </div>

      {/* Feedback Textarea */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}>
          <MessageSquare size={16} color="var(--status-rejected)" />
          Rejection Reason / Feedback
          <span style={{ color: 'var(--status-rejected)', fontSize: '0.85rem' }}>*</span>
        </label>
        <textarea
          rows="4"
          className={`form-control ${error ? 'error' : ''}`}
          style={{ borderColor: error ? 'var(--status-rejected)' : undefined }}
          placeholder="Explain clearly what is missing or invalid. E.g.: The uploaded Medical License is blurry and expired. Please upload a certified renewal copy along with a valid government ID."
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value);
            if (error) setError('');
          }}
          autoFocus
          disabled={isSubmitting}
        />
        {error && (
          <div className="form-error" style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <X size={13} />
            {error}
          </div>
        )}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          This feedback will be displayed directly to the doctor so they can understand what needs to be corrected.
        </p>
      </div>
    </Modal>
  );
}
