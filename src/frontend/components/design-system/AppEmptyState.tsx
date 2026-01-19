import React from 'react';
import { AppCard } from './AppCard';

interface AppEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <AppCard className="border-dashed border-stone-300 bg-stone-50/50">
      <div className="text-center py-16 px-6">
        {icon && (
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-stone-200 text-stone-400 shadow-sm animate-in zoom-in duration-500">
            {icon}
          </div>
        )}
        <h4 className="text-base font-bold text-stone-900 tracking-tight">{title}</h4>
        <p className="text-xs text-stone-500 mt-2 mb-8 max-w-sm mx-auto font-light leading-relaxed">
          {description}
        </p>
        {action && <div className="flex justify-center">{action}</div>}
      </div>
    </AppCard>
  );
};
