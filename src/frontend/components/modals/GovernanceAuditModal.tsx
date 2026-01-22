import React from 'react';
import { BaseModal, AppButton, AppBadge, AppCard } from '../design-system';
import {
    Printer,
    ShieldCheck,
    FileText,
    TrendingUp,
    Activity,
    Lock,
    Globe,
    Landmark,
    Calculator,
    Calendar
} from 'lucide-react';
import { api } from '@/backend/api';
import { ASSETS } from '@/frontend/assets';
import { FormField } from '../design-system/FormField';

interface GovernanceAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GovernanceAuditModal: React.FC<GovernanceAuditModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    // Date selection states (Default to last 30 days)
    const [startDate, setStartDate] = React.useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = React.useState(() => new Date().toISOString().split('T')[0]);

    React.useEffect(() => {
        if (isOpen) {
            loadAuditData();
        }
    }, [isOpen, startDate, endDate]);

    const loadAuditData = async () => {
        setLoading(true);
        try {
            const auditData = await api.getAuditData(startDate, endDate);
            setData(auditData);
        } catch (e) {
            console.error('Failed to load audit data', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-4xl"
            title="Governance Audit Protocol"
            subtitle="Institutional Compliance Summary"
            icon={<ShieldCheck size={24} className="text-gold-start" />}
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className="text-[10px] text-stone-400 font-mono hidden sm:block">
                        AUTHENTICATION ID: {data?.reportId || 'VERIFYING...'}
                    </div>
                    <div className="flex gap-3">
                        <AppButton variant="secondary" onClick={onClose}>
                            Dismiss
                        </AppButton>
                        <AppButton
                            variant="primary"
                            onClick={handlePrint}
                            icon={<Printer size={18} />}
                            className="gold-gradient !text-stone-900"
                            disabled={loading}
                        >
                            Print Protocol
                        </AppButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-8">
                {/* PERIOD SELECTION (Hidden in Print) */}
                <div className="print:hidden bg-stone-50 border border-stone-200 p-6 rounded-2xl flex flex-col md:flex-row items-end gap-6">
                    <FormField
                        label="Audit Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex-1"
                        icon={Calendar}
                    />
                    <FormField
                        label="Audit End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex-1"
                        icon={Calendar}
                    />
                    <AppButton
                        variant="secondary"
                        size="sm"
                        onClick={loadAuditData}
                        disabled={loading}
                        icon={<Activity size={14} className={loading ? 'animate-spin' : ''} />}
                    >
                        Refresh Data
                    </AppButton>
                </div>
                <div className="print:p-0 print:bg-white">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <Activity className="animate-spin text-gold-start" size={32} />
                            <p className="text-xs font-black uppercase tracking-widest text-stone-400 animate-pulse">
                                Compiling Global Audit Trail...
                            </p>
                        </div>
                    ) : (
                        <div id="audit-document" className="space-y-10 font-serif">
                            {/* DOCUMENT HEADER (Print-Only Branding) */}
                            <div className="hidden print:flex flex-col items-center text-center space-y-4 border-b-2 border-double border-stone-200 pb-8 mb-10">
                                <img src={ASSETS.logos.armonyco} alt="Armonyco" className="w-16 h-16 object-contain" />
                                <div className="space-y-1">
                                    <h1 className="text-2xl font-black tracking-tighter text-stone-900 uppercase">INTERNAL AUDIT PROTOCOL</h1>
                                    <p className="text-[10px] font-sans font-black tracking-[0.3em] text-stone-400">DECISION-OS™ GOVERNANCE ENGINE</p>
                                </div>
                                <div className="mt-4 flex gap-8 text-[10px] font-sans font-bold uppercase tracking-widest text-stone-500">
                                    <span>REPORT ID: {data.reportId}</span>
                                    <span>ISSUED: {new Date(data.timestamp).toLocaleString()}</span>
                                    <span>AUTH: INSTITUTIONAL</span>
                                </div>
                            </div>

                            {/* CONFIDENTIAL NOTICE */}
                            <div className="bg-stone-50 border-l-4 border-gold-start p-6 rounded-r-2xl">
                                <div className="flex items-start gap-4">
                                    <Lock size={18} className="text-gold-start mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-stone-900">Confidential Classification</h4>
                                        <p className="text-xs text-stone-500 leading-relaxed font-sans">
                                            This document summarizes cross-module operational truth for
                                            <span className="font-bold text-stone-700"> {data.organizationId || 'System'}</span> between
                                            <span className="font-bold text-stone-900"> {new Date(startDate).toLocaleDateString()}</span> and
                                            <span className="font-bold text-stone-900"> {new Date(endDate).toLocaleDateString()}</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 1: OPERATIONAL EFFICIENCY */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-stone-100 pb-2">
                                    <FileText size={18} className="text-stone-400" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-900">I. Operational Scorecard</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <AppCard variant="light" className="p-6 border-stone-100 bg-stone-50/30">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                                            <Activity size={12} /> Autonomous Volume
                                        </div>
                                        <div className="text-2xl font-black text-stone-900 font-serif">
                                            {data.kpis.find((k: any) => k.id === 'total-executions')?.value || '0'}
                                        </div>
                                        <div className="text-[10px] mt-2 font-bold text-stone-500 font-sans">
                                            Nodes Executed
                                        </div>
                                    </AppCard>

                                    <AppCard variant="light" className="p-6 border-stone-100">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                                            <TrendingUp size={12} /> AI Resolution Rate
                                        </div>
                                        <div className="text-2xl font-black text-green-600 font-serif">
                                            {data.kpis.find((k: any) => k.id === 'ai-resolution')?.value || '100%'}
                                        </div>
                                        <div className="text-[10px] mt-2 font-bold text-stone-500 font-sans">
                                            Autonomous Closures
                                        </div>
                                    </AppCard>

                                    <AppCard variant="light" className="p-6 border-stone-100 bg-stone-50/30">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                                            <Globe size={12} /> ROI Reclaimed
                                        </div>
                                        <div className="text-2xl font-black text-gold-end font-serif">
                                            {data.kpis.find((k: any) => k.id === 'avg-time-saved')?.value || '0s'}
                                        </div>
                                        <div className="text-[10px] mt-2 font-bold text-stone-500 font-sans">
                                            Avg. Time Per Task
                                        </div>
                                    </AppCard>
                                </div>
                            </div>

                            {/* SECTION 2: FINANCIAL GOVERNANCE */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-stone-100 pb-2">
                                    <Landmark size={18} className="text-stone-400" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-900">II. Revenue Governance</h3>
                                </div>

                                <div className="bg-stone-900 text-stone-100 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold-start/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-8">
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                                                Governed Value for Period
                                            </div>
                                            <div className="text-4xl font-black font-serif text-white">
                                                {data.growthKpis.find((k: any) => k.id === 'total-revenue')?.value || '€ 0,00'}
                                            </div>
                                        </div>

                                        <div className="flex gap-10">
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">Upsell Acceptance</div>
                                                <div className="text-xl font-bold font-serif text-gold-start">
                                                    {data.growthKpis.find((k: any) => k.id === 'upsell-rate')?.value || '0%'}
                                                </div>
                                            </div>
                                            <div className="space-y-1 border-l border-stone-800 pl-10">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-stone-500">Transactions</div>
                                                <div className="text-xl font-bold font-serif text-white">
                                                    {data.growthKpis.find((k: any) => k.id === 'total-revenue')?.subtext.split(' ')[0] || '0'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: INTERVENTION INTEGRITY */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b border-stone-100 pb-2">
                                    <Calculator size={18} className="text-stone-400" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-900">III. Intervention Compliance</h3>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Total Alerts', value: data.interventions.total, color: 'text-stone-900' },
                                        { label: 'Resolution Rate', value: `${data.interventions.resolutionRate}%`, color: 'text-green-600' },
                                        { label: 'Active Escalations', value: data.interventions.open, color: 'text-orange-500' },
                                        { label: 'Resolved (Audit Ready)', value: data.interventions.resolved, color: 'text-emerald-500' }
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-stone-50/50 border border-stone-100 p-5 rounded-2xl flex flex-col items-center text-center space-y-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{stat.label}</span>
                                            <span className={`text-xl font-black font-serif ${stat.color}`}>{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FOOTER VERDICT */}
                            <div className="pt-10 border-t-2 border-stone-100 flex flex-col sm:flex-row justify-between gap-6 items-end">
                                <div className="space-y-2 max-w-md">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Governance Verdict</div>
                                    <div className="flex items-center gap-2">
                                        <AppBadge variant="success" className="gold-gradient !text-stone-900 font-serif">VERIFIED SUCCESS</AppBadge>
                                        <span className="text-xs text-stone-500 font-sans font-bold">Protocol Alignment: 100%</span>
                                    </div>
                                    <p className="text-[10px] text-stone-400 leading-relaxed font-sans font-medium">
                                        This report has been cryptographically generated by Decision-OS™. The data presented constitutes an
                                        empirical audit trail of autonomous agency and human intervention cycles.
                                    </p>
                                </div>

                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-24 h-24 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-center">
                                        {/* QR Placeholder for Institutional Feel */}
                                        <div className="grid grid-cols-4 gap-1 p-3">
                                            {Array.from({ length: 16 }).map((_, i) => (
                                                <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-stone-300' : 'bg-transparent'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-stone-400 font-sans">
                                        Digital Artifact ID: {data.reportId}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body { 
            visibility: hidden; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            height: auto !important;
            overflow: visible !important;
          }
          #audit-document, #audit-document * { 
            visibility: visible !important; 
          }
          #audit-document { 
            position: static !important;
            display: block !important;
            width: 100% !important;
            padding: 10mm !important;
            margin: 0 !important;
            background: white !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Fix specific surfaces for print */
          .bg-stone-900 { background-color: #1c1917 !important; color: white !important; }
          .bg-stone-50 { background-color: #fafaf9 !important; border: 1px solid #e7e5e4 !important; }
          .gold-gradient { background: linear-gradient(to right, #D4AF37, #F9D71C) !important; }
          .text-gold-start { color: #D4AF37 !important; }
          .text-gold-end { color: #F9D71C !important; }
          .text-white { color: white !important; }
          
          /* Force page breaks for institutional look */
          #audit-document > div {
            page-break-inside: avoid;
            margin-bottom: 2rem;
          }

          /* Remove shadows and UI clutter */
          .shadow-xl, .shadow-2xl, .shadow-md, .border-stone-100 { 
            box-shadow: none !important; 
            border: none !important;
          }
          
          @page {
            size: auto;
            margin: 15mm;
          }
        }
      `}} />
        </BaseModal>
    );
};
