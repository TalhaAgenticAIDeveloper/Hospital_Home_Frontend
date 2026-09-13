import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Stethoscope,
  Utensils,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { patientReportExplainerApi } from '../../../api/patientReportExplainer';

const QUICK_PROMPTS = [
  { label: 'Can I eat oily food / parathas?', icon: Utensils },
  { label: 'Are any results dangerously high or low?', icon: Activity },
  { label: 'What questions should I ask my doctor?', icon: Stethoscope },
  { label: 'Explain the abnormal markers in simple words', icon: HelpCircle },
  { label: 'What dietary changes should I consider?', icon: Sparkles },
];

function generateTempMessage(sessionId, text) {
  return {
    id: 'temp_' + Math.random().toString(36).substring(2, 9),
    session_id: sessionId,
    role: 'user',
    content: text,
    created_at: new Date().toISOString(),
    is_report_summary: false,
  };
}

export function ReportChat({ sessionId, messages = [], onMessageAdded }) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending || !sessionId) return;

    setInputText('');
    setErrorMsg('');
    setIsSending(true);

    // Optimistic user message
    const tempUserMsg = generateTempMessage(sessionId, text);
    onMessageAdded(tempUserMsg);

    try {
      const res = await patientReportExplainerApi.sendChatMessage(sessionId, text);
      if (res && res.message) {
        onMessageAdded(res.message, true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send question to AI.');
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter out the initial huge summary so the chat begins with conversational messages
  const chatMessages = messages.filter((m) => !m.is_report_summary);

  return (
    <div className="report-chat-wrapper">
      {/* Messages Scroll Area */}
      <div className="chat-messages-container">
        {chatMessages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-chat-icon">
              <Sparkles size={28} className="text-primary" />
            </div>
            <h3>Ask Follow-up Questions</h3>
            <p>
              Have questions about your diet, daily routine, or test values?
              Ask anything below or choose a suggestion to get started.
            </p>

            <div className="suggestions-grid">
              {QUICK_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={idx}
                    className="suggestion-chip"
                    onClick={() => handleSend(prompt.label)}
                    disabled={isSending}
                  >
                    <Icon size={14} className="chip-icon" />
                    <span>{prompt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              const isCopied = copiedId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`message-row ${isUser ? 'user-message' : 'ai-message'}`}
                >
                  <div className="message-avatar">
                    {isUser ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  <div className="message-bubble">
                    <div className="message-header-row">
                      <span className="message-sender-name">
                        {isUser ? 'You' : 'Health Assistant AI'}
                      </span>
                      {!isUser && (
                        <button
                          className="btn-copy-bubble"
                          onClick={() => handleCopy(msg.content, msg.id)}
                          title="Copy reply"
                        >
                          {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>

                    <div className="message-content">
                      {isUser ? (
                        <p>{msg.content}</p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>

                    <span className="message-timestamp">
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="message-row ai-message">
                <div className="message-avatar">
                  <Bot size={18} />
                </div>
                <div className="message-bubble typing-bubble">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-label">Consulting report markers...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestion Bar when chat has messages */}
      {chatMessages.length > 0 && (
        <div className="chat-chips-scroll">
          {QUICK_PROMPTS.slice(0, 3).map((prompt, idx) => (
            <button
              key={idx}
              className="suggestion-chip-mini"
              onClick={() => handleSend(prompt.label)}
              disabled={isSending}
            >
              <span>{prompt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="chat-error-bar">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Composer */}
      <div className="chat-composer-box">
        <textarea
          ref={inputRef}
          className="chat-textarea"
          placeholder="Ask a question about your report (e.g. Can I eat parathas? What does this mean?)..."
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />

        <button
          className="btn-send-message"
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isSending}
          title="Send message"
        >
          {isSending ? <Loader2 size={18} className="spin-icon" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
