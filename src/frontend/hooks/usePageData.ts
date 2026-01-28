import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/backend/api';

// Timeout for API calls - prevents infinite loading
const API_TIMEOUT_MS = 30000; // 30 seconds

export function usePageData<T>(apiCall: () => Promise<T>, ready: boolean = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const apiCallRef = useRef(apiCall);
  const readyRef = useRef(ready);

  // Update refs when values change
  useEffect(() => {
    apiCallRef.current = apiCall;
  }, [apiCall]);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);

    // Create timeout promise that resolves (not rejects) with error tuple
    const timeoutPromise = new Promise<[null, Error]>((resolve) => {
      setTimeout(() => resolve([null, new Error('Request timeout')]), API_TIMEOUT_MS);
    });

    try {
      // Race between API call and timeout
      const result = await Promise.race([
        api.collect(apiCallRef.current()),
        timeoutPromise,
      ]);

      const [res, err] = result as [T | null, Error | null];

      if (err) {
        console.warn('[usePageData] Error:', err.message);
        setError(true);
        setData(null);
      } else {
        setData(res);
      }
    } catch (e) {
      console.warn('[usePageData] Exception:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when ready becomes true
  useEffect(() => {
    if (ready) {
      console.log('[usePageData] ✅ Ready, fetching data...');
      void fetchData();
    } else {
      console.log('[usePageData] ⏳ Waiting for ready state...');
      // Keep loading true while waiting
      setLoading(true);
    }
  }, [ready, fetchData]);

  return { data, loading, error, retry: fetchData };
}
