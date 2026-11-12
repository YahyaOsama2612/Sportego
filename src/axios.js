import axios from 'axios';
import { notify } from './context/ToastContext';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://sportego.org',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Robustly extract string error message from backend responses, including validation details
 */
const extractBackendErrorMessage = (error) => {
  const data = error.response?.data;
  if (!data) return error.message || 'Network request failed';

  // 1. Nested error object with validation details
  // { error: { code: 400, message: "Validation failed", details: [{ field: "body.status", message: "Expected boolean, received string" }] } }
  if (data.error && typeof data.error === 'object') {
    const errObj = data.error;
    if (Array.isArray(errObj.details) && errObj.details.length > 0) {
      const detailMsg = errObj.details[0]?.message;
      const field = errObj.details[0]?.field?.replace('body.', '');
      if (detailMsg) {
        return `${errObj.message || 'Validation failed'}: ${field ? `${field} - ` : ''}${detailMsg}`;
      }
    }
    if (errObj.message && typeof errObj.message === 'string') {
      return errObj.message;
    }
  }

  // 2. Direct string message: { message: "..." }
  if (data.message && typeof data.message === 'string') {
    return data.message;
  }

  // 3. Direct string error: { error: "..." }
  if (typeof data.error === 'string') {
    return data.error;
  }

  // 4. Validation error arrays: { errors: [{ message: "..." }] }
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    if (typeof first === 'string') return first;
    if (first && (first.message || first.msg)) return first.message || first.msg;
  }

  // 5. Plain text response
  if (typeof data === 'string' && data.length < 300) {
    return data;
  }

  return error.message || 'An unexpected error occurred';
};

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: automatically show toast with backend error
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const backendMessage = extractBackendErrorMessage(error);
    const isLoginRequest = error.config?.url?.includes('/login');

    // 1. If 401 on login attempt -> Invalid credentials toast
    if (error.response?.status === 401 && isLoginRequest) {
      notify({
        type: 'error',
        title: 'Sign In Failed',
        message: backendMessage,
      });
      return Promise.reject(error);
    }

    // 2. If 401 on protected route -> Session expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');

      notify({
        type: 'warning',
        title: 'Session Expired',
        message: backendMessage || 'Your session has expired. Please log in again.',
      });

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

    // 3. For all other backend errors, display error toast
    notify({
      type: 'error',
      title: 'Request Error',
      message: backendMessage,
    });

    return Promise.reject(error);
  }
);

export default api;
