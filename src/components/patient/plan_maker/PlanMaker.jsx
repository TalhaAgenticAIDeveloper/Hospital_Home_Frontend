import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  History,
  AlertCircle,
  Loader2,
  CalendarHeart,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { patientPlanApi } from '../../../api/patientPlan';
import { PlanGoalSelection } from './PlanGoalSelection';
import { PlanQuestionnaire } from './PlanQuestionnaire';
import { PlanGeneratingView } from './PlanGeneratingView';
import { PlanDetailView } from './PlanDetailView';
import './planMaker.css';

export function PlanMaker() {
  const [viewState, setViewState] = useState('loading'); // loading, goal_selection, questionnaire, generating, plan_detail
  const [currentGoal, setCurrentGoal] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [pastPlans, setPastPlans] = useState([]);
  const [isPastModalOpen, setIsPastModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [globalError, setGlobalError] = useState(null);

  // ── Initial State Recovery ────────────────────────────────────────────────
  const loadInitialState = useCallback(async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      // 1. Check for current active plan
      const activePlan = await patientPlanApi.getActivePlan();
      if (activePlan) {
        setCurrentPlan(activePlan);
        setViewState('plan_detail');
        setIsLoading(false);
        return;
      }

      // 2. Check for in-progress goal/questionnaire
      const inProgressGoal = await patientPlanApi.getCurrentGoal();
      if (inProgressGoal) {
        setCurrentGoal(inProgressGoal);

        // If goal already has a generated plan in ready state
        if (inProgressGoal.active_plan_id) {
          try {
            const planDetail = await patientPlanApi.getPlanDetail(inProgressGoal.active_plan_id);
            setCurrentPlan(planDetail);
            setViewState('plan_detail');
            setIsLoading(false);
            return;
          } catch {
            // fallback to questionnaire
          }
        }

        if (inProgressGoal.workflow_state === 'QUESTIONNAIRE_COMPLETED' || inProgressGoal.workflow_state === 'PLAN_GENERATING') {
          setViewState('generating');
        } else {
          setViewState('questionnaire');
        }
        setIsLoading(false);
        return;
      }

      // 3. Check for any recent ready/draft plans
      const allPlans = await patientPlanApi.listPlans();
      setPastPlans(allPlans || []);
      if (allPlans && allPlans.length > 0 && allPlans[0].status === 'ready') {
        const fullLatest = await patientPlanApi.getPlanDetail(allPlans[0].id);
        setCurrentPlan(fullLatest);
        setViewState('plan_detail');
        setIsLoading(false);
        return;
      }

      // Default: Goal selection
      setViewState('goal_selection');
    } catch (err) {
      setGlobalError(err?.message || 'Could not load your health plan state. Please refresh.');
      setViewState('goal_selection');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  // Fetch past plans on modal open
  const handleOpenPastPlans = async () => {
    setIsPastModalOpen(true);
    try {
      const list = await patientPlanApi.listPlans();
      setPastPlans(list || []);
    } catch {
      // Ignore
    }
  };

  const handleSelectPastPlan = async (planId) => {
    setIsLoading(true);
    setIsPastModalOpen(false);
    try {
      const full = await patientPlanApi.getPlanDetail(planId);
      setCurrentPlan(full);
      setViewState('plan_detail');
    } catch (err) {
      setGlobalError(err?.message || 'Could not load selected plan.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleGoalCreated = async (payload) => {
    const newGoal = await patientPlanApi.createGoal(payload);
    setCurrentGoal(newGoal);
    setViewState('questionnaire');
  };

  const handleAnswerSubmitted = async (goalId, payload) => {
    const resp = await patientPlanApi.answerQuestion(goalId, payload);
    // Refresh goal to update answers & completion status
    const updatedGoal = await patientPlanApi.getCurrentGoal();
    if (updatedGoal) {
      setCurrentGoal(updatedGoal);
    }
    return resp;
  };

  const handleGeneratePlan = async () => {
    if (!currentGoal) return;
    setViewState('generating');
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const planResp = await patientPlanApi.generatePlan(currentGoal.id);
      setCurrentPlan(planResp);
      setViewState('plan_detail');
    } catch (err) {
      setGenerationError(err?.message || 'Plan generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprovePlan = async (planId) => {
    const approved = await patientPlanApi.approvePlan(planId);
    setCurrentPlan(approved);
  };

  const handlePausePlan = async (planId) => {
    const paused = await patientPlanApi.pausePlan(planId);
    setCurrentPlan(paused);
  };

  const handleResumePlan = async (planId) => {
    const resumed = await patientPlanApi.resumePlan(planId);
    setCurrentPlan(resumed);
  };

  const handleCancelPlan = async (planId) => {
    const cancelled = await patientPlanApi.cancelPlan(planId);
    setCurrentPlan(cancelled);
  };

  const handleLogActivity = async (planId, payload) => {
    const updated = await patientPlanApi.logActivity(planId, payload);
    setCurrentPlan(updated);
  };

  const handleSendMessage = async (planId, message) => {
    await patientPlanApi.sendChatMessage(planId, message);
    // Reload full plan detail to update discussion thread and modifications
    const updated = await patientPlanApi.getPlanDetail(planId);
    setCurrentPlan(updated);
  };

  const handleApplyModification = async (planId, payload) => {
    const updated = await patientPlanApi.applyModification(planId, payload);
    setCurrentPlan(updated);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="pm-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Loader2 className="spinner" size={36} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Loading Your Wellness Plan...</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Restoring your goals, answers, and schedule state.
        </p>
      </div>
    );
  }

  return (
    <div className="plan-maker-container">
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarHeart size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            AI Health & Wellness Plan Maker
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            icon={<History size={15} />}
            onClick={handleOpenPastPlans}
          >
            Past Plans History
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="pm-alert pm-alert-error">
          <AlertCircle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      {/* Main View Router */}
      {viewState === 'goal_selection' && (
        <PlanGoalSelection onGoalCreated={handleGoalCreated} />
      )}

      {viewState === 'questionnaire' && (
        <PlanQuestionnaire
          goal={currentGoal}
          onAnswerSubmitted={handleAnswerSubmitted}
          onReadyToGenerate={handleGeneratePlan}
          onResetGoal={() => setViewState('goal_selection')}
        />
      )}

      {viewState === 'generating' && (
        <PlanGeneratingView
          isGenerating={isGenerating}
          error={generationError}
          onRetry={handleGeneratePlan}
          onBackToQuestions={() => setViewState('questionnaire')}
        />
      )}

      {viewState === 'plan_detail' && currentPlan && (
        <PlanDetailView
          plan={currentPlan}
          onApprove={handleApprovePlan}
          onPause={handlePausePlan}
          onResume={handleResumePlan}
          onCancel={handleCancelPlan}
          onLogActivity={handleLogActivity}
          onSendMessage={handleSendMessage}
          onApplyModification={handleApplyModification}
          onStartNewGoal={() => setViewState('goal_selection')}
        />
      )}

      {/* Past Plans Modal */}
      {isPastModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setIsPastModalOpen(false)}
        >
          <div
            className="pm-card"
            style={{ width: '100%', maxWidth: 580, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="var(--primary)" />
                Past Plans History
              </h3>
              <button
                type="button"
                onClick={() => setIsPastModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {pastPlans.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                No past plans recorded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pastPlans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPastPlan(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      background: '#f8fafc',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {p.target_duration_weeks} Weeks • Created on {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className={`pm-status-badge pm-status-${p.status}`}>
                        {p.status}
                      </span>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
