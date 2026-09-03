import { apiFetch } from './client';

export const authApi = {
  /**
   * Register a new patient or doctor.
   */
  signup: ({ email, password, role }) =>
    apiFetch('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    }),

  /**
   * Unified login for patient and doctor.
   */
  login: ({ email, password }) =>
    apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /**
   * SaaS Admin portal login.
   */
  adminLogin: ({ email, password }) =>
    apiFetch('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /**
   * Revoke refresh token (Logout).
   */
  logout: (refreshToken) =>
    apiFetch('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  /**
   * Get current authenticated user profile and doctor application status.
   */
  getMe: () => apiFetch('/api/v1/auth/me'),

  /**
   * Liveness & Readiness checks.
   */
  checkHealth: () => apiFetch('/health'),
  checkReady: () => apiFetch('/health/ready'),
};
