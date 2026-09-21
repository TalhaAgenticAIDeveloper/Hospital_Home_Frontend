/**
 * Patient Health & Wellness Plan Maker API client.
 * Provides methods for goal creation, questionnaire processing,
 * plan generation, refinement chat, modification approvals,
 * daily tracking, and standalone nutrition information queries.
 */

import { apiFetch } from './client';

export const patientPlanApi = {
  /**
   * Start a new health and wellness goal.
   * @param {Object} data - Goal payload: { title, category, target_description, target_duration_weeks, timezone }
   * @returns {Promise<Object>} Created goal detail and questionnaire state
   */
  createGoal: (data) =>
    apiFetch('/api/v1/patient/plans/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get patient's current in-progress goal and questionnaire state.
   * @returns {Promise<Object|null>} Current goal or null
   */
  getCurrentGoal: () => apiFetch('/api/v1/patient/plans/goals/current'),

  /**
   * Submit or refine an answer to a specific questionnaire question.
   * @param {string} goalId - UUID of the goal
   * @param {Object} data - Answer payload: { question_key, raw_answer }
   * @returns {Promise<Object>} Question validation result and normalized value
   */
  answerQuestion: (goalId, data) =>
    apiFetch(`/api/v1/patient/plans/goals/${goalId}/answers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Generate a personalized wellness plan from the completed questionnaire.
   * Includes nutritional breakdowns (calories, macros) and daily summaries.
   * @param {string} goalId - UUID of the goal
   * @returns {Promise<Object>} Generated plan details with schedule items
   */
  generatePlan: (goalId) =>
    apiFetch(`/api/v1/patient/plans/goals/${goalId}/generate`, {
      method: 'POST',
    }),

  /**
   * Ask a nutrition, food, or exercise information question (standalone agent).
   * Supports English, Urdu, and Roman Urdu queries.
   * @param {string} message - The question (e.g. 'banana mein kitni calories hain?')
   * @param {string|null} [planId=null] - Optional plan ID for conversational context
   * @returns {Promise<Object>} Nutritional breakdown and natural language answer
   */
  askNutritionInfo: (message, planId = null) =>
    apiFetch('/api/v1/patient/plans/nutrition-info', {
      method: 'POST',
      body: JSON.stringify({
        message,
        plan_id: planId,
      }),
    }),

  /**
   * Get patient's current active plan and today's schedule.
   * @returns {Promise<Object|null>} Active plan details or null
   */
  getActivePlan: () => apiFetch('/api/v1/patient/plans/active'),

  /**
   * List all historical and current wellness plans for the patient.
   * @returns {Promise<Array>} List of plan summaries
   */
  listPlans: () => apiFetch('/api/v1/patient/plans'),

  /**
   * Get full details for a specific plan, including items, discussions, and nutrition summary.
   * @param {string} planId - UUID of the plan
   * @returns {Promise<Object>} Full plan detail response
   */
  getPlanDetail: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}`),

  /**
   * Send a chat message or modification request to the AI plan assistant.
   * Automatically routes nutrition questions vs. plan changes seamlessly.
   * @param {string} planId - UUID of the plan
   * @param {string} message - User message
   * @returns {Promise<Object>} Assistant reply with any proposed modifications
   */
  sendChatMessage: (planId, message) =>
    apiFetch(`/api/v1/patient/plans/${planId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  /**
   * Explicitly accept or reject a pending plan modification.
   * @param {string} planId - UUID of the plan
   * @param {Object} data - { action: 'accept'|'reject', expected_version: number, modification?: Object }
   * @returns {Promise<Object>} Updated plan detail
   */
  applyModification: (planId, data) =>
    apiFetch(`/api/v1/patient/plans/${planId}/modifications/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Approve and activate a plan, initiating daily reminder schedules.
   * @param {string} planId - UUID of the plan
   * @returns {Promise<Object>} Activated plan detail
   */
  approvePlan: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}/approve`, {
      method: 'POST',
    }),

  /**
   * Pause an active plan (temporarily suspends scheduled reminders).
   * @param {string} planId - UUID of the plan
   * @returns {Promise<Object>} Paused plan detail
   */
  pausePlan: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}/pause`, {
      method: 'POST',
    }),

  /**
   * Resume a paused plan.
   * @param {string} planId - UUID of the plan
   * @returns {Promise<Object>} Resumed plan detail
   */
  resumePlan: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}/resume`, {
      method: 'POST',
    }),

  /**
   * Cancel an active or draft plan.
   * @param {string} planId - UUID of the plan
   * @returns {Promise<Object>} Cancelled plan detail
   */
  cancelPlan: (planId) =>
    apiFetch(`/api/v1/patient/plans/${planId}/cancel`, {
      method: 'POST',
    }),

  /**
   * Log daily completion status for a scheduled activity item.
   * @param {string} planId - UUID of the plan
   * @param {Object} data - { item_id: string, log_date: 'YYYY-MM-DD', status: 'completed'|'skipped', notes?: string }
   * @returns {Promise<Object>} Updated plan detail with refreshed logs
   */
  logActivity: (planId, data) =>
    apiFetch(`/api/v1/patient/plans/${planId}/log`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default patientPlanApi;
