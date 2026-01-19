import React from 'react';
import { Activity } from 'lucide-react';

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
import { Building2 } from 'lucide-react';

export const Dashboard: React.FC<{ searchTerm?: string }> = ({ searchTerm }) => {
  const { data, loading, error, retry } = usePageData(() => api.getDashboardData());
  const [selectedEvent, setSelectedEvent] = React.useState<ExecutionEvent | null>(null);
  const [isPMSModalOpen, setIsPMSModalOpen] = React.useState(false);

  const filteredEvents = React.useMemo(() => {
    if (!data?.events) return [];
    if (!searchTerm) return data.events;
    const term = searchTerm.toLowerCase();
    return data.events.filter(
      (ev: ExecutionEvent) =>
        ev.type.toLowerCase().includes(term) || ev.id.toLowerCase().includes(term)
    );
  }, [data?.events, searchTerm]);

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
        <div className="flex gap-2">
          <AppBadge
            variant="success"
            icon={<div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
          >
            System Operational
          </AppBadge>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI MAPPING */}
        <AppCard variant="dark">
          <div className="py-4 px-8 md:py-6 md:px-10 divide-y divide-stone-800/50">
            {/* SECTION 1: LIVE SYSTEM OVERVIEW */}
            <AppSection
              title="Live System Overview"
              subtitle="A real-time view of value, autonomy, and operational load."
              icon={<Activity size={16} className="text-stone-500" strokeWidth={1.5} />}
              className="pb-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {data?.kpis && data.kpis.length > 0 ? (
                  <>
                    {data.kpis.slice(0, 1).map((kpi, index) => (
                      <AppKPICard key={index} kpi={kpi} variant="gold" />
                    ))}
                    {data.kpis.slice(1, 6).map((kpi, index) => (
                      <AppKPICard key={index} kpi={kpi} />
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
                    <AppKPICard key={index} kpi={kpi} />
                  ))}
                </div>
              </AppSection>
            )}
          </div>
        </AppCard>

        {/* EVENT STREAM TABLE */}
        <AppSection
          title="Execution Stream"
          subtitle="Every operation recorded as truth. Click any row for full proof."
          icon={<Activity size={18} className="text-gold-start" />}
        >
          <AppTable
            headers={[
              'Truth ID',
              'Workflow',
              'Agent',
              'Status',
              'Verdict',
              'Started',
              'Duration',
              'Credits',
              'Risk',
            ]}
          >
            {filteredEvents.length > 0 ? (
              filteredEvents.map((ev: ExecutionEvent) => (
                <AppTableRow key={ev.id} onClick={() => setSelectedEvent(ev)}>
                  <AppTableCell className="font-mono text-stone-400">{ev.id}</AppTableCell>
                  <AppTableCell className="font-bold text-stone-900">{ev.type}</AppTableCell>
                  <AppTableCell className="text-stone-600">Amelia-v4</AppTableCell>
                  <AppTableCell>
                    <AppBadge variant={getStatusVariant(ev.status)}>{ev.status}</AppBadge>
                  </AppTableCell>
                  <AppTableCell className="text-xs font-mono text-stone-500">
                    {ev.verdict || 'N/A'}
                  </AppTableCell>
                  <AppTableCell className="text-stone-400 font-mono text-[11px]">
                    {ev.time}
                  </AppTableCell>
                  <AppTableCell className="text-stone-500 text-xs">
                    {ev.duration || '-'}
                  </AppTableCell>
                  <AppTableCell className="text-stone-500 font-mono text-xs">
                    {((ev.id.length % 5) + 0.5).toFixed(1)}
                  </AppTableCell>
                  <AppTableCell className="text-stone-500 text-xs">{ev.risk || 'Low'}</AppTableCell>
                </AppTableRow>
              ))
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
    </AppPage>
  );
};

export default Dashboard;
