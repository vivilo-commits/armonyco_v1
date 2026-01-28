import { X } from 'lucide-react';
import type { KPI } from '@/backend/types';

interface KPIDetailModalProps {
    kpi: KPI;
    onClose: () => void;
    calculationDetails?: {
        formula?: string;
        dataSource?: string;
        breakdown?: Array<{ label: string; value: string | number }>;
    };
}

export function KPIDetailModal({ kpi, onClose, calculationDetails }: KPIDetailModalProps) {
    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold text-white">{kpi.label}</h2>
                            <div className="px-3 py-1 bg-[#1a1a1a] rounded-full">
                                <span className="text-2xl font-bold text-white">{kpi.value}</span>
                            </div>
                        </div>
                        {kpi.subtext && (
                            <p className="mt-1 text-sm text-gray-400">{kpi.subtext}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                    {/* Status Badge */}
                    {kpi.status && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Status:</span>
                            <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${kpi.status === 'success'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : kpi.status === 'warning'
                                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                            : kpi.status === 'error'
                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                    }`}
                            >
                                {kpi.trendLabel || kpi.status}
                            </span>
                        </div>
                    )}

                    {/* Calculation Formula */}
                    {calculationDetails?.formula && (
                        <div className="p-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg">
                            <h3 className="text-sm font-medium text-gray-300 mb-2">Calculation</h3>
                            <code className="text-sm text-blue-400 font-mono">
                                {calculationDetails.formula}
                            </code>
                        </div>
                    )}

                    {/* Data Source */}
                    {calculationDetails?.dataSource && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-300 mb-2">Data Source</h3>
                            <p className="text-sm text-gray-400">{calculationDetails.dataSource}</p>
                        </div>
                    )}

                    {/* Breakdown */}
                    {calculationDetails?.breakdown && calculationDetails.breakdown.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-300 mb-3">Breakdown</h3>
                            <div className="space-y-2">
                                {calculationDetails.breakdown.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between px-4 py-3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg hover:border-[#2a2a2a] transition-colors"
                                    >
                                        <span className="text-sm text-gray-400">{item.label}</span>
                                        <span className="text-sm font-medium text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Context / Notes */}
                    {!calculationDetails && (
                        <div className="p-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg">
                            <p className="text-sm text-gray-400">
                                This metric tracks <span className="text-white font-medium">{kpi.label.toLowerCase()}</span> in real-time.
                                {kpi.subtext && ` ${kpi.subtext}`}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#1a1a1a] bg-[#0d0d0d] rounded-b-lg">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Updated in real-time • Cached for performance
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
