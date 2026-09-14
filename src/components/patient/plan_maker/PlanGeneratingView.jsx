import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../../common/Button';

const STEPS = [
  'Reviewing your verified goal and questionnaire answers...',
  'Grounding daily routine in preventive clinical guidelines...',
  'Cross-checking dietary rules and declared allergies...',
  'Validating schedule feasibility and time boundaries...',
  'Finalizing your structured daily wellness plan...',
];

export function PlanGeneratingView({
  onRetry,
  onBackToQuestions,
  error,
  isGenerating,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <div className="pm-card">
      <div className="pm-generating-box">
        {error ? (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={36} />
            </div>

            <h2 className="pm-generating-title" style={{ color: '#991b1b' }}>
              We Couldn't Generate Your Plan Right Now
            </h2>

            <div
              style={{
                maxWidth: 520,
                color: '#64748b',
                fontSize: '0.95rem',
                lineHeight: 1.5,
              }}
            >
              {error}
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem 1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  color: '#334155',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                🔒 <strong>No Data Lost</strong>: All your questionnaire responses remain safely saved in your account.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                size="md"
                onClick={onBackToQuestions}
                icon={<ArrowLeft size={16} />}
              >
                Review Answers
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={onRetry}
                disabled={isGenerating}
                icon={<RefreshCw size={16} />}
              >
                {isGenerating ? 'Retrying...' : 'Try Again'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="pm-spinner-ring" />

            <div>
              <h2 className="pm-generating-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Sparkles size={24} color="var(--primary)" />
                Formulating Your Personalized Wellness Plan
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                Applying evidence-based clinical rules and validating your daily schedule...
              </p>
            </div>

            <div className="pm-generating-steps">
              {STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;

                return (
                  <div
                    key={idx}
                    className={`pm-step-item ${isActive ? 'active' : ''}`}
                    style={{
                      opacity: idx > currentStepIndex ? 0.4 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    {isPassed ? (
                      <CheckCircle2 size={18} color="#10b981" />
                    ) : (
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: isActive ? '4px solid var(--primary)' : '2px solid #cbd5e1',
                        }}
                      />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
