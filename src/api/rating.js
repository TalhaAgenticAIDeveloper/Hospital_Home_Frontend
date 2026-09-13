import { apiFetch } from './client';

export const ratingApi = {
  /**
   * Submit patient rating and optional feedback for a completed meeting.
   * @param {string} meetingId - Meeting UUID
   * @param {{ rating: number, feedback_text?: string }} data
   */
  submitRating: (meetingId, data) =>
    apiFetch(`/api/v1/ratings/${meetingId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Retrieve rating for a specific meeting.
   * @param {string} meetingId - Meeting UUID
   */
  getMeetingRating: (meetingId) =>
    apiFetch(`/api/v1/ratings/${meetingId}`),
};
