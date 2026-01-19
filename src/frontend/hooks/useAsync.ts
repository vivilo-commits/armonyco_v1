import React, { useState, useCallback } from 'react';

type Status = 'idle' | 'pending' | 'success' | 'error';

interface State<T> {
  status: Status;
  data: T | null;
  error: string | null;
}

export const useAsync = <T>(asyncFunction: () => Promise<T>, immediate = true) => {
  const [state, setState] = useState<State<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  const execute = useCallback(() => {
    setState((prevState) => ({ ...prevState, status: 'pending', error: null }));
    return asyncFunction()
      .then((response) => {
        setState({ status: 'success', data: response, error: null });
      })
      .catch((error) => {
        setState((prevState) => ({
          status: 'error',
          data: prevState.data,
          error: error.message || 'Something went wrong'
        }));
      });
  }, [asyncFunction]);

  // Execute immediately if requested
  React.useEffect(() => {
    let cancelled = false;

    if (immediate) {
      execute().catch((err) => {
        if (!cancelled) console.error('Immediate execution failed:', err);
      });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return { ...state, execute };
};
