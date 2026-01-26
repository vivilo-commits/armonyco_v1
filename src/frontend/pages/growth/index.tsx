import React from 'react';
import { Target } from 'lucide-react';

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

interface GrowthProps {
  searchTerm?: string;
}

export const Growth: React.FC<GrowthProps> = ({ searchTerm }) => {
  const { data, loading, error, retry } = usePageData(() => api.getGrowthData());

  // Calculate real financial metrics from data
  const financialMetrics = React.useMemo(() => {
    if (!data?.kpis) return null;

    // Find specific KPIs by label
    const totalRevenue = data.kpis.find(k => k.label === 'Total Revenue Captured')?.value || '€ 0,00';
    const upsellRate = data.kpis.find(k => k.label === 'Upsell Acceptance Rate')?.value || '0.0%';
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
      subtitle="Total value captured via governance & operational upsells."
      loading={loading}
      error={error}
      onRetry={retry}
      actions={
        <div className="flex gap-4">
          <AppButton
            variant="primary"
            icon={<Target size={16} />}
            onClick={() => alert('Starting Goal Capture analysis...')}
          >
            Capture Goal
          </AppButton>
        </div>
      }
    >
      <div className="space-y-12">
        {/* SECTION 1: VALUE CAPTURED */}
        <AppSection
          title="Value Captured"
          subtitle="Revenue governed by the system across upsells, extensions, and opportunity capture."
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Primary Metric Highlight */}
            <AppKPICard
              variant="gold"
              kpi={{
                id: `v-cap-primary`,
                label: 'Revenue Captured',
                value: financialMetrics?.totalRevenue || '€ 0,00',
                subtext: data?.wins?.length ? `${data.wins.length} Wins` : 'Awaiting Verification',
                trend: 0,
                trendLabel: '',
                status: 'neutral',
              }}
            />
            {[
              { label: 'Upsell Acceptance Rate', value: financialMetrics?.upsellRate || '0.0%', sub: 'Conversion Rate' },
              { label: 'Orphan Days Captured', value: financialMetrics?.orphanDays || '0', sub: 'Occupancy Boost' },
              { label: 'Late Check-out Revenue', value: financialMetrics?.lateCheckout || '€ 0,00', sub: 'Extension Value' },
              { label: 'Early Check-in Revenue', value: financialMetrics?.earlyCheckin || '€ 0,00', sub: 'Arrival Value' },
              { label: 'Services Revenue', value: financialMetrics?.services || '€ 0,00', sub: 'Add-ons & Extras' },
            ].map((item, i) => (
              <AppKPICard
                key={i}
                variant="light"
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
              { label: 'Hours Saved', value: '0h' },
              { label: 'Escalations Resolved', value: '0' },
              { label: 'Escalations Open', value: '0' },
              { label: 'Automation Rate', value: '0%' },
              { label: 'Resolution Rate', value: '0%' },
            ]).map((item: any, i: number) => (
              <AppKPICard
                key={i}
                variant={i === 0 ? 'gold' : 'light'}
                kpi={{
                  id: `v-cre-${i}`,
                  label: item.label,
                  value: item.value,
                  subtext: i === 0 ? 'Institutional Savings' : '',
                  trend: 0,
                  trendLabel: '',
                  status: 'neutral',
                }}
              />
            ))}
          </div>
        </AppSection>

        {/* SECTION 3: TOP WINS */}
        <AppSection title="Top Wins" subtitle="Verified outcomes and attributed value.">
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
                        {win.status}
                      </AppBadge>
                    </AppTableCell>
                  </AppTableRow>
                ))}
              </AppTable>
            )}
          </div>
        </AppSection>
      </div>
    </AppPage>
  );
};

export default Growth;
