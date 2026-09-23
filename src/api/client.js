/**
 * Centralized API Client with automatic JWT injection and transparent refresh token rotation.
 * Base URL is loaded from .env (VITE_API_BASE_URL or VITE_BASE_URL).
 */

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BASE_URL ||
  'http://localhost:8000';

// Remove trailing slash if present. If it was '/' or empty, use window.location.origin in browser
export const API_BASE_URL =
  !rawBaseUrl || rawBaseUrl === '/'
    ? (typeof window !== 'undefined' && window.location ? window.location.origin : '')
    : rawBaseUrl.replace(/\/+$/, '');

export const TOKEN_KEYS = {
  ACCESS: 'healthcare_access_token',
  REFRESH: 'healthcare_refresh_token',
  USER: 'healthcare_user',
};

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(TOKEN_KEYS.ACCESS),
    refreshToken: localStorage.getItem(TOKEN_KEYS.REFRESH),
  };
}

export function setStoredTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
  if (refreshToken) localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
}

/**
 * Clear all browser cookies across root and subdomain paths.
 */
export function clearAllCookies() {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
      if (typeof window !== 'undefined' && window.location) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname};`;
      }
    }
  }
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEYS.ACCESS);
  localStorage.removeItem(TOKEN_KEYS.REFRESH);
  localStorage.removeItem(TOKEN_KEYS.USER);
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
  clearAllCookies();
}

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Perform an authenticated API request with auto token refresh on 401.
 */
export async function apiFetch(endpoint, options = {}) {
  // Ensure endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${formattedEndpoint}`;
  const headers = new Headers(options.headers || {});

  // Append Bearer token if available
  const { accessToken } = getStoredTokens();
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Set default JSON headers unless sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchConfig = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, fetchConfig);
  } catch (networkError) {
    throw new Error('Network error. Please check your internet connection or server status.', { cause: networkError });
  }

  // Handle Token Expiry (401 Unauthorized) & Auto Refresh
  if (
    response.status === 401 &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh') &&
    !endpoint.includes('/auth/signup')
  ) {
    const { refreshToken } = getStoredTokens();

    if (!refreshToken) {
      clearStoredTokens();
      window.dispatchEvent(new Event('auth:unauthorized'));
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Session expired. Please log in again.');
    }

    if (isRefreshing) {
      // Queue requests while token refresh is pending
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          return fetch(url, { ...options, headers });
        })
        .then(handleResponse);
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh token invalid or expired');
      }

      const refreshData = await refreshRes.json();
      setStoredTokens(refreshData.access_token, refreshData.refresh_token);
      processQueue(null, refreshData.access_token);

      // Retry original request with fresh access token
      headers.set('Authorization', `Bearer ${refreshData.access_token}`);
      return await fetch(url, { ...options, headers }).then(handleResponse);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearStoredTokens();
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw new Error('Session expired. Please log in again.', { cause: refreshErr });
    } finally {
      isRefreshing = false;
    }
  }

  return handleResponse(response);
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail
          .map((d) => d.msg || d.message || JSON.stringify(d))
          .join(', ');
      } else if (data.message) {
        errorMessage = data.message;
      }
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
