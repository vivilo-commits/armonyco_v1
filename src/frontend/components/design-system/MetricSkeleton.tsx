import React from 'react';

interface MetricSkeletonProps {
  count?: number;
  className?: string;
}

export const MetricSkeleton: React.FC<MetricSkeletonProps> = ({ count = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-8 rounded-[2rem] border border-stone-200 animate-pulse">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-stone-100 rounded-xl" />
            <div className="w-16 h-6 bg-stone-100 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="w-1/2 h-4 bg-stone-100 rounded" />
            <div className="w-3/4 h-8 bg-stone-100 rounded" />
          </div>
          <div className="mt-6 pt-6 border-t border-stone-100">
            <div className="w-1/3 h-3 bg-stone-50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
