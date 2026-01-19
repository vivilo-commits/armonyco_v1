import React from 'react';

interface AppSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export const AppSwitch: React.FC<AppSwitchProps> = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between group">
      {(label || description) && (
        <div className="flex flex-col gap-1">
          {label && <span className="text-sm font-bold text-stone-900">{label}</span>}
          {description && (
            <span className="text-[10px] text-stone-500 font-mono uppercase tracking-widest">
              {description}
            </span>
          )}
        </div>
      )}
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full relative transition-all duration-300 shadow-inner ${checked ? 'bg-green-500' : 'bg-stone-200'}`}
        aria-label={label || 'Toggle switch'}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ease-out ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
};
