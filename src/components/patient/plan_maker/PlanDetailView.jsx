import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Flame,
  Apple,
  MessageSquare,
  Send,
  AlertTriangle,
  Play,
  Pause,
  Check,
  X,
} from 'lucide-react';
import { Button } from '../../common/Button';

export function PlanDetailView({
  plan,
  onApprovePlan,
  onPausePlan,
  onResumePlan,
  onCancelPlan,
  onLogActivity,
  onSendMessage,
  onApplyModification,
  onStartNewGoal,
  isActionLoading,
}) {
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState('');
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule', 'guidelines', 'chat'
  const [loggingItemId, setLoggingItemId] = useState(null);

  const items = plan?.items || [];
  const discussions = plan?.discussions || [];
  const todayLogs = plan?.today_logs || [];
  const summary = plan?.daily_nutrition_summary;

  const isCompletedToday = (itemId) => {
    return todayLogs.some((l) => l.item_id === itemId && l.status === 'completed');
  };

  const handleToggleLog = async (item) => {
    const isDone = isCompletedToday(item.id);
    const newStatus = isDone ? 'skipped' : 'completed';
    setLoggingItemId(item.id);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await onLogActivity({
        item_id: item.id,
        log_date: todayStr,
        status: newStatus,
        notes: `Marked as ${newStatus} from daily plan view.`,
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    } finally {
      setLoggingItemId(null);
    }
  };

  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim() || isSendingChat) return;

    const msg = chatMessage.trim();
    setChatMessage('');
    setIsSendingChat(true);
    setChatError('');

    try {
      await onSendMessage(msg);
    } catch (err) {
      setChatError(err.message || 'Could not send message.');
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleQuickChip = (text) => {
    setChatMessage(text);
  };

  return (
    <div className="pm-detail-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Plan Header Bar ── */}
      <div className="pm-header-bar">
        <div className="pm-header-title-group">
          <div className="pm-header-icon-box">
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 className="pm-header-title">{plan.title}</h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  background:
                    plan.status === 'active'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : plan.status === 'ready'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(100, 116, 139, 0.15)',
                  color:
                    plan.status === 'active'
                      ? '#059669'
                      : plan.status === 'ready'
                      ? '#2563eb'
                      : '#475569',
                }}
              >
                {plan.status === 'ready' ? 'Ready to Start' : plan.status}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                v{plan.version} • {plan.target_duration_weeks} Weeks
              </span>
            </div>
            <p className="pm-header-subtitle">{plan.summary}</p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="pm-header-actions">
          {plan.status === 'ready' && (
            <Button
              variant="primary"
              size="md"
              isLoading={isActionLoading}
              onClick={onApprovePlan}
              icon={<Play size={16} />}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              Approve & Start Plan
            </Button>
          )}

          {plan.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              isLoading={isActionLoading}
              onClick={onPausePlan}
              icon={<Pause size={15} />}
            >
              Pause Plan
            </Button>
          )}

          {plan.status === 'paused' && (
            <Button
              variant="primary"
              size="sm"
              isLoading={isActionLoading}
              onClick={onResumePlan}
              icon={<Play size={15} />}
            >
              Resume Plan
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            isLoading={isActionLoading}
            onClick={onCancelPlan}
            style={{ color: '#ef4444' }}
          >
            Cancel Plan
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onStartNewGoal}
            style={{ color: 'var(--text-secondary)' }}
          >
            Start New Goal
          </Button>
        </div>
      </div>

      {/* ── Daily Nutrition Summary Banner ── */}
      {summary && (
        <div className="pm-nutrition-banner">
          <div className="pm-nb-header">
            <span className="pm-nb-title">
              <Flame size={20} />
              Daily Nutritional Target Summary
            </span>
            <span style={{ fontSize: '0.825rem', opacity: 0.9 }}>
              Net Calories: <strong>{summary.net_calories ?? (summary.total_calories - (summary.total_calories_burned || 0))} kcal</strong>
            </span>
          </div>

          <div className="pm-nb-grid">
            <div className="pm-nb-item">
              <span className="pm-nb-item-label">Total Calories</span>
              <span className="pm-nb-item-value">{summary.total_calories || 0}</span>
              <span className="pm-nb-item-sub">kcal consumed</span>
            </div>

            <div className="pm-nb-item">
              <span className="pm-nb-item-label">Protein</span>
              <span className="pm-nb-item-value">{summary.total_protein_g || 0}g</span>
              <span className="pm-nb-item-sub">muscle & tissue</span>
            </div>

            <div className="pm-nb-item">
              <span className="pm-nb-item-label">Carbs</span>
              <span className="pm-nb-item-value">{summary.total_carbs_g || 0}g</span>
              <span className="pm-nb-item-sub">energy source</span>
            </div>

            <div className="pm-nb-item">
              <span className="pm-nb-item-label">Healthy Fats</span>
              <span className="pm-nb-item-value">{summary.total_fat_g || 0}g</span>
              <span className="pm-nb-item-sub">hormone health</span>
            </div>

            <div className="pm-nb-item">
              <span className="pm-nb-item-label">Fiber</span>
              <span className="pm-nb-item-value">{summary.total_fiber_g || 0}g</span>
              <span className="pm-nb-item-sub">digestive health</span>
            </div>

            <div className="pm-nb-item">
              <span className="pm-nb-item-label">Burn Target</span>
              <span className="pm-nb-item-value" style={{ color: '#fca5a5' }}>
                -{summary.total_calories_burned || 0}
              </span>
              <span className="pm-nb-item-sub">kcal active burn</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-navigation Tabs (Schedule vs Guidelines vs Refinement Chat) ── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'schedule' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
            color: activeTab === 'schedule' ? '#059669' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Daily Schedule ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guidelines')}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'guidelines' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
            color: activeTab === 'guidelines' ? '#059669' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Diet & Guidelines
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'chat' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
            color: activeTab === 'chat' ? '#059669' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <MessageSquare size={16} />
          <span>AI Doctor & Nutrition Chat</span>
          {discussions.length > 1 && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                background: '#10b981',
                color: '#ffffff',
              }}
            >
              {discussions.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: Daily Schedule Items ── */}
      {activeTab === 'schedule' && (
        <div className="pm-schedule-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Today's Routine & Caloric Impact
            </h3>
            {plan.status === 'active' && (
              <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Click checkbox to check off activities as you complete them
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {items.map((item) => {
              const done = isCompletedToday(item.id);
              return (
                <div key={item.id} className={`pm-item-row ${done ? 'completed' : ''}`}>
                  {/* Status Checkbox for Active Plans */}
                  {plan.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleToggleLog(item)}
                      disabled={loggingItemId === item.id}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        color: done ? '#10b981' : 'var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                      title={done ? 'Mark as incomplete' : 'Mark as complete today'}
                    >
                      {done ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                  )}

                  {/* Time & Category */}
                  <div className="pm-item-time-col">
                    <span className="pm-item-time">{item.time_of_day}</span>
                    <span className="pm-category-pill">{item.category}</span>
                  </div>

                  {/* Body & Nutritional Impact */}
                  <div className="pm-item-body">
                    <h4 className="pm-item-title">{item.title}</h4>
                    <p className="pm-item-desc">{item.description}</p>

                    {/* Macro Tags */}
                    <div className="pm-item-nutrition-tags">
                      {item.calories !== null && item.calories !== undefined && (
                        <span className="pm-macro-pill cal">
                          <Flame size={13} />
                          {item.calories} kcal
                        </span>
                      )}

                      {item.protein_g !== null && item.protein_g !== undefined && (
                        <span className="pm-macro-pill protein">
                          Protein: {item.protein_g}g
                        </span>
                      )}

                      {item.carbs_g !== null && item.carbs_g !== undefined && (
                        <span className="pm-macro-pill">
                          Carbs: {item.carbs_g}g
                        </span>
                      )}

                      {item.fat_g !== null && item.fat_g !== undefined && (
                        <span className="pm-macro-pill">
                          Fat: {item.fat_g}g
                        </span>
                      )}

                      {item.fiber_g !== null && item.fiber_g !== undefined && (
                        <span className="pm-macro-pill">
                          Fiber: {item.fiber_g}g
                        </span>
                      )}

                      {item.calories_burned !== null && item.calories_burned !== undefined && (
                        <span className="pm-macro-pill burned">
                          <Flame size={13} />
                          Burns ~{item.calories_burned} kcal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: Diet & Guidelines ── */}
      {activeTab === 'guidelines' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Diet Guidelines */}
          <div className="pm-schedule-card">
            <h4 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857' }}>
              <Apple size={18} />
              Dietary Guidelines
            </h4>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {(plan.diet_guidelines?.items || plan.diet_guidelines || []).map((g, idx) => (
                <li key={idx}>{g}</li>
              ))}
            </ul>
          </div>

          {/* Lifestyle Guidelines */}
          <div className="pm-schedule-card">
            <h4 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7' }}>
              <Sparkles size={18} />
              Lifestyle & Habits
            </h4>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {(plan.lifestyle_guidelines?.items || plan.lifestyle_guidelines || []).map((h, idx) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
          </div>

          {/* Precautions */}
          <div className="pm-schedule-card">
            <h4 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309' }}>
              <AlertTriangle size={18} />
              Clinical Precautions
            </h4>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {(plan.precautions?.items || plan.precautions || []).map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── TAB 3: Interactive Doctor & Nutrition Chat ── */}
      {activeTab === 'chat' && (
        <div className="pm-chat-card">
          <div className="pm-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                AI Clinical Wellness Advisor & Nutrition Guide
              </span>
            </div>
            <span style={{ fontSize: '0.785rem', opacity: 0.85 }}>
              Ask about plan changes or nutrition info (Roman Urdu / English)
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="pm-chat-messages">
            {discussions.map((d) => (
              <div key={d.id} className={`pm-message-bubble ${d.role}`}>
                <div>{d.content}</div>

                {/* If message includes proposed modification */}
                {d.proposed_modifications && (
                  <div className="pm-mod-card">
                    <div className="pm-mod-title">
                      <Sparkles size={15} />
                      Proposed Schedule Adjustment
                      <span style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'capitalize' }}>
                        ({d.proposed_modifications.status})
                      </span>
                    </div>

                    {d.proposed_modifications.status === 'pending' && (
                      <div className="pm-mod-actions">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            onApplyModification({
                              action: 'accept',
                              expected_version: plan.version,
                              modification: d.proposed_modifications,
                            })
                          }
                          icon={<Check size={14} />}
                        >
                          Accept & Apply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onApplyModification({
                              action: 'reject',
                              expected_version: plan.version,
                              modification: d.proposed_modifications,
                            })
                          }
                          icon={<X size={14} />}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Prompt Chips */}
          <div className="pm-quick-chips">
            <button
              type="button"
              className="pm-chip-btn"
              onClick={() => handleQuickChip('Banana mein kitni calories aur protein hain?')}
            >
              🍌 Banana calories?
            </button>
            <button
              type="button"
              className="pm-chip-btn"
              onClick={() => handleQuickChip('30 minute brisk walk se kitna calorie burn hoga?')}
            >
              🚶 30 min walk burn?
            </button>
            <button
              type="button"
              className="pm-chip-btn"
              onClick={() => handleQuickChip('Swap my breakfast with oats and fruits')}
            >
              🥣 Swap breakfast
            </button>
            <button
              type="button"
              className="pm-chip-btn"
              onClick={() => handleQuickChip('I work 9 to 5, please adjust my workout and lunch')}
            >
              ⏰ Adjust work hours
            </button>
            <button
              type="button"
              className="pm-chip-btn"
              onClick={() => handleQuickChip('1 roti aur daal mein kitni calories hoti hain?')}
            >
              🫓 Roti & Daal calories?
            </button>
          </div>

          {/* Chat Input Bar */}
          {chatError && (
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', fontSize: '0.8rem' }}>
              {chatError}
            </div>
          )}
          <form onSubmit={handleSendChat} className="pm-chat-input-bar">
            <input
              type="text"
              className="pm-chat-input"
              placeholder="Ask anything or request a plan change (e.g. 'banana calories?', 'change lunch')..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              disabled={isSendingChat}
            />
            <button
              type="submit"
              className="pm-chat-send-btn"
              disabled={!chatMessage.trim() || isSendingChat}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
