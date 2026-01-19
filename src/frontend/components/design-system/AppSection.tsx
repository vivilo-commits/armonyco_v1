import React from 'react';
import { TOKENS } from './tokens';

interface AppSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const AppSection: React.FC<AppSectionProps> = ({
  title,
  subtitle,
  icon,
  children,
  className = '',
  action,
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {icon && <span className="text-gold-start shrink-0">{icon}</span>}
            <h3 className={TOKENS.typography.sectionHeader}>{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-stone-500 pl-8 font-light">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
};
