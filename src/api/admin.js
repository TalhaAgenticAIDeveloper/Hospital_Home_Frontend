import { apiFetch, API_BASE_URL, getStoredTokens } from './client';

export const adminApi = {
  /**
   * List all doctors with optional status filter and search query.
   */
  listDoctors: ({ status = 'all', search = '', skip = 0, limit = 50 } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('skip', skip);
    params.append('limit', limit);
    return apiFetch(`/api/v1/admin/doctors?${params.toString()}`);
  },

  /**
   * Delete a doctor account, profile, and documents.
   */
  deleteDoctor: (doctorUserId) =>
    apiFetch(`/api/v1/admin/doctors/${doctorUserId}`, {
      method: 'DELETE',
    }),

  /**
   * List pending doctor applications for review.
   */
  listPendingDoctors: (skip = 0, limit = 50) =>
    apiFetch(`/api/v1/admin/doctors/pending?skip=${skip}&limit=${limit}`),

  /**
   * View full doctor profile and uploaded documents.
   */
  getDoctorDetail: (doctorUserId) =>
    apiFetch(`/api/v1/admin/doctors/${doctorUserId}`),

  /**
   * Approve or reject doctor application with feedback reason.
   */
  reviewDoctor: (doctorUserId, { action, feedback }) =>
    apiFetch(`/api/v1/admin/doctors/${doctorUserId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, feedback }),
    }),

  /**
   * Get the URL to view a document inline in the browser (PDF/images).
   */
  getDocumentViewUrl: (documentId) => {
    const { accessToken } = getStoredTokens();
    return `${API_BASE_URL}/api/v1/admin/doctors/documents/${documentId}/download?inline=true&token=${accessToken}`;
  },

  /**
   * Get the URL to download a document as an attachment.
   */
  getDocumentDownloadUrl: (documentId) => {
    const { accessToken } = getStoredTokens();
    return `${API_BASE_URL}/api/v1/admin/doctors/documents/${documentId}/download?token=${accessToken}`;
  },
};
