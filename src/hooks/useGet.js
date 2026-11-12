import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../axios';

/**
 * Custom hook for HTTP GET requests with stable dependencies
 * @param {string} url - API endpoint
 * @param {object} options - Options { immediate = true, params = {}, config = {}, onSuccess, onError }
 */
const useGet = (url, options = {}) => {
  const { immediate = true, params, config, onSuccess, onError } = options;

  // Keep latest options in ref to avoid recreating execute on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Stringify params to avoid reference change triggering infinite re-renders
  const paramsKey = JSON.stringify(params || {});

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate && !!url);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (customParams, customConfig = {}) => {
      if (!url) return null;

      setLoading(true);
      setError(null);

      const opts = optionsRef.current || {};
      const finalParams = customParams !== undefined ? customParams : opts.params;
      const finalConfig = { ...opts.config, ...customConfig };

      try {
        const response = await api.get(url, {
          ...finalConfig,
          params: finalParams,
        });

        setData(response.data);
        if (opts.onSuccess) opts.onSuccess(response.data);
        return response.data;
      } catch (err) {
        const parsedError =
          err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          'Something went wrong';
        setError(parsedError);
        if (opts.onError) opts.onError(parsedError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url] // Stable: does not change on object reference recreations
  );

  useEffect(() => {
    let isMounted = true;
    if (immediate && url) {
      execute().catch((err) => {
        if (isMounted) console.warn('useGet fetch caught gracefully:', err);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [url, immediate, paramsKey, execute]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    execute,
    setData,
  };
};

export default useGet;
