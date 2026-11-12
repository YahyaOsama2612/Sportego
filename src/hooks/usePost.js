import { useState, useCallback } from 'react';
import api from '../axios';

/**
 * Custom hook for HTTP POST requests
 * @param {string} url - Default API endpoint (optional, can also be passed to execute)
 * @param {object} defaultOptions - Options { config = {}, onSuccess, onError }
 */
const usePost = (url = '', defaultOptions = {}) => {
  const { config: defaultConfig = {}, onSuccess, onError } = defaultOptions;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (payload, customConfig = {}, customUrl = url) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.post(customUrl, payload, {
          ...defaultConfig,
          ...customConfig,
        });

        setData(response.data);
        if (onSuccess) onSuccess(response.data);
        return response.data;
      } catch (err) {
        const parsedError = err?.response?.data || err?.message || 'Something went wrong';
        setError(parsedError);
        if (onError) onError(parsedError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, defaultConfig, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

export default usePost;

