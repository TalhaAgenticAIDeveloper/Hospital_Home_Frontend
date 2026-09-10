import { apiFetch, API_BASE_URL, getStoredTokens } from './client';

export const meetingApi = {
  // ── Doctor Availability ───────────────────────────────────────────────────

  /**
   * Generate batch slots for a given date and time window.
   */
  createAvailabilityBatch: (data) =>
    apiFetch('/api/v1/meetings/availability/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Create a single availability slot.
   */
  createAvailabilitySlot: (data) =>
    apiFetch('/api/v1/meetings/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * List availability slots for logged in doctor.
   */
  getMyAvailability: (futureOnly = true) =>
    apiFetch(`/api/v1/meetings/availability?future_only=${futureOnly}`),

  /**
   * Delete an unbooked availability slot.
   */
  deleteAvailabilitySlot: (slotId) =>
    apiFetch(`/api/v1/meetings/availability/${slotId}`, {
      method: 'DELETE',
    }),

  // ── Weekly Schedule ─────────────────────────────────────────────────────

  /**
   * Save or update the doctor's weekly availability template.
   */
  saveWeeklySchedule: (data) =>
    apiFetch('/api/v1/meetings/weekly-schedule', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Fetch the doctor's current weekly schedule template.
   */
  getWeeklySchedule: () =>
    apiFetch('/api/v1/meetings/weekly-schedule'),

  /**
   * Generate bookable slots from the saved weekly schedule template.
   */
  generateSlotsFromSchedule: (data) =>
    apiFetch('/api/v1/meetings/weekly-schedule/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Doctor Directory & Open Slots (Patient View) ──────────────────────────

  /**
   * List verified active doctors for consultation.
   */
  getDoctors: () => apiFetch('/api/v1/meetings/doctors'),

  /**
   * Get available future slots for a specific doctor.
   */
  getDoctorSlots: (doctorId) =>
    apiFetch(`/api/v1/meetings/doctors/${doctorId}/slots`),

  // ── Meeting Booking & Details ─────────────────────────────────────────────

  /**
   * Book a consultation meeting.
   */
  bookMeeting: (bookingData) =>
    apiFetch('/api/v1/meetings/book', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  /**
   * List consultations for current user (doctor or patient).
   */
  getMyMeetings: (statusFilter = null) => {
    const url = statusFilter
      ? `/api/v1/meetings/my-meetings?status_filter=${statusFilter}`
      : '/api/v1/meetings/my-meetings';
    return apiFetch(url);
  },

  /**
   * Get meeting details by ID or room code.
   */
  getMeetingDetails: (meetingIdOrRoom) =>
    apiFetch(`/api/v1/meetings/${meetingIdOrRoom}`),

  // ── Meeting Completion ───────────────────────────────────────────────────

  /**
   * End a consultation meeting and record optional doctor clinical notes.
   */
  endMeeting: (meetingId, data = {}) =>
    apiFetch(`/api/v1/meetings/${meetingId}/end`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Legacy alias for ending meeting.
   */
  endMeetingAndSaveTranscript: (meetingId, data) =>
    meetingApi.endMeeting(meetingId, data),

  // ── Meeting Patient Documents (Doctor & Patient Access) ────────────────

  /**
   * List patient documents attached to a specific meeting.
   * Accessible by the consulting doctor, the patient, or admin.
   */
  getMeetingPatientDocuments: (meetingId) =>
    apiFetch(`/api/v1/meetings/${meetingId}/patient-documents`),

  /**
   * Download a patient document attached to a meeting.
   * Triggers a browser download of the file.
   */
  downloadMeetingPatientDocument: async (meetingId, documentId, filename = 'document') => {
    const { accessToken } = getStoredTokens();
    const url = `${API_BASE_URL}/api/v1/meetings/${meetingId}/patient-documents/${documentId}/download`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to download patient document.');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },

  /**
   * Fetch a patient document attached to a meeting as a blob URL for in-browser viewing.
   */
  getMeetingPatientDocumentBlobUrl: async (meetingId, documentId) => {
    const { accessToken } = getStoredTokens();
    const url = `${API_BASE_URL}/api/v1/meetings/${meetingId}/patient-documents/${documentId}/download?inline=true`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to load patient document for viewing.');
    }

    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  },

  /**
   * Request Groq LLM clinical summarization of an attached patient document.
   */
  summarizeMeetingPatientDocument: (meetingId, documentId, forceRefresh = true) =>
    apiFetch(`/api/v1/meetings/${meetingId}/patient-documents/${documentId}/summarize?force_refresh=${forceRefresh}`, {
      method: 'POST',
    }),
};
