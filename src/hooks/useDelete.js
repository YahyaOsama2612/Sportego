import { useState, useCallback } from 'react';
import api from '../axios';

/**
 * Custom hook for HTTP DELETE requests
 * @param {string} url - Default API endpoint
 * @param {object} defaultOptions - Options { config = {}, onSuccess, onError }
 */
const useDelete = (url = '', defaultOptions = {}) => {
  const { config: defaultConfig = {}, onSuccess, onError } = defaultOptions;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (customUrlOrConfig = {}, optionalConfig = {}) => {
      setLoading(true);
      setError(null);

      let targetUrl = url;
      let finalConfig = { ...defaultConfig };

      if (typeof customUrlOrConfig === 'string') {
        targetUrl = customUrlOrConfig;
        finalConfig = { ...finalConfig, ...optionalConfig };
      } else if (typeof customUrlOrConfig === 'object') {
        finalConfig = { ...finalConfig, ...customUrlOrConfig };
      }

      try {
        const response = await api.delete(targetUrl, finalConfig);
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

export default useDelete;
