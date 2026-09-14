import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  SkipForward,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../common/Button';

export function PlanQuestionnaire({
  goal,
  onAnswerSubmitted,
  onReadyToGenerate,
  onResetGoal,
}) {
  const questions = goal?.questions || [];

  // Find first unanswered required question index or default to 0
  const findInitialIndex = () => {
    const firstUnanswered = questions.findIndex(
      (q) => !q.current_answer || (q.current_answer.validation_status !== 'valid' && !q.current_answer.is_skipped)
    );
    return firstUnanswered !== -1 ? firstUnanswered : 0;
  };

  const [currentIndex, setCurrentIndex] = useState(findInitialIndex);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState(null);

  const currentQ = questions[currentIndex] || null;

  // Sync current question input when index changes
  useEffect(() => {
    if (currentQ) {
      if (currentQ.current_answer?.raw_input) {
        setInputValue(currentQ.current_answer.raw_input);
      } else {
        setInputValue('');
      }
      if (currentQ.current_answer?.clarification_message) {
        setValidationFeedback({
          status: currentQ.current_answer.validation_status,
          message: currentQ.current_answer.clarification_message,
        });
      } else {
        setValidationFeedback(null);
      }
    }
  }, [currentIndex, currentQ]);

  // Calculate completion percentage
  const answeredCount = questions.filter(
    (q) => q.current_answer && (q.current_answer.validation_status === 'valid' || q.current_answer.is_skipped)
  ).length;
  const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100);
  const isAllAnswered = answeredCount === questions.length;

  const handleAnswerSubmit = async (skipped = false) => {
    if (!currentQ) return;
    if (!skipped && !inputValue.trim()) {
      setValidationFeedback({
        status: 'invalid',
        message: 'Please provide an answer, or click "Skip Question" if you are unsure.',
      });
      return;
    }

    setIsSubmitting(true);
    setValidationFeedback(null);

    try {
      const resp = await onAnswerSubmitted(goal.id, {
        question_id: currentQ.id,
        raw_input: skipped ? 'skip' : inputValue.trim(),
        is_skipped: skipped,
      });

      if (resp?.can_proceed) {
        // Move to next question if available
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (resp?.clarification_message) {
        setValidationFeedback({
          status: resp.validation_status,
          message: resp.clarification_message,
        });
      }
    } catch (err) {
      setValidationFeedback({
        status: 'invalid',
        message: err?.message || 'Could not save answer. Please check your connection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionSelect = (opt) => {
    setInputValue(opt);
  };

  return (
    <div className="pm-card">
      {/* Header & Goal Title */}
      <div className="pm-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="pm-status-badge pm-status-ready">Questionnaire In Progress</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Timezone: {goal?.timezone || 'UTC'}
            </span>
          </div>
          <h2 className="pm-card-title">{goal?.title}</h2>
          <p className="pm-card-subtitle">{goal?.target_description}</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onResetGoal}
          icon={<RefreshCw size={14} />}
        >
          Change Goal
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="pm-progress-wrap">
        <div className="pm-progress-header">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{progressPercent}% Complete ({answeredCount}/{questions.length} answered)</span>
        </div>
        <div className="pm-progress-bar-bg">
          <div className="pm-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Question Box */}
      {currentQ && (
        <div className="pm-question-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="pm-q-number">
              Question {currentIndex + 1} • {currentQ.is_required ? 'Required' : 'Optional'}
            </span>
            {currentQ.retry_count > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--status-pending)', fontWeight: 600 }}>
                Attempt {currentQ.retry_count + 1} of 3
              </span>
            )}
          </div>

          <h3 className="pm-q-text">{currentQ.question_text}</h3>
          {currentQ.help_text && (
            <div className="pm-q-help" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <HelpCircle size={14} color="var(--primary)" />
              <span>{currentQ.help_text}</span>
            </div>
          )}

          {/* Validation Feedback Banner */}
          {validationFeedback && (
            <div
              className={`pm-validation-hint ${
                validationFeedback.status === 'clarification_needed'
                  ? 'pm-hint-warning'
                  : 'pm-hint-error'
              }`}
            >
              <AlertCircle size={16} />
              <span>{validationFeedback.message}</span>
            </div>
          )}

          {/* Input Variant: Select Options */}
          {currentQ.question_type === 'select' && currentQ.options && (
            <div className="pm-options-list">
              {Array.isArray(currentQ.options) ? (
                currentQ.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`pm-option-item ${inputValue === opt ? 'selected' : ''}`}
                    onClick={() => handleOptionSelect(opt)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: inputValue === opt ? '5px solid var(--primary)' : '2px solid #cbd5e1',
                        flexShrink: 0,
                      }}
                    />
                    <span>{opt}</span>
                  </div>
                ))
              ) : null}
            </div>
          )}

          {/* Input Variant: Number with optional unit */}
          {currentQ.question_type === 'number' && (
            <div className="pm-input-with-unit">
              <input
                type="text"
                className="pm-input-field"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentQ.help_text || `Enter value (e.g. 70 ${currentQ.unit || ''})`}
                disabled={isSubmitting}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAnswerSubmit(false);
                  }
                }}
              />
              {currentQ.unit && <div className="pm-unit-pill">{currentQ.unit}</div>}
            </div>
          )}

          {/* Input Variant: Time or Text */}
          {currentQ.question_type !== 'select' && currentQ.question_type !== 'number' && (
            <div>
              <input
                type="text"
                className="pm-input-field"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentQ.help_text || 'Enter your response in your own words...'}
                disabled={isSubmitting}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAnswerSubmit(false);
                  }
                }}
              />
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="pm-stepper-actions">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0 || isSubmitting}
                icon={<ArrowLeft size={16} />}
              >
                Previous
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={() => handleAnswerSubmit(true)}
                disabled={isSubmitting}
                icon={<SkipForward size={16} />}
              >
                Skip Question
              </Button>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => handleAnswerSubmit(false)}
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="spinner" size={16} /> : <ArrowRight size={16} />}
            >
              {isSubmitting ? 'Validating...' : 'Save & Next'}
            </Button>
          </div>
        </div>
      )}

      {/* Completion CTA when all questions are answered */}
      {isAllAnswered && (
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '2px solid #bbf7d0',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={28} color="#10b981" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#166534' }}>
                All Questionnaire Responses Saved!
              </div>
              <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                Our clinical AI engine will now formulate your personalized schedule and dietary routine.
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={onReadyToGenerate}
            icon={<Sparkles size={18} />}
          >
            Generate Personalized Plan
          </Button>
        </div>
      )}
    </div>
  );
}
