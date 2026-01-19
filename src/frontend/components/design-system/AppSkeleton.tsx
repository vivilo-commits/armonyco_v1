import React from 'react';

interface AppSkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'table';
  className?: string;
  count?: number;
}

export const AppSkeleton: React.FC<AppSkeletonProps> = ({
  variant = 'rect',
  className = '',
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-stone-100 rounded';

  const variants = {
    text: 'h-4 w-full',
    rect: 'h-24 w-full',
    circle: 'h-12 w-12 rounded-full',
    card: 'h-64 w-full rounded-[2.5rem]',
    table: 'h-12 w-full',
  };

  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${baseClasses} ${variants[variant]} ${className}`} />
      ))}
    </div>
  );
};
