import React from 'react';
import { TOKENS } from './tokens';
import { CardVariant } from '@/backend/types';

interface AppCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  variant = 'light',
  className = '',
  hover = true,
  padding = 'medium',
  onClick,
}) => {
  const baseStyles =
    variant === 'light' ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800 text-white';

  const paddingStyles = {
    none: 'p-0',
    small: 'p-4 md:p-6',
    medium: 'p-8 md:p-10',
    large: 'p-12 md:p-16',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
            ${baseStyles}
            ${TOKENS.radius.large}
            border
            ${TOKENS.shadows.card}
            ${hover ? TOKENS.shadows.hover : ''}
            ${paddingStyles[padding]}
            ${onClick ? 'cursor-pointer hover:border-gold-start/50' : ''}
            transition-all duration-500
            relative overflow-hidden
            focus:outline-none focus:ring-2 focus:ring-gold-start/30
            ${className}
        `}
    >
      {variant === 'dark' && (
        <div className="absolute top-0 right-0 w-64 h-64 gold-gradient opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
