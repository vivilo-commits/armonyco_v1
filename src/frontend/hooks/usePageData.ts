import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/backend/api';

// Timeout for API calls - prevents infinite loading
const API_TIMEOUT_MS = 45000; // 45 seconds (increased to allow for auth retry)

/**
 * Simplified data fetching hook that relies on API singleton for auth gating.
 * The API methods handle ensureOrganizationId internally, so we don't need
 * a separate React state check here.
 */
export function usePageData<T>(apiCall: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const apiCallRef = useRef(apiCall);
  const mountedRef = useRef(true);

  // Update ref when apiCall changes
  useEffect(() => {
    apiCallRef.current = apiCall;
  }, [apiCall]);

  // Track mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    console.log('[usePageData] 🔄 Fetching data...');
    setLoading(true);
    setError(false);

    // Create timeout promise
    const timeoutPromise = new Promise<[null, Error]>((resolve) => {
      setTimeout(() => resolve([null, new Error('Request timeout')]), API_TIMEOUT_MS);
    });

    try {
      // Race between API call and timeout
      const result = await Promise.race([
        api.collect(apiCallRef.current()),
        timeoutPromise,
      ]);

      if (!mountedRef.current) return;

      const [res, err] = result as [T | null, Error | null];

      if (err) {
        console.warn('[usePageData] ❌ Error:', err.message);
        setError(true);
        setData(null);
      } else {
        console.log('[usePageData] ✅ Data received');
        setData(res);
      }
    } catch (e) {
      if (!mountedRef.current) return;
      console.warn('[usePageData] ❌ Exception:', e);
      setError(true);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, retry: fetchData };
}
