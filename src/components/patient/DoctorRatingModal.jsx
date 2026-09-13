import React, { useState } from 'react';
import { Star, X, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { ratingApi } from '../../api/rating';
import { Button } from '../common/Button';

const RATING_LABELS = {
  1: 'Poor — Dissatisfied with consultation',
  2: 'Fair — Acceptable but needs improvement',
  3: 'Good — Satisfactory consultation',
  4: 'Very Good — Attentive & helpful doctor',
  5: 'Excellent — Outstanding medical care & advice!',
};

export function DoctorRatingModal({ meetingId, doctorName, isOpen, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating (1 to 5 stars).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await ratingApi.submitRating(meetingId, {
        rating,
        feedback_text: feedbackText.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStarCount = hoverRating || rating;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: 700 }}>
              Rate Your Consultation
            </h3>
            {doctorName && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                with Dr. {doctorName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {submitted ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle size={36} />
            </div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#1e293b' }}>
              Thank You for Your Feedback!
            </h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Your rating helps improve quality of care for everyone on MedTrust.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Star Selection */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#475569', fontWeight: 600 }}>
                How would you rate the consultation?
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeStarCount;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        transition: 'transform 0.15s ease',
                        transform: (hoverRating === starVal || rating === starVal) ? 'scale(1.2)' : 'scale(1)',
                      }}
                    >
                      <Star
                        size={36}
                        fill={isFilled ? '#eab308' : 'none'}
                        color={isFilled ? '#eab308' : '#cbd5e1'}
                        strokeWidth={1.5}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Label based on star count */}
              <div
                style={{
                  minHeight: '1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: activeStarCount > 0 ? '#4f46e5' : '#94a3b8',
                  transition: 'color 0.2s ease',
                }}
              >
                {activeStarCount > 0 ? RATING_LABELS[activeStarCount] : 'Select 1 to 5 stars'}
              </div>
            </div>

            {/* Optional Feedback textarea */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.5rem',
                }}
              >
                <MessageSquare size={15} color="#6366f1" />
                <span>Written Feedback (Optional)</span>
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience regarding doctor's punctuality, guidance, diagnosis..."
                rows={3}
                maxLength={2000}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                {feedbackText.length}/2000
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={rating === 0 || isSubmitting}
              >
                Submit Feedback
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
