import React from 'react';
import { Activity, Shield } from 'lucide-react';

import {
  AppPage,
  AppCard,
  AppBadge,
  AppTable,
  AppTableRow,
  AppTableCell,
  AppSection,
  AppKPICard,
  AppEmptyState,
  AppButton,
} from '@/frontend/components/design-system';

import { api } from '@/backend/api';
import { usePageData } from '@/frontend/hooks/usePageData';
import { ExecutionEvent, KPI } from '@/backend/types';
import { getStatusVariant } from '@/backend/utils';

import { ExecutionDetailModal } from '@/frontend/components/modals/ExecutionDetailModal';
import { ConfigurePMSModal } from '@/frontend/components/modals/ConfigurePMSModal';
import { GovernanceAuditModal } from '@/frontend/components/modals/GovernanceAuditModal';
import { Building2 } from 'lucide-react';
import { KPIExplanationModal } from '@/frontend/components/modals/KPIExplanationModal';

const INITIAL_VISIBLE_COUNT = 20;
const LOAD_MORE_COUNT = 20;

export const Dashboard: React.FC<{ searchTerm?: string }> = ({ searchTerm }) => {
  const [period, setPeriod] = React.useState('all');
  const [customStart, setCustomStart] = React.useState('');
  const [customEnd, setCustomEnd] = React.useState('');

  // Infinite scroll state
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE_COUNT);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const dateRange = React.useMemo(() => {
    if (period === 'all') return { start: undefined, end: undefined };
    if (period === 'custom') {
      return {
        start: customStart ? new Date(customStart + 'T00:00:00').toISOString() : undefined,
        end: customEnd ? new Date(customEnd + 'T23:59:59').toISOString() : undefined
      };
    }
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (period === '7d') start.setDate(end.getDate() - 7);
    if (period === '30d') start.setDate(end.getDate() - 30);

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }, [period, customStart, customEnd]);

  const { data, loading, error, retry } = usePageData(
    () => api.getDashboardData(dateRange.start, dateRange.end)
  );

  // Refetch when period changes
  React.useEffect(() => {
    retry();
  }, [period, retry]);

  const [selectedEvent, setSelectedEvent] = React.useState<ExecutionEvent | null>(null);
  const [isPMSModalOpen, setIsPMSModalOpen] = React.useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = React.useState(false);
  const [explainingKPI, setExplainingKPI] = React.useState<KPI | null>(null);

  const filteredEvents = React.useMemo(() => {
    if (!data?.events) return [];
    if (!searchTerm) return data.events;
    const term = searchTerm.toLowerCase();
    return data.events.filter(
      (ev: ExecutionEvent) =>
        ev.type.toLowerCase().includes(term) || ev.id.toLowerCase().includes(term)
    );
  }, [data?.events, searchTerm]);

  // Visible events for infinite scroll
  const visibleEvents = React.useMemo(() => {
    return filteredEvents.slice(0, visibleCount);
  }, [filteredEvents, visibleCount]);

  const hasMoreEvents = visibleCount < filteredEvents.length;

  // Reset visible count when filters change
  React.useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchTerm, period]);

  // Intersection observer for infinite scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreEvents && !loadingMore) {
          setLoadingMore(true);
          // Small delay for UX
          setTimeout(() => {
            setVisibleCount(prev => prev + LOAD_MORE_COUNT);
            setLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreEvents, loadingMore]);

  return (
    <AppPage
      title="Dashboard"
      subtitle="Today's operational truth — summarized, verified, and actionable."
      loading={loading}
      error={error}
      onRetry={retry}
      onRefresh={async () => {
        try {
          await api.syncExecutions();
          retry();
        } catch (err) {
          console.error('Refresh sync failed:', err);
          retry(); // Still retry data fetch even if sync fails
        }
      }}
      actions={
        <div className="flex gap-4 items-center">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            {[
              { label: 'All', value: 'all' },
              { label: '7D', value: '7d' },
              { label: '30D', value: '30d' },
              { label: 'Custom', value: 'custom' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${period === p.value
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-stone-100 border-none text-[10px] font-bold text-stone-600 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-stone-300 outline-none"
              />
              <span className="text-stone-300 text-[10px] font-bold">TO</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-stone-100 border-none text-[10px] font-bold text-stone-600 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-stone-300 outline-none"
              />
            </div>
          )}
          <div className="flex gap-2">
            <AppButton
              variant="secondary"
              size="sm"
              icon={<Shield size={14} />}
              onClick={() => setIsAuditModalOpen(true)}
            >
              Governance Audit
            </AppButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI MAPPING */}
        <AppCard variant="dark" padding="none">
          <div className="py-4 px-8 md:py-6 md:px-10 divide-y divide-stone-800/50">
            {/* SECTION 1: LIVE SYSTEM OVERVIEW */}
            <AppSection
              title="System Status — Operating Autonomously"
              subtitle="Real-time view of decisions, value and operational load."
              icon={<Activity size={16} className="text-stone-500" strokeWidth={1.5} />}
              className="pb-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {data?.kpis && data.kpis.length > 0 ? (
                  <>
                    {data.kpis.slice(0, 1).map((kpi, index) => (
                      <AppKPICard
                        key={index}
                        kpi={kpi}
                        variant="gold"
                        onClick={() => setExplainingKPI(kpi)}
                      />
                    ))}
                    {data.kpis.slice(1, 6).map((kpi, index) => (
                      <AppKPICard
                        key={index}
                        kpi={kpi}
                        onClick={() => setExplainingKPI(kpi)}
                      />
                    ))}
                  </>
                ) : (
                  <div className="col-span-full">
                    <AppEmptyState
                      title="No Operational Data"
                      description="Connect your Property Management System to begin capturing autonomous value and governing guest interactions."
                      icon={<Building2 size={24} />}
                      action={
                        <AppButton
                          variant="primary"
                          icon={<Building2 size={16} />}
                          onClick={() => setIsPMSModalOpen(true)}
                        >
                          Connect PMS
                        </AppButton>
                      }
                    />
                  </div>
                )}
              </div>
            </AppSection>

            {/* SECTION 2: SYSTEM HEALTH (Only show if we have more than 6 KPIs) */}
            {data?.kpis && data.kpis.length > 6 && (
              <AppSection
                title="System Health"
                subtitle="Continuity, reliability, and governance signals."
                icon={
                  <div className="w-4 h-4 rounded-full border border-gold-start/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full gold-gradient shadow-gold-glow" />
                  </div>
                }
                className="pt-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {data?.kpis.slice(6, 12).map((kpi: KPI, index: number) => (
                    <AppKPICard
                      key={index}
                      kpi={kpi}
                      onClick={() => setExplainingKPI(kpi)}
                    />
                  ))}
                </div>
              </AppSection>
            )}
          </div>
        </AppCard>

        <AppSection
          title="Guest Orchestration Log"
          subtitle="Every operation recorded as truth. Institutional communication executed by the system."
          icon={<Activity size={18} className="text-gold-start" />}
        >
          <AppTable
            headers={[
              'ID',
              'Workflow',
              'Scope',
              'Status',
              'Duration',
              'Decision Latency',
              'Human-Required Interventions',
              'Value €',
              'Messages',
            ]}
          >
            {visibleEvents.length > 0 ? (
              <>
                {visibleEvents.map((ev: ExecutionEvent) => (
                  <AppTableRow key={ev.id} onClick={() => setSelectedEvent(ev)}>
                    <AppTableCell className="font-mono text-stone-400 text-xs">
                      {ev.id.substring(0, 8)}...
                    </AppTableCell>
                    <AppTableCell className="font-semibold text-stone-900">
                      {ev.type}
                    </AppTableCell>
                    <AppTableCell>
                      <AppBadge variant={ev.is_multiple ? 'info' : 'neutral'} size="sm">
                        {ev.is_multiple ? 'Multiple' : 'Single'}
                      </AppBadge>
                    </AppTableCell>
                    <AppTableCell>
                      <AppBadge variant={getStatusVariant(ev.status)} size="sm">{ev.status}</AppBadge>
                    </AppTableCell>
                    <AppTableCell className="text-stone-500 text-xs font-mono">
                      {ev.duration || '—'}
                    </AppTableCell>
                    <AppTableCell className="text-xs font-mono">
                      {ev.verdict ? (
                        <AppBadge variant={ev.verdict === 'PASSED' ? 'success' : 'warning'} size="sm">
                          {ev.verdict}
                        </AppBadge>
                      ) : <span className="text-stone-600">N/A</span>}
                    </AppTableCell>
                    <AppTableCell className="text-center">
                      {ev.escalation ? '🚨' : '—'}
                    </AppTableCell>
                    <AppTableCell className="text-stone-500 font-mono text-xs text-right">
                      {ev.value_captured ? `€${ev.value_captured.toFixed(2)}` : <span className="text-stone-600">N/A</span>}
                    </AppTableCell>
                    <AppTableCell className="text-stone-500 text-xs text-center">
                      {ev.messages_sent !== undefined && ev.messages_sent > 0 ? ev.messages_sent : <span className="text-stone-600">0</span>}
                    </AppTableCell>
                  </AppTableRow>
                ))}
                {/* Infinite scroll trigger */}
                {hasMoreEvents && (
                  <AppTableRow>
                    <AppTableCell colSpan={9} className="py-4 text-center">
                      <div ref={loadMoreRef} className="flex items-center justify-center gap-2">
                        {loadingMore ? (
                          <span className="text-xs text-stone-400 animate-pulse">Loading more...</span>
                        ) : (
                          <span className="text-xs text-stone-400">
                            Showing {visibleEvents.length} of {filteredEvents.length} events
                          </span>
                        )}
                      </div>
                    </AppTableCell>
                  </AppTableRow>
                )}
              </>
            ) : (
              <AppTableRow>
                <AppTableCell colSpan={9} className="py-20 text-center">
                  <AppEmptyState
                    title="Stream Idle"
                    description="No recording events detected. Your execution audit trail will appear here once the system is active."
                    icon={<Activity size={24} />}
                  />
                </AppTableCell>
              </AppTableRow>
            )}
          </AppTable>
        </AppSection>
      </div>

      <ExecutionDetailModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />

      <ConfigurePMSModal
        isOpen={isPMSModalOpen}
        onClose={() => setIsPMSModalOpen(false)}
      />

      <GovernanceAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <KPIExplanationModal
        isOpen={!!explainingKPI}
        onClose={() => setExplainingKPI(null)}
        kpi={explainingKPI}
      />
    </AppPage>
  );
};

export default Dashboard;
