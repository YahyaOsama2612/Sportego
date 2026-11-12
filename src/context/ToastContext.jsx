
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ToastContainer from '../components/shared/ToastContainer';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Smooth dismissal with exit animation
  const dismissToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );

    // Wait for the exit animation transition (300ms) before unmounting
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 320);
  }, []);

  const showToast = useCallback(
    ({ type = 'info', message, title, duration = 4000 }) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      const newToast = { id, type, message, title, isEntering: true };

      setToasts((prev) => [...prev, newToast]);

      // Remove entering flag right after render to trigger CSS transition
      requestAnimationFrame(() => {
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isEntering: false } : t))
          );
        }, 30);
      });

      // Auto dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const showError = useCallback(
    (message, title = 'Error') => showToast({ type: 'error', message, title }),
    [showToast]
  );

  const showSuccess = useCallback(
    (message, title = 'Success') => showToast({ type: 'success', message, title }),
    [showToast]
  );

  const showWarning = useCallback(
    (message, title = 'Warning') => showToast({ type: 'warning', message, title }),
    [showToast]
  );

  const showInfo = useCallback(
    (message, title = 'Notice') => showToast({ type: 'info', message, title }),
    [showToast]
  );

  // Global window event listener to catch axios or system errors anywhere
  useEffect(() => {
    const handleGlobalNotify = (e) => {
      const detail = e.detail;
      if (detail && detail.message) {
        showToast(detail);
      }
    };

    window.addEventListener('app:notify', handleGlobalNotify);
    return () => {
      window.removeEventListener('app:notify', handleGlobalNotify);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        dismissToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Global helper to trigger toast from outside React tree (e.g. axios interceptor)
export const notify = (options) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:notify', { detail: options }));
  }
};

export default ToastContext;
