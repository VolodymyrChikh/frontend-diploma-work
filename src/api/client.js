import axios from 'axios';
import { getStoredToken } from '../auth/storage.js';

const DEFAULT_API_BASE_URL = '';

export function normalizeApiBaseUrl(baseUrl = DEFAULT_API_BASE_URL) {
  return String(baseUrl ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env?.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
);

export function buildApiUrl(path, baseUrl = API_BASE_URL) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
  const normalizedPath = String(path).startsWith('/') ? path : `/${path}`;
  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export function getAuthToken() {
  return getStoredToken();
}

export function createAuthHeaders(tokenProvider = getAuthToken, { skipAuth = false } = {}) {
  if (skipAuth) {
    return {};
  }

  const token = tokenProvider();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const { headers, skipAuth = false, ...restOptions } = options;

  return fetch(buildApiUrl(path), {
    ...restOptions,
    headers: {
      ...createAuthHeaders(getAuthToken, { skipAuth }),
      ...headers,
    },
  });
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function jsonRequestOptions(method, body, options = {}) {
  return {
    ...options,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  };
}

export function apiGet(path, options) {
  return apiJson(path, { ...options, method: 'GET' });
}

export function apiPost(path, body, options) {
  return apiJson(path, jsonRequestOptions('POST', body, options));
}

export function apiPut(path, body, options) {
  return apiJson(path, jsonRequestOptions('PUT', body, options));
}

export async function apiDelete(path, options = {}) {
  return apiFetch(path, { ...options, method: 'DELETE' });
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = config.skipAuth ? null : getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  delete config.skipAuth;
  return config;
});
