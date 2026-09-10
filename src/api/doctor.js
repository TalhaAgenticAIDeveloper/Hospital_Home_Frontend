import { apiFetch } from './client';

export const doctorApi = {
  /**
   * Get doctor profile and verification status.
   */
  getProfile: () => apiFetch('/api/v1/doctors/profile'),

  /**
   * Update professional & PMDC verification details.
   */
  updateProfile: (profileData) =>
    apiFetch('/api/v1/doctors/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  /**
   * Submit application for SaaS Admin review.
   */
  submitApplication: () =>
    apiFetch('/api/v1/doctors/submit-application', {
      method: 'POST',
    }),

  /**
   * Check quick application status.
   */
  getStatus: () => apiFetch('/api/v1/doctors/status'),
};
