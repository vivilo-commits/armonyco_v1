import React from 'react';
import { BadgeVariant } from '@/backend/types';

interface AppBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  children,
  variant = 'neutral',
  icon,
  size = 'md',
  className = '',
}) => {
  const variants = {
    success: 'bg-green-50 text-green-700 border-green-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-red-50 text-red-700 border-red-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    neutral: 'bg-stone-50 text-stone-600 border-stone-200',
    gold: 'bg-gold-start/10 text-gold-start border-gold-start/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]',
  };

  return (
    <span
      className={`
            inline-flex items-center gap-1.5 rounded-full border
            font-bold uppercase tracking-wider
            ${variants[variant]}
            ${sizes[size]}
            ${className}
        `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
