/**
 * Patient Health & Wellness Plan Maker API client.
 * Provides failure-safe API calls for goals, questionnaires, generation,
 * plan refinement chat, approval, and daily activity tracking.
 */

import { apiFetch } from './client';

export const patientPlanApi = {
  /**
   * Start a new health goal and seed questions.
   * @param {Object} payload - { title, category, target_description, timezone, target_duration_weeks }
   */
  createGoal: (payload) =>
    apiFetch('/api/v1/patient/plans/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Retrieve the current in-progress goal and questionnaire answers.
   */
  getCurrentGoal: () =>
    apiFetch('/api/v1/patient/plans/goals/current'),

  /**
   * Submit an answer to a specific questionnaire question.
   * @param {string} goalId - UUID of the goal
   * @param {Object} payload - { question_id, raw_input, is_skipped }
   */
  answerQuestion: (goalId, payload) =>
    apiFetch(`/api/v1/patient/plans/goals/${goalId}/answers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Trigger AI plan generation from completed questionnaire.
   * @param {string} goalId - UUID of the goal
   */
  generatePlan: (goalId) =>
    apiFetch(`/api/v1/patient/plans/goals/${goalId}/generate`, {
      method: 'POST',
    }),

  /**
   * Get current active plan and today's schedule for dashboard.
   */
  getActivePlan: () =>
    apiFetch('/api/v1/patient/plans/active'),

  /**
   * List all historical and current plans for the patient.
   */
  listPlans: () =>
    apiFetch('/api/v1/patient/plans'),

  /**
   * Get full details, schedule items, and discussions for a plan.
   * @param {string} planId - UUID of the plan
   */
  getPlanDetail: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}`),

  /**
   * Send a message to the AI plan discussion assistant.
   * @param {string} planId - UUID of the plan
   * @param {string} message - User query or modification request
   */
  sendChatMessage: (planId, message) =>
    apiFetch(`/api/v1/patient/plans/${planId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  /**
   * Accept or decline a proposed modification with optimistic concurrency locking.
   * @param {string} planId - UUID of the plan
   * @param {Object} payload - { action: 'accept'|'reject', expected_version: number }
   */
  applyModification: (planId, payload) =>
    apiFetch(`/api/v1/patient/plans/${planId}/modifications/apply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Approve and start plan (sets status ACTIVE and configures reminders).
   * @param {string} planId - UUID of the plan
   */
  approvePlan: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}/approve`, {
      method: 'POST',
    }),

  /**
   * Pause an active plan (stops upcoming reminders).
   * @param {string} planId - UUID of the plan
   */
  pausePlan: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}/pause`, {
      method: 'POST',
    }),

  /**
   * Resume a paused plan.
   * @param {string} planId - UUID of the plan
   */
  resumePlan: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}/resume`, {
      method: 'POST',
    }),

  /**
   * Cancel a plan (retains historical data).
   * @param {string} planId - UUID of the plan
   */
  cancelPlan: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}/cancel`, {
      method: 'POST',
    }),

  /**
   * Log daily completion for a scheduled activity item.
   * @param {string} planId - UUID of the plan
   * @param {Object} payload - { item_id, log_date, status, notes }
   */
  logActivity: (planId, payload) =>
    apiFetch(`/api/v1/patient/plans/${planId}/log`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
