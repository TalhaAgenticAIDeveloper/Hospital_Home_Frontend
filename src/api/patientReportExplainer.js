/**
 * Patient AI Medical Report Explainer API client.
 * Provides methods for report upload, session listing, chat interaction, and session management.
 */

import { apiFetch } from './client';

export const patientReportExplainerApi = {
  /**
   * Upload and analyze a medical report (PDF, PNG, JPG, JPEG).
   * @param {File} file - The medical report file
   * @returns {Promise<Object>} Upload and explanation response with session_id
   */
  uploadReport: (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiFetch('/api/v1/patient/reports/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * List all previous report explainer sessions for the patient.
   * @returns {Promise<Array>} Array of session summaries
   */
  listSessions: () => apiFetch('/api/v1/patient/reports/sessions'),

  /**
   * Get full details and message history of a report session.
   * @param {string} sessionId - UUID of the session
   * @returns {Promise<Object>} Session details with report_explanation and messages
   */
  getSessionDetail: (sessionId) =>
    apiFetch(`/api/v1/patient/reports/sessions/${sessionId}`),

  /**
   * Send a follow-up question to the AI assistant for an active report session.
   * @param {string} sessionId - UUID of the session
   * @param {string} message - User follow-up question
   * @returns {Promise<Object>} AI reply and updated conversation messages
   */
  sendChatMessage: (sessionId, message) =>
    apiFetch(`/api/v1/patient/reports/sessions/${sessionId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  /**
   * Delete a report session and its conversation history.
   * @param {string} sessionId - UUID of the session
   * @returns {Promise<Object>} Success message
   */
  deleteSession: (sessionId) =>
    apiFetch(`/api/v1/patient/reports/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
};
