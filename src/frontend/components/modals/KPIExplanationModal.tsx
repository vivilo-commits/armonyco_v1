import React from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { Scale, Info, Database, Rocket, Shield, Clock } from 'lucide-react';
import { KPI } from '@/backend/types';

interface KPIExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    kpi: KPI | null;
}

const KPI_EXPLANATIONS: Record<string, {
    description: string;
    calculation: string;
    dataSource: string;
    businessValue: string;
    icon: React.ReactNode;
}> = {
    'total-value': {
        description: 'The total monetary value currently being monitored and secured by the Armonyco governance engine.',
        calculation: 'Sum of all revenue transactions and operational charges processed through authorized channels.',
        dataSource: 'Supabase: cashflow_summary & executions (total_charge + value_captured)',
        businessValue: 'Provides visibility into the direct economic impact of the autonomous system.',
        icon: <Scale className="text-gold-start" size={24} />
    },
    'ai-resolution': {
        description: 'Percentage of Guest interactions resolved entirely by the system without requiring human intervention.',
        calculation: '(Successful autonomous executions / Total executions) * 100',
        dataSource: 'Supabase: executions (status = success AND human_escalation_triggered = false)',
        businessValue: 'Measures the degree of operational autonomy and labor cost reduction.',
        icon: <Rocket className="text-gold-start" size={24} />
    },
    'open-escalations': {
        description: 'Events that require human judgment due to high risk or lack of clear policy precedent.',
        calculation: 'Count of active execution records with status "OPEN" in the the governing escalation registry.',
        dataSource: 'Supabase: escalations registry (status = OPEN)',
        businessValue: 'Highlights current bottlenecks where human-in-the-loop oversight is strictly necessary.',
        icon: <Shield className="text-gold-start" size={24} />
    },
    'avg-time-saved': {
        description: 'Total human labor hours reclaimed from repetitive or high-volume tasks.',
        calculation: 'Average time saved per operation (fixed benchmark) * Total successful executions.',
        dataSource: 'Calculated Logic: utils.ts using standardized human labor benchmarks.',
        businessValue: 'Translates system activity into tangible productivity gains for the staff.',
        icon: <Clock className="text-gold-start" size={24} />
    },
    'decision-integrity': {
        description: 'Measure of how closely system decisions align with predefined institutional safety policies.',
        calculation: 'Percentage of decisions that passed the Governance Verdict verification.',
        dataSource: 'Supabase: executions (governance_verdict)',
        businessValue: 'Ensures Brand safety and policy compliance across every guest interaction.',
        icon: <Shield className="text-gold-start" size={24} />
    }
};

export const KPIExplanationModal: React.FC<KPIExplanationModalProps> = ({ isOpen, onClose, kpi }) => {
    if (!kpi) return null;

    const explanation = KPI_EXPLANATIONS[kpi.id] || {
        description: kpi.subtext || 'Detailed information for this metric.',
        calculation: 'Standard industry calculation.',
        dataSource: 'Institutional Data Layer',
        businessValue: 'Operational visibility and control.',
        icon: <Info className="text-gold-start" size={24} />
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={kpi.label}
            subtitle="Metric Calculation Disclosure"
            icon={explanation.icon}
        >
            <div className="space-y-6 pt-4">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-xs text-stone-600 leading-relaxed font-medium">
                        {explanation.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                            <Rocket size={12} />
                            Calculation Logic
                        </div>
                        <p className="text-[11px] text-stone-900 font-bold bg-white p-3 rounded-xl border border-stone-100 italic">
                            {explanation.calculation}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                            <Database size={12} />
                            Source of Truth
                        </div>
                        <p className="text-[11px] text-stone-600 font-medium">
                            {explanation.dataSource}
                        </p>
                    </div>

                    <div className="h-px bg-stone-100 my-2" />

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gold-start uppercase tracking-widest">
                            <Scale size={12} />
                            Institutional Value
                        </div>
                        <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                            {explanation.businessValue}
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-stone-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-stone-900 border border-stone-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-premium"
                    >
                        Dismiss Analysis
                    </button>
                </div>
            </div>
        </BaseModal>
    );
};
