import React from 'react';
import { Target } from 'lucide-react';
import { KPIExplanationModal } from '@/frontend/components/modals/KPIExplanationModal';
import { KPI } from '@/backend/types';

import {
  AppPage,
  AppBadge,
  AppButton,
  AppSection,
  AppKPICard,
  AppTable,
  AppTableRow,
  AppTableCell,
  AppEmptyState,
} from '@/frontend/components/design-system';

import { api } from '@/backend/api';
import { usePageData } from '@/frontend/hooks/usePageData';
import { useAuth } from '@/frontend/contexts/AuthContext';

interface GrowthProps {
  searchTerm?: string;
}

export const Growth: React.FC<GrowthProps> = ({ searchTerm }) => {
  const { organizationId } = useAuth();
  const [period, setPeriod] = React.useState('all');
  const [customStart, setCustomStart] = React.useState('');
  const [customEnd, setCustomEnd] = React.useState('');
  const [explainingKPI, setExplainingKPI] = React.useState<KPI | null>(null);

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

  const { data, loading, error, retry } = usePageData<{
    kpis: KPI[];
    wins: any[];
    valueCreated: any[];
  }>(
    () => api.getGrowthData(dateRange.start, dateRange.end),
    !!organizationId // Only fetch when org ID is available
  );

  React.useEffect(() => {
    retry();
  }, [period, customStart, customEnd, retry]);

  // Calculate real financial metrics from data
  const financialMetrics = React.useMemo(() => {
    if (!data?.kpis) return null;

    // Find specific KPIs by label
    const totalRevenue = data.kpis.find(k => k.label === 'Revenue Governed')?.value || '€ 0,00';
    const upsellRate = data.kpis.find(k => k.label === 'Guest Conversion Efficiency')?.value || '0.0%';
    const orphanDays = data.kpis.find(k => k.label === 'Orphan Days Captured')?.value || '0';
    const lateCheckout = data.kpis.find(k => k.label === 'Late Checkout Revenue')?.value || '€ 0,00';
    const earlyCheckin = data.kpis.find(k => k.label === 'Early Check-in Revenue')?.value || '€ 0,00';
    const services = data.kpis.find(k => k.label === 'Services Revenue')?.value || '€ 0,00';

    return {
      totalRevenue,
      upsellRate,
      orphanDays,
      lateCheckout,
      earlyCheckin,
      services,
    };
  }, [data?.kpis]);

  const filteredWins = React.useMemo(() => {
    if (!data?.wins) return [];
    if (!searchTerm) return data.wins;
    const term = searchTerm.toLowerCase();
    return data.wins.filter(
      (win) => win.title.toLowerCase().includes(term) || win.id.toLowerCase().includes(term)
    );
  }, [data?.wins, searchTerm]);

  return (
    <AppPage
      title="Growth"
      subtitle="Total value governed via institutional configuration & operational capture."
      loading={loading}
      error={error}
      onRetry={retry}
      onRefresh={retry}
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
        </div >
      }
    >
      <div className="space-y-12">
        {/* SECTION 1: VALUE CAPTURED */}
        <AppSection
          title="Revenue Governed"
          subtitle="Upsells, extensions and opportunities handled automatically."
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Primary Metric Highlight */}
            <AppKPICard
              variant="gold"
              onClick={() => setExplainingKPI({
                id: 'total-revenue',
                label: 'Revenue Governed',
                value: financialMetrics?.totalRevenue || '€ 0,00',
                subtext: data?.wins?.length ? `${data.wins.length} Wins` : 'Awaiting Verification',
                status: 'neutral',
                trend: 0,
                trendLabel: ''
              })}
              kpi={{
                id: `v-cap-primary`,
                label: 'Revenue Governed',
                value: financialMetrics?.totalRevenue || '€ 0,00',
                subtext: data?.wins?.length ? `${data.wins.length} Wins` : 'Awaiting Verification',
                trend: 0,
                trendLabel: '',
                status: 'neutral',
              }}
            />
            {[
              { label: 'Guest Conversion Efficiency', value: financialMetrics?.upsellRate || '0.0%', sub: 'Percentage of accepted system-driven offers.' },
              { label: 'Orphan Days Captured', value: financialMetrics?.orphanDays || '0', sub: 'Occupancy Boost' },
              { label: 'Late Check-out Revenue', value: financialMetrics?.lateCheckout || '€ 0,00', sub: 'Extension Value' },
              { label: 'Early Check-in Revenue', value: financialMetrics?.earlyCheckin || '€ 0,00', sub: 'Arrival Value' },
              { label: 'Services Revenue', value: financialMetrics?.services || '€ 0,00', sub: 'Add-ons & Extras' },
            ].map((item, i) => (
              <AppKPICard
                key={i}
                variant="light"
                onClick={() => setExplainingKPI({
                  id: `v-cap-${i + 1}`,
                  label: item.label,
                  value: item.value,
                  subtext: item.sub,
                  status: 'neutral',
                  trend: 0,
                  trendLabel: ''
                })}
                kpi={{
                  id: `v-cap-${i + 1}`,
                  label: item.label,
                  value: item.value,
                  subtext: item.sub,
                  trend: 0,
                  trendLabel: '',
                  status: 'neutral',
                }}
              />
            ))}
          </div>
        </AppSection>

        {/* SECTION 2: VALUE CREATED */}
        <AppSection
          title="Value Created"
          subtitle="Efficiency and risk reduction that compounds over time."
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {(data?.valueCreated || [
              { label: 'Value Saved', value: '€ 0,00' },
              { label: 'Human Load Removed (per op)', value: '0 min' },
              { label: 'Hours Saved', value: '0h' },
              { label: 'Escalations Resolved', value: '0' },
              { label: 'Escalations Open', value: '0' },
              { label: 'Operational Autonomy', value: '0%' },
              { label: 'Resolution Rate', value: '0%' },
            ]).map((item: any, i: number) => {
              const kpi = {
                id: i === 1 ? 'human-load-removed' : i === 2 ? 'hours-saved' : i === 3 ? 'escalations-resolved' : i === 4 ? 'open-escalations' : i === 5 ? 'ai-resolution' : `v-cre-${i}`,
                label: item.label,
                value: item.value,
                subtext: i === 0 ? 'Institutional Savings' : '',
                trend: 0,
                trendLabel: '',
                status: 'neutral' as const,
              };
              return (
                <AppKPICard
                  key={i}
                  variant={i === 0 ? 'gold' : 'light'}
                  onClick={() => setExplainingKPI(kpi)}
                  kpi={kpi}
                />
              );
            })}
          </div>
        </AppSection>

        {/* SECTION 3: VERIFIED OUTCOMES */}
        <AppSection title="Verified Outcomes" subtitle="Institutional routines and attributed value captured by the system.">
          <div className="min-h-[300px]">
            {filteredWins.length === 0 ? (
              <AppEmptyState
                title="No wins recorded yet"
                description="Once operations run, this feed will show verified outcomes and attributed value."
                action={
                  <AppButton variant="outline" size="sm">
                    View proof format
                  </AppButton>
                }
              />
            ) : (
              <AppTable headers={['Reference', 'Outcome', 'Value', 'Date', 'Status']}>
                {filteredWins.map((win, i: number) => (
                  <AppTableRow
                    key={i}
                    onClick={() => {
                      /* TODO: View proof */
                    }}
                  >
                    <AppTableCell className="font-mono text-stone-400">{win.id}</AppTableCell>
                    <AppTableCell className="font-bold text-stone-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-gold-start">
                          <Target size={14} />
                        </div>
                        {win.title}
                      </div>
                    </AppTableCell>
                    <AppTableCell className="font-bold text-stone-900">{win.value}</AppTableCell>
                    <AppTableCell className="text-stone-500 font-mono text-[11px]">
                      {win.date}
                    </AppTableCell>
                    <AppTableCell>
                      <AppBadge
                        variant={
                          win.status === 'Approved' ||
                            win.status === 'Captured' ||
                            win.status === 'Verified'
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {win.status === 'Captured' || win.status === 'Verified' ? 'Governed' : win.status}
                      </AppBadge>
                    </AppTableCell>
                  </AppTableRow>
                ))}
              </AppTable>
            )}
          </div>
        </AppSection>
      </div>

      <KPIExplanationModal
        isOpen={!!explainingKPI}
        onClose={() => setExplainingKPI(null)}
        kpi={explainingKPI}
      />
    </AppPage >
  );
};

export default Growth;
