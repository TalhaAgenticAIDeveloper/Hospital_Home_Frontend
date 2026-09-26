import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { patientPlanApi } from '../../../api/patientPlan';
import { GoalSetupView } from './GoalSetupView';
import { QuestionnaireView } from './QuestionnaireView';
import { PlanDetailView } from './PlanDetailView';
import './planMaker.css';

export function PlanMaker() {
  const [viewState, setViewState] = useState('loading'); // 'loading', 'goal_setup', 'questionnaire', 'plan_detail'
  const [currentGoal, setCurrentGoal] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const initializePlanMaker = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // 1. Check for active plan first
      const activePlan = await patientPlanApi.getActivePlan();
      if (activePlan && activePlan.id) {
        setCurrentPlan(activePlan);
        setViewState('plan_detail');
        return;
      }

      // 2. Check for any existing plans (ready, draft, paused)
      const allPlans = await patientPlanApi.listPlans();
      if (allPlans && allPlans.length > 0) {
        const planDetail = await patientPlanApi.getPlanDetail(allPlans[0].id);
        if (planDetail) {
          setCurrentPlan(planDetail);
          setViewState('plan_detail');
          return;
        }
      }

      // 3. Check for current in-progress goal / questionnaire
      const goal = await patientPlanApi.getCurrentGoal();
      if (goal && goal.id) {
        setCurrentGoal(goal);

        // If goal has an active plan (in draft/ready state)
        if (goal.active_plan_id) {
          const planDetail = await patientPlanApi.getPlanDetail(goal.active_plan_id);
          if (planDetail) {
            setCurrentPlan(planDetail);
            setViewState('plan_detail');
            return;
          }
        }

        // If in questionnaire workflow
        if (
          goal.workflow_state === 'QUESTIONNAIRE_ACTIVE' ||
          goal.workflow_state === 'GOAL_CREATED' ||
          goal.workflow_state === 'QUESTIONNAIRE_COMPLETED'
        ) {
          setViewState('questionnaire');
          return;
        }
      }

      // 4. Default to goal setup
      setViewState('goal_setup');
    } catch (err) {
      console.error('Error initializing Plan Maker:', err);
      setErrorMessage(err.message || 'Failed to initialize Plan Maker.');
      setViewState('goal_setup');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializePlanMaker();
  }, [initializePlanMaker]);

  // Handler: Goal Creation
  const handleCreateGoal = async (goalPayload) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const createdGoal = await patientPlanApi.createGoal(goalPayload);
      setCurrentGoal(createdGoal);
      setViewState('questionnaire');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Answer Submission
  const handleAnswerQuestion = async (questionId, rawAnswer, options = {}) => {
    if (!currentGoal) return null;
    const res = await patientPlanApi.answerQuestion(currentGoal.id, {
      question_id: questionId,
      raw_input: rawAnswer,
      allow_warning: options.allow_warning || false,
    });
    // Refresh goal state to maintain updated answer list
    const updatedGoal = await patientPlanApi.getCurrentGoal();
    if (updatedGoal) {
      setCurrentGoal(updatedGoal);
    }
    return res;
  };

  // Handler: Generate Plan
  const handleGeneratePlan = async () => {
    if (!currentGoal) return;
    setIsGenerating(true);
    setErrorMessage('');
    try {
      const generatedPlan = await patientPlanApi.generatePlan(currentGoal.id);
      setCurrentPlan(generatedPlan);
      setViewState('plan_detail');
    } catch (err) {
      setErrorMessage(err.message || 'Plan generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Approve Plan
  const handleApprovePlan = async () => {
    if (!currentPlan) return;
    setIsActionLoading(true);
    try {
      const approved = await patientPlanApi.approvePlan(currentPlan.id);
      setCurrentPlan(approved);
    } catch (err) {
      alert(err.message || 'Failed to approve plan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler: Pause Plan
  const handlePausePlan = async () => {
    if (!currentPlan) return;
    setIsActionLoading(true);
    try {
      const paused = await patientPlanApi.pausePlan(currentPlan.id);
      setCurrentPlan(paused);
    } catch (err) {
      alert(err.message || 'Failed to pause plan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler: Resume Plan
  const handleResumePlan = async () => {
    if (!currentPlan) return;
    setIsActionLoading(true);
    try {
      const resumed = await patientPlanApi.resumePlan(currentPlan.id);
      setCurrentPlan(resumed);
    } catch (err) {
      alert(err.message || 'Failed to resume plan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler: Cancel Plan
  const handleCancelPlan = async () => {
    if (!currentPlan) return;
    if (
      !window.confirm(
        'Are you sure you want to cancel this plan? This will completely wipe your plan, schedule, and discussions from the database so you can start a fresh plan.'
      )
    ) {
      return;
    }
    setIsActionLoading(true);
    try {
      await patientPlanApi.cancelPlan(currentPlan.id);
      setCurrentPlan(null);
      setCurrentGoal(null);
      setViewState('goal_setup');
    } catch (err) {
      alert(err.message || 'Failed to cancel plan.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler: Log Activity (Check-off)
  const handleLogActivity = async (payload) => {
    if (!currentPlan) return;
    const updatedPlan = await patientPlanApi.logActivity(currentPlan.id, payload);
    setCurrentPlan(updatedPlan);
  };

  // Handler: Send Chat Message
  const handleSendMessage = async (messageText) => {
    if (!currentPlan) return;
    await patientPlanApi.sendChatMessage(currentPlan.id, messageText);
    // Refresh plan to get latest discussions & proposed modifications
    const refreshed = await patientPlanApi.getPlanDetail(currentPlan.id);
    setCurrentPlan(refreshed);
  };

  // Handler: Apply Modification (Accept/Reject)
  const handleApplyModification = async (payload) => {
    if (!currentPlan) return;
    setIsActionLoading(true);
    try {
      const updated = await patientPlanApi.applyModification(currentPlan.id, payload);
      setCurrentPlan(updated);
    } catch (err) {
      alert(err.message || 'Failed to apply modification.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handler: Start New Goal
  const handleStartNewGoal = async () => {
    if (currentPlan) {
      if (
        window.confirm(
          'Each patient can only have one plan at a time. To start a new goal, your existing plan must be cancelled and wiped from the database. Would you like to cancel it and start fresh now?'
        )
      ) {
        setIsActionLoading(true);
        try {
          await patientPlanApi.cancelPlan(currentPlan.id);
          setCurrentPlan(null);
          setCurrentGoal(null);
          setViewState('goal_setup');
        } catch (err) {
          alert(err.message || 'Failed to cancel plan.');
        } finally {
          setIsActionLoading(false);
        }
      }
      return;
    }
    setCurrentPlan(null);
    setCurrentGoal(null);
    setViewState('goal_setup');
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <RefreshCw size={20} className="animate-spin" />
        <span>Loading AI Health & Wellness Plan...</span>
      </div>
    );
  }

  return (
    <div className="plan-maker-container">
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#b91c1c',
            fontSize: '0.9rem',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {viewState === 'goal_setup' && (
        <GoalSetupView
          onSubmit={handleCreateGoal}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
        />
      )}

      {viewState === 'questionnaire' && currentGoal && (
        <QuestionnaireView
          goal={currentGoal}
          onAnswerSubmitted={handleAnswerQuestion}
          onGeneratePlan={handleGeneratePlan}
          isGenerating={isGenerating}
        />
      )}

      {viewState === 'plan_detail' && currentPlan && (
        <PlanDetailView
          plan={currentPlan}
          onApprovePlan={handleApprovePlan}
          onPausePlan={handlePausePlan}
          onResumePlan={handleResumePlan}
          onCancelPlan={handleCancelPlan}
          onLogActivity={handleLogActivity}
          onSendMessage={handleSendMessage}
          onApplyModification={handleApplyModification}
          onStartNewGoal={handleStartNewGoal}
          isActionLoading={isActionLoading}
        />
      )}
    </div>
  );
}

export default PlanMaker;
