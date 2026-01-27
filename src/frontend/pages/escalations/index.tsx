import React, { useState } from 'react';
import { Shield, AlertCircle, Clock } from 'lucide-react';
import {
  AppPage,
  AppCard,
  AppBadge,
  AppButton,
  AppEmptyState,
} from '@/frontend/components/design-system';

import { api } from '@/backend/api';
import { usePageData } from '@/frontend/hooks/usePageData';
import { Escalation } from '@/backend/types';
import { EscalationDetailModal } from '@/frontend/components/modals/EscalationDetailModal';
import { useAuth } from '../../contexts/AuthContext';

interface EscalationsProps {
  searchTerm?: string;
}

export const Escalations: React.FC<EscalationsProps> = ({ searchTerm }) => {
  const { canResolveEscalations } = useAuth();
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [activeSegment, setActiveSegment] = useState<'OPEN' | 'RESOLVED'>('OPEN');

  const { data, loading, error, retry } = usePageData(async () => {
    const [openRes, resolvedRes] = await Promise.all([
      api.getEscalationsData('OPEN'),
      api.getEscalationsData('RESOLVED')
    ]);
    return {
      open: openRes,
      resolved: resolvedRes,
      totalOpen: openRes.length,
      totalResolved: resolvedRes.length
    };
  });

  const filteredEscalations = React.useMemo(() => {
    const dataSource = activeSegment === 'OPEN' ? data?.open : data?.resolved;
    if (!dataSource) return [];
    if (!searchTerm) return dataSource;
    const term = searchTerm.toLowerCase();
    return dataSource.filter(
      (item) =>
        item.phone_clean.toLowerCase().includes(term) ||
        (item.classification?.toLowerCase() || '').includes(term) ||
        item.id.toLowerCase().includes(term) ||
        (item.metadata?.reason || '').toLowerCase().includes(term)
    );
  }, [data, activeSegment, searchTerm]);

  return (
    <AppPage
      title="Escalations"
      subtitle="Critical interventions requiring human verification & resolution context."
      loading={loading}
      error={error}
      onRetry={retry}
      actions={null}
    >
      <div className="space-y-6">
        {/* SEGMENT CONTROL */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-[1.25rem] w-fit border border-stone-200/50">
          <button
            onClick={() => setActiveSegment('OPEN')}
            className={`
              px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all
              ${activeSegment === 'OPEN' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}
            `}
          >
            Open ({data?.totalOpen || 0})
          </button>
          <button
            onClick={() => setActiveSegment('RESOLVED')}
            className={`
              px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all
              ${activeSegment === 'RESOLVED' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}
            `}
          >
            Resolved ({data?.totalResolved || 0})
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {filteredEscalations.map((item: Escalation) => (
            <AppCard
              key={item.id}
              variant="light"
              onClick={() => setSelectedEscalation(item)}
              padding="small"
              className="group hover:border-gold-start/50 transition-all cursor-pointer border-stone-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div
                    className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
                    ${item.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' :
                        item.classification === 'Critical' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-orange-50 text-orange-500 border border-orange-100'}
                  `}
                  >
                    {item.status === 'RESOLVED' ? <Shield size={22} /> : <AlertCircle size={22} />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-stone-900">
                        {item.phone_clean}
                      </span>
                      <AppBadge
                        variant={item.status === 'RESOLVED' ? 'success' : (item.classification === 'Critical' || item.classification === 'M3') ? 'error' : 'warning'}
                      >
                        {item.classification || 'M1'}
                      </AppBadge>
                      {item.metadata?.risk_type && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 border border-stone-200 px-1.5 py-0.5 rounded-md">
                          {item.metadata.risk_type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-stone-400 font-mono">
                      <span>ID: {item.id.substring(0, 8)}...</span>
                      <span>•</span>
                      <span>FLOW: {item.metadata?.workflow || 'System'}</span>
                      <span>•</span>
                      <span className="text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={10} /> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">
                      {item.status === 'RESOLVED' ? 'Resolution' : 'Reason'}
                    </div>
                    <div className="text-xs font-bold text-stone-700 truncate max-w-[200px]">
                      {item.status === 'RESOLVED' ? (item.resolution_notes || 'Resolved') : (item.metadata?.reason || 'Context Required')}
                    </div>
                  </div>
                  <AppButton variant="secondary" size="sm" className="font-bold">
                    {item.status === 'RESOLVED' || !canResolveEscalations ? 'View Details' : 'View & Resolve'}
                  </AppButton>
                </div>
              </div>
            </AppCard>
          ))}

          {filteredEscalations.length === 0 && (
            <div className="animate-in fade-in zoom-in duration-500">
              <AppEmptyState
                title={activeSegment === 'OPEN' ? "No open escalations" : "No resolved history"}
                description={activeSegment === 'OPEN' ? "Everything is running autonomously. System health is 100%." : "Intervention history will appear here once protocols are audited."}
              />
            </div>
          )}
        </div>
      </div>

      <EscalationDetailModal
        isOpen={!!selectedEscalation}
        onClose={() => setSelectedEscalation(null)}
        escalation={selectedEscalation}
        onResolved={retry}
      />
    </AppPage>
  );
};

export default Escalations;
