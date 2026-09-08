/**
 * Patient Medical Documents API client.
 *
 * Provides methods for uploading, listing, deleting, and downloading
 * patient medical history documents.
 */

import { apiFetch, API_BASE_URL, getStoredTokens } from './client';

export const patientDocumentsApi = {
  /**
   * Upload a new medical document.
   * @param {File} file - The file to upload
   * @param {string|null} label - Optional user-friendly label
   * @returns {Promise<Object>} The uploaded document metadata
   */
  uploadDocument: (file, label = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (label && label.trim()) {
      formData.append('label', label.trim());
    }

    return apiFetch('/api/v1/patient/documents', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type — browser sets it with boundary for FormData
    });
  },

  /**
   * List all uploaded medical documents for the authenticated patient.
   * @returns {Promise<Array>} Array of document metadata objects
   */
  listDocuments: () => apiFetch('/api/v1/patient/documents'),

  /**
   * Delete an uploaded medical document.
   * @param {string} documentId - UUID of the document to delete
   * @returns {Promise<Object>} Success message
   */
  deleteDocument: (documentId) =>
    apiFetch(`/api/v1/patient/documents/${documentId}`, {
      method: 'DELETE',
    }),

  /**
   * Download a medical document file.
   * Triggers a browser download of the file.
   * @param {string} documentId - UUID of the document to download
   * @param {string} filename - Original filename for the download
   */
  downloadDocument: async (documentId, filename = 'document') => {
    const { accessToken } = getStoredTokens();
    const url = `${API_BASE_URL}/api/v1/patient/documents/${documentId}/download`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to download document.');
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
   * Get the direct download URL for a document (for inline viewing).
   * @param {string} documentId - UUID of the document
   * @returns {string} The download URL
   */
  getDocumentDownloadUrl: (documentId) =>
    `${API_BASE_URL}/api/v1/patient/documents/${documentId}/download`,
};
