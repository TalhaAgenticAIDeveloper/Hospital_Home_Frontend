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

  // ── OTP & Email Verification ─────────────────────────────────────────

  /**
   * Send OTP to email for signup verification or password reset.
   * @param {Object} params - { email: string, purpose: 'signup' | 'reset_password' }
   */
  sendOtp: ({ email, purpose }) =>
    apiFetch('/api/v1/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    }),

  /**
   * Verify OTP code.
   * @param {Object} params - { email: string, otp: string, purpose: 'signup' | 'reset_password' }
   */
  verifyOtp: ({ email, otp, purpose }) =>
    apiFetch('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }),
    }),

  // ── Password Reset ────────────────────────────────────────────────────

  /**
   * Request forgot-password OTP.
   * @param {Object} params - { email: string }
   */
  forgotPassword: ({ email }) =>
    apiFetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  /**
   * Reset password with OTP verification.
   * @param {Object} params - { email: string, otp: string, new_password: string }
   */
  resetPassword: ({ email, otp, new_password }) =>
    apiFetch('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password }),
    }),
};
