import React, { useState } from 'react';
import {
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../common/Button';

export function QuestionnaireView({
  goal,
  onAnswerSubmitted,
  onGeneratePlan,
  isGenerating,
}) {
  const questions = goal?.questions || [];
  // Build answers array from each question's current_answer (backend nests answers inside questions)
  const answers = questions
    .filter((q) => q.current_answer)
    .map((q) => ({
      question_id: q.id,
      raw_input: q.current_answer.raw_input,
      validation_status: q.current_answer.validation_status,
    }));

  // Find index of first unanswered required question or default to 0
  const findInitialIndex = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const hasAnswer = answers.some(
        (a) => a.question_id === q.id && a.validation_status === 'valid'
      );
      if (!hasAnswer) return i;
    }
    return Math.max(0, questions.length - 1);
  };

  const [currentIndex, setCurrentIndex] = useState(findInitialIndex);
  const [currentInput, setCurrentInput] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const currentAnswer = answers.find((a) => a.question_id === currentQ?.id);
  const isCurrentAnswerValid = currentAnswer?.validation_status === 'valid';
  const isCurrentSaved = isCurrentAnswerValid && currentInput.trim() === (currentAnswer?.raw_input || '').trim();

  const answeredCount = answers.filter((a) => a.validation_status === 'valid').length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const isAllAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  // Disable Save & Next on the last question when it has been saved or all questions are completed
  const isSaveNextDisabled =
    isSubmittingAnswer ||
    (isLastQuestion && (isAllAnswered || isCurrentSaved));

  // Sync existing answer when navigating to a question
  React.useEffect(() => {
    if (currentQ) {
      const existing = answers.find((a) => a.question_id === currentQ.id);
      setCurrentInput(existing?.raw_input || '');
      setFeedback(null);
    }
  }, [currentIndex, currentQ?.id]);

  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!currentInput.trim() && currentQ?.is_required) {
      setFeedback({ type: 'error', message: 'This question requires an answer before continuing.' });
      return;
    }

    setIsSubmittingAnswer(true);
    setFeedback(null);

    try {
      const res = await onAnswerSubmitted(currentQ.id, currentInput.trim());
      if (res?.validation_status === 'valid') {
        const isFinal = currentIndex === totalQuestions - 1;
        setFeedback({
          type: 'success',
          message: res.clarification_message || (isFinal ? 'All questions completed! You can now generate your plan below.' : 'Saved successfully!'),
        });
        if (!isFinal) {
          setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
            setFeedback(null);
          }, 400);
        }
      } else if (res?.validation_status === 'warning') {
        setFeedback({
          type: 'warning',
          message: res.clarification_message || 'Please review this advisory note.',
          canProceedAnyway: true,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res?.clarification_message || 'Please enter a valid response.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not save answer. Please try again.',
      });
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleProceedWithWarning = async () => {
    setIsSubmittingAnswer(true);
    try {
      const res = await onAnswerSubmitted(currentQ.id, currentInput.trim(), { allow_warning: true });
      if (res?.validation_status === 'valid' || res?.validation_status === 'warning') {
        const isFinal = currentIndex === totalQuestions - 1;
        setFeedback({
          type: 'success',
          message: isFinal ? 'All questions completed! You can now generate your plan below.' : 'Noted! Proceeding to next question.',
        });
        if (!isFinal) {
          setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
            setFeedback(null);
          }, 350);
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Could not proceed. Please try again.',
      });
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleSelectOption = (opt) => {
    setCurrentInput(opt);
  };

  // If user clicked generate plan
  if (isGenerating) {
    return (
      <div
        className="pm-form-card"
        style={{ textAlign: 'center', padding: '3.5rem 2rem', maxWidth: '600px', margin: '2rem auto' }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            margin: '0 auto 1.5rem auto',
            animation: 'pulse 1.8s infinite',
          }}
        >
          <Sparkles size={30} />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Generating Your Personalized Plan...
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Our AI clinician is analyzing your responses, calculating calorie targets, verifying dietary safety, and designing your daily timeline.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            marginTop: '2rem',
            textAlign: 'left',
            maxWidth: '380px',
            margin: '2rem auto 0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#059669' }}>
            <CheckCircle2 size={16} /> Calculating calorie & protein targets
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#059669' }}>
            <CheckCircle2 size={16} /> Verifying allergy & ingredient safety
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#059669' }}>
            <CheckCircle2 size={16} /> Assembling scheduled meals & exercises
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-questionnaire-container">
      {/* Progress Bar */}
      <div style={{ maxWidth: '680px', margin: '0 auto 1.5rem auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
          <span>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span>{progressPercent}% Completed</span>
        </div>
        <div className="pm-question-progress-bar">
          <div className="pm-question-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Main Question Card */}
      {currentQ && (
        <form onSubmit={handleSubmitAnswer} className="pm-question-card">
          <div className="pm-question-header">
            <span className="pm-question-step-badge">{currentIndex + 1}</span>
            <div style={{ flex: 1 }}>
              <h3 className="pm-question-text">{currentQ.question_text}</h3>
              {currentQ.help_text && (
                <p className="pm-question-help">
                  <HelpCircle size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {currentQ.help_text}
                </p>
              )}
            </div>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div
              style={{
                padding: '0.65rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                background:
                  feedback.type === 'error'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : feedback.type === 'warning'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(16, 185, 129, 0.1)',
                color:
                  feedback.type === 'error'
                    ? '#b91c1c'
                    : feedback.type === 'warning'
                    ? '#b45309'
                    : '#047857',
                border: `1px solid ${
                  feedback.type === 'error'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : feedback.type === 'warning'
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)'
                }`,
              }}
            >
              {feedback.type === 'error' ? (
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
              ) : (
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              )}
              <span style={{ flex: 1, minWidth: '200px' }}>{feedback.message}</span>
              {feedback.canProceedAnyway && (
                <button
                  type="button"
                  onClick={handleProceedWithWarning}
                  disabled={isSubmittingAnswer}
                  style={{
                    marginLeft: 'auto',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {isSubmittingAnswer ? 'Processing...' : 'Continue Anyway →'}
                </button>
              )}
            </div>
          )}

          {/* Options / Input based on question_type */}
          <div className="pm-question-input-wrapper">
            {currentQ.question_type === 'select' && (Array.isArray(currentQ.options) ? currentQ.options : currentQ.options?.items) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                <div className="pm-options-grid">
                  {(Array.isArray(currentQ.options) ? currentQ.options : currentQ.options.items).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`pm-option-btn ${currentInput === opt ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block', fontWeight: 500 }}>
                    Or type your custom answer freely:
                  </label>
                  <input
                    type="text"
                    className="pm-form-input"
                    placeholder="Type anything here (e.g. custom preference or routine)..."
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                  />
                </div>
              </div>
            ) : currentQ.question_type === 'number' ? (
              <div style={{ maxWidth: '420px', width: '100%' }}>
                <input
                  type="text"
                  className="pm-form-input"
                  placeholder="Enter your answer with unit (e.g. 70 kg, 150 lb, 175 cm)..."
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  autoFocus
                />
              </div>
            ) : currentQ.question_type === 'time' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '260px', width: '100%' }}>
                <input
                  type="text"
                  className="pm-form-input"
                  placeholder="e.g. 07:30 AM or 8:00"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  autoFocus
                />
              </div>
            ) : (
              <textarea
                className="pm-form-textarea"
                rows={3}
                placeholder="Type your response..."
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              icon={<ArrowLeft size={15} />}
            >
              Previous
            </Button>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaveNextDisabled}
                isLoading={isSubmittingAnswer}
                icon={isSaveNextDisabled ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
                title={isSaveNextDisabled ? "All questions completed. This is the last question." : undefined}
              >
                {isLastQuestion && (isAllAnswered || isCurrentSaved) ? 'Save & Next (Last Question)' : 'Save & Next'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Ready to Generate Plan CTA Banner */}
      {isAllAnswered && (
        <div
          style={{
            maxWidth: '680px',
            margin: '2rem auto 0 auto',
            padding: '1.5rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, color: '#065f46', fontSize: '1.05rem' }}>
              🎉 Questionnaire Complete!
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#047857' }}>
              All responses have been recorded. You can now generate your personalized daily plan.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onGeneratePlan}
            icon={<Sparkles size={18} />}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            Generate AI Wellness Plan
          </Button>
        </div>
      )}
    </div>
  );
}
