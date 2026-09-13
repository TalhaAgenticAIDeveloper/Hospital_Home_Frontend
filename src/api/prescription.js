import { apiFetch } from './client';

export const prescriptionApi = {
  /**
   * Doctor creates a prescription for a consultation.
   * @param {{ meeting_id: string, notes?: string, medicines: Array }} data
   */
  createPrescription: (data) =>
    apiFetch('/api/v1/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Fetch prescription for a specific meeting.
   * @param {string} meetingId
   */
  getMeetingPrescription: (meetingId) =>
    apiFetch(`/api/v1/prescriptions/meeting/${meetingId}`),

  /**
   * Patient fetches all prescriptions issued to them.
   */
  getMyPrescriptions: () =>
    apiFetch('/api/v1/prescriptions/my'),
};
