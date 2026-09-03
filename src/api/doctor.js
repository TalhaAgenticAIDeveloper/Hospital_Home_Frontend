import { apiFetch } from './client';

export const doctorApi = {
  /**
   * Get doctor profile and uploaded documents.
   */
  getProfile: () => apiFetch('/api/v1/doctors/profile'),

  /**
   * Update professional details.
   */
  updateProfile: (profileData) =>
    apiFetch('/api/v1/doctors/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  /**
   * Upload a verification document.
   */
  uploadDocument: (file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    return apiFetch('/api/v1/doctors/documents', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * List all documents uploaded by doctor.
   */
  listDocuments: () => apiFetch('/api/v1/doctors/documents'),

  /**
   * Delete an uploaded document.
   */
  deleteDocument: (documentId) =>
    apiFetch(`/api/v1/doctors/documents/${documentId}`, {
      method: 'DELETE',
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
