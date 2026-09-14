import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  Play,
  Pause,
  XCircle,
  Sparkles,
  ShieldAlert,
  Apple,
  Activity,
  PlusCircle,
  Check,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { PlanDiscussionChat } from './PlanDiscussionChat';

export function PlanDetailView({
  plan,
  onApprove,
  onPause,
  onResume,
  onCancel,
  onLogActivity,
  onSendMessage,
  onApplyModification,
  onStartNewGoal,
}) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const isReady = plan?.status === 'ready';
  const isActive = plan?.status === 'active';
  const isPaused = plan?.status === 'paused';
  const isCancelled = plan?.status === 'cancelled';

  const items = plan?.items || [];
  const todayLogs = plan?.today_logs || [];
  const dietGuides = Array.isArray(plan?.diet_guidelines) ? plan.diet_guidelines : [];
  const lifeGuides = Array.isArray(plan?.lifestyle_guidelines) ? plan.lifestyle_guidelines : [];
  const precautions = Array.isArray(plan?.precautions) ? plan.precautions : [];

  const handleAction = async (fn) => {
    if (isActionLoading) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      await fn(plan.id);
    } catch (err) {
      setActionError(err?.message || 'Operation failed. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleLog = async (itemId) => {
    const existing = todayLogs.find((l) => l.item_id === itemId);
    const newStatus = existing?.status === 'completed' ? 'skipped' : 'completed';

    try {
      await onLogActivity(plan.id, {
        item_id: itemId,
        log_date: new Date().toISOString().split('T')[0],
        status: newStatus,
        notes: null,
      });
    } catch (err) {
      setActionError(err?.message || 'Could not update activity log.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Error Banner */}
      {actionError && (
        <div className="pm-alert pm-alert-error">
          <span>{actionError}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="pm-header-banner">
        <div className="pm-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span className={`pm-status-badge pm-status-${plan.status}`}>
              {plan.status}
            </span>
            <span className="pm-meta-tag">Version {plan.version}</span>
            <span className="pm-meta-tag">{plan.target_duration_weeks} Weeks Plan</span>
          </div>

          <h2>{plan.title}</h2>
          <p>{plan.summary}</p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {isReady && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleAction(onApprove)}
              disabled={isActionLoading}
              icon={isActionLoading ? <Loader2 className="spinner" size={18} /> : <CheckCircle size={18} />}
              style={{ background: '#10b981', borderColor: '#059669' }}
            >
              {isActionLoading ? 'Activating Plan...' : 'Approve & Start Plan'}
            </Button>
          )}

          {isActive && (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={() => handleAction(onPause)}
                disabled={isActionLoading}
                icon={<Pause size={16} />}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}
              >
                Pause Plan
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => handleAction(onCancel)}
                disabled={isActionLoading}
                icon={<XCircle size={16} />}
                style={{ background: 'rgba(239,68,68,0.2)', color: '#fee2e2', borderColor: 'rgba(239,68,68,0.5)' }}
              >
                Cancel Plan
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleAction(onResume)}
                disabled={isActionLoading}
                icon={<Play size={16} />}
              >
                Resume Plan
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => handleAction(onCancel)}
                disabled={isActionLoading}
                icon={<XCircle size={16} />}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
              >
                Cancel Plan
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={onStartNewGoal}
            icon={<PlusCircle size={16} />}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Start New Goal
          </Button>
        </div>
      </div>

      {/* Today's Tracker (Visible when active) */}
      {isActive && items.length > 0 && (
        <div className="pm-tracker-card">
          <div className="pm-tracker-header">
            <div className="pm-tracker-title">
              <Calendar size={20} />
              Today's Schedule & Progress Tracking
            </div>
            <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
              {todayLogs.filter((l) => l.status === 'completed').length} of {items.length} Completed Today
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {items.map((item) => {
              const isDone = todayLogs.some((l) => l.item_id === item.id && l.status === 'completed');
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: isDone ? '#dcfce7' : '#ffffff',
                    border: isDone ? '1px solid #86efac' : '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>
                      {item.time_of_day}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isDone ? '#166534' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                      {item.title}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`pm-check-btn ${isDone ? 'completed' : ''}`}
                    onClick={() => handleToggleLog(item.id)}
                    title={isDone ? 'Mark uncompleted' : 'Mark completed for today'}
                  >
                    {isDone ? <Check size={18} /> : <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#cbd5e1' }} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Routine Timeline */}
      <div className="pm-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="var(--primary)" />
          Personalized Daily Routine & Schedule
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Follow these structured windows throughout your day for optimal consistency and habit formation.
        </p>

        <div className="pm-timeline">
          {items.map((item) => (
            <div key={item.id} className="pm-timeline-item">
              <div className="pm-item-time">{item.time_of_day}</div>
              <div className="pm-item-content">
                <span className="pm-item-cat">{item.category?.replace('_', ' ')}</span>
                <span className="pm-item-title">{item.title}</span>
                <span className="pm-item-desc">{item.description}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Guidelines Grid */}
        <div className="pm-guidelines-grid">
          {dietGuides.length > 0 && (
            <div className="pm-guide-box">
              <div className="pm-guide-title">
                <Apple size={18} color="#16a34a" />
                Dietary & Nutritional Guidance
              </div>
              <ul className="pm-guide-list">
                {dietGuides.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          {lifeGuides.length > 0 && (
            <div className="pm-guide-box">
              <div className="pm-guide-title">
                <Activity size={18} color="var(--primary)" />
                Daily Habits & Lifestyle Tips
              </div>
              <ul className="pm-guide-list">
                {lifeGuides.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          {precautions.length > 0 && (
            <div className="pm-guide-box" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
              <div className="pm-guide-title" style={{ color: '#92400e' }}>
                <ShieldAlert size={18} color="#d97706" />
                Clinical Precautions & Disclaimers
              </div>
              <ul className="pm-guide-list" style={{ color: '#78350f' }}>
                {precautions.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Interactive Discussion Chat */}
        <PlanDiscussionChat
          plan={plan}
          onSendMessage={onSendMessage}
          onApplyModification={onApplyModification}
        />
      </div>
    </div>
  );
}
