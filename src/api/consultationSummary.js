import { apiFetch } from './client';

export const consultationSummaryApi = {
  /**
   * Get the patient's own consultation visit history (paginated).
   * @param {number} limit
   * @param {number} offset
   */
  getMyHistory: (limit = 50, offset = 0) =>
    apiFetch(`/api/v1/consultation-summaries/my-history?limit=${limit}&offset=${offset}`),

  /**
   * Doctor views a patient's full consultation history.
   * @param {string} patientId
   */
  getPatientHistory: (patientId) =>
    apiFetch(`/api/v1/consultation-summaries/patient/${patientId}/history`),

  /**
   * Get consultation summary for a specific meeting.
   * @param {string} meetingId
   */
  getMeetingSummary: (meetingId) =>
    apiFetch(`/api/v1/consultation-summaries/meeting/${meetingId}`),
};
