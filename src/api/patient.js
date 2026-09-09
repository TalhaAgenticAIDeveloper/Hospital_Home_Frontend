import { apiFetch } from './client';

export const patientApi = {
  /**
   * Get patient profile.
   */
  getProfile: () => apiFetch('/api/v1/patient/profile'),

  /**
   * Update patient personal and baseline health details.
   */
  updateProfile: (profileData) =>
    apiFetch('/api/v1/patient/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};
