import React from 'react';
import { TOKENS } from './tokens';
import { AppEmptyState } from './AppEmptyState';

interface AppPageProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  error?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onRefresh?: () => Promise<void>;
}

export const AppPage: React.FC<AppPageProps> = ({
  title,
  subtitle,
  actions,
  children,
  loading,
  empty,
  emptyMessage = 'No data available.',
  error,
  errorMessage = 'Something went wrong. Please try again.',
  onRetry,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pt-4 pb-8 px-6 md:px-8 lg:px-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-6">
        <div className="space-y-2">
          <h1 className={TOKENS.typography.title}>{title}</h1>
          {subtitle && <p className={TOKENS.typography.body}>{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-600 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center gap-2 border border-stone-200"
            >
              <svg
                className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Syncing...' : 'Refresh Operations'}
            </button>
          )}
          {actions}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-700">
            <div className="relative w-12 h-12">
              <svg className="animate-spin w-full h-full text-stone-200" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full gold-gradient shadow-gold-glow animate-pulse" />
              </div>
            </div>
            <div className="text-stone-400 font-bold tracking-[0.3em] text-[10px] uppercase">
              Orchestrating Truth...
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-16 rounded-[2.5rem] border border-red-200 text-center shadow-card">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
                <div className="text-red-500 text-xs font-bold">!</div>
              </div>
            </div>
            <p className="text-stone-700 font-medium mb-4">{errorMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-800 transition-all"
              >
                Try Again
              </button>
            )}
          </div>
        ) : empty ? (
          <AppEmptyState
            title={emptyMessage !== 'No data available.' ? emptyMessage : 'No Data Detected'}
            description="The governing intelligence is active, but no operational records were found for this segment."
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
};
