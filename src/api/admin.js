import { apiFetch } from './client';

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
   * Delete a doctor account and profile.
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
   * View full doctor profile and PMDC registration details.
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
   * List all registered patients with optional search query and pagination.
   */
  listPatients: ({ search = '', skip = 0, limit = 50 } = {}) => {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    params.append('skip', skip);
    params.append('limit', limit);
    return apiFetch(`/api/v1/admin/patients?${params.toString()}`);
  },

  /**
   * Permanently delete a patient user account, cascade records, and clean files.
   */
  deletePatient: (patientUserId) =>
    apiFetch(`/api/v1/admin/patients/${patientUserId}`, {
      method: 'DELETE',
    }),
};

