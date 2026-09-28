import { apiFetch, API_BASE_URL, getStoredTokens } from './client';

export const consultationAiApi = {
  /**
   * Upload audio recording for a consultation meeting.
   * @param {string} meetingId
   * @param {Blob} audioBlob - Audio blob from MediaRecorder
   * @param {string} filename - e.g., "doctor.webm"
   */
  uploadAudio: async (meetingId, audioBlob, filename = 'audio.webm') => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, filename);

    return apiFetch(`/api/v1/meetings/${meetingId}/upload-audio`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Save live transcript captured during video call and trigger AI summary.
   * @param {string} meetingId
   * @param {{ segments: Array, full_text?: string, doctor_notes?: string }} data
   */
  saveLiveTranscript: (meetingId, data) =>
    apiFetch(`/api/v1/consultation-ai/${meetingId}/live-transcript`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Start transcription of uploaded audio files.
   * @param {string} meetingId
   */
  startTranscription: (meetingId) =>
    apiFetch(`/api/v1/consultation-ai/${meetingId}/transcribe`, {
      method: 'POST',
    }),

  /**
   * Get the structured transcript for a meeting.
   * @param {string} meetingId
   */
  getTranscript: (meetingId) =>
    apiFetch(`/api/v1/consultation-ai/${meetingId}/transcript`),

  /**
   * Start AI extraction from the transcript.
   * @param {string} meetingId
   */
  startExtraction: (meetingId) =>
    apiFetch(`/api/v1/consultation-ai/${meetingId}/extract`, {
      method: 'POST',
    }),

  /**
   * Get extraction data (latest or specific version).
   * @param {string} meetingId
   * @param {number|null} version
   */
  getExtraction: (meetingId, version = null) => {
    const url = version
      ? `/api/v1/consultation-ai/${meetingId}/extraction?version=${version}`
      : `/api/v1/consultation-ai/${meetingId}/extraction`;
    return apiFetch(url);
  },

  /**
   * List all extraction versions for a meeting.
   * @param {string} meetingId
   */
  getExtractionVersions: (meetingId) =>
    apiFetch(`/api/v1/consultation-ai/${meetingId}/extraction/versions`),

  /**
   * Approve extraction and create prescription.
   * @param {string} meetingId
   * @param {{ edited_extraction: object, notes?: string }} data
   */
  approveExtraction: (meetingId, data) =>
    apiFetch(`/api/v1/consultation-ai/${meetingId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get combined transcription + extraction status.
   * @param {string} meetingId
   */
  getStatus: (meetingId) =>
    apiFetch(`/api/v1/consultation-ai/${meetingId}/status`),
};
