import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Check,
  X,
  MessageSquare,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../common/Button';

const SUGGESTIONS = [
  'Can I swap my breakfast meal?',
  'Make the evening workout lighter',
  'Natural remedies for better sleep',
  'Can I eat brown rice or rotis?',
  'Shift dinner time 30 mins earlier',
  'Why did you choose this morning routine?',
];

export function PlanDiscussionChat({
  plan,
  onSendMessage,
  onApplyModification,
}) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const chatEndRef = useRef(null);

  const discussions = plan?.discussions || [];

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discussions]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    setInputText('');
    setIsSending(true);
    try {
      await onSendMessage(plan.id, text.trim());
    } finally {
      setIsSending(false);
    }
  };

  const handleModificationAction = async (action) => {
    if (isModifying) return;
    setIsModifying(true);
    try {
      await onApplyModification(plan.id, {
        action,
        expected_version: plan.version,
      });
    } finally {
      setIsModifying(false);
    }
  };

  return (
    <div className="pm-chat-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="var(--primary)" />
          Plan Refinement & Q&A Assistant
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Powered by Clinical AI
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        Ask any dietary question, request ingredient swaps, or adjust activity times.
        Confirmations (e.g. &ldquo;yes&rdquo; / &ldquo;apply&rdquo;) will update your schedule instantly.
      </p>

      {/* Suggestion Chips */}
      <div className="pm-chips-bar">
        {SUGGESTIONS.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            className="pm-chip"
            onClick={() => handleSend(sug)}
            disabled={isSending}
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="pm-chat-thread">
        {discussions.map((msg) => {
          const isUser = msg.role === 'user';
          const hasPendingMod =
            msg.proposed_modifications &&
            msg.proposed_modifications.status === 'pending';
          const hasAppliedMod =
            msg.proposed_modifications &&
            msg.proposed_modifications.status === 'applied';

          return (
            <div
              key={msg.id}
              className={`pm-chat-bubble ${isUser ? 'user' : 'assistant'}`}
            >
              <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>

              {/* Pending Modification Proposal Box */}
              {hasPendingMod && (
                <div className="pm-mod-banner" style={{ marginTop: '0.85rem' }}>
                  <div className="pm-mod-header">
                    <span>Proposed Schedule Adjustment</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309' }}>
                      Pending Confirmation
                    </span>
                  </div>

                  <div className="pm-mod-diff">
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                        CURRENT
                      </div>
                      <div style={{ fontWeight: 600, color: '#334155' }}>
                        {msg.proposed_modifications.original_title || 'Original Activity'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        PROPOSED
                      </div>
                      <div style={{ fontWeight: 700, color: '#166534' }}>
                        {msg.proposed_modifications.proposed_title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                        {msg.proposed_modifications.proposed_description}
                      </div>
                    </div>
                  </div>

                  <div className="pm-mod-actions">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModificationAction('reject')}
                      disabled={isModifying}
                      icon={<X size={14} />}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleModificationAction('accept')}
                      disabled={isModifying}
                      icon={isModifying ? <Loader2 className="spinner" size={14} /> : <Check size={14} />}
                    >
                      {isModifying ? 'Applying...' : 'Apply Change'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Applied Modification Badge */}
              {hasAppliedMod && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 600,
                  }}
                >
                  <Check size={14} /> Modification applied to plan
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pm-chat-input-bar"
      >
        <input
          type="text"
          className="pm-input-field"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question or request a meal/workout change..."
          disabled={isSending}
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!inputText.trim() || isSending}
          icon={isSending ? <Loader2 className="spinner" size={16} /> : <Send size={16} />}
        >
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
