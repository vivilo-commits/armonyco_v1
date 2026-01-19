import React from 'react';
import { ButtonVariant } from '@/backend/types';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all duration-300 rounded-full text-[11px] disabled:opacity-70 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800 shadow-lg hover:-translate-y-0.5',
    secondary: 'bg-white text-stone-900 border border-stone-200 hover:bg-stone-50 shadow-sm hover:-translate-y-0.5',
    gold: 'gold-gradient text-stone-900 shadow-gold-glow hover:-translate-y-0.5 hover:shadow-gold-glow-lg transition-all',
    outline: 'border border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900 bg-transparent shadow-sm',
    ghost: 'text-stone-500 hover:text-stone-900 bg-transparent',
  };

  const sizes = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-10 py-4',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {children}
          {icon && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
