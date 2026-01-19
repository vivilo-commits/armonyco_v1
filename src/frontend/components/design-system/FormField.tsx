import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: LucideIcon;
  isTextArea?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  icon: Icon,
  isTextArea = false,
  rows = 4,
  className = '',
  disabled = false,
}) => {
  const inputClasses = `w-full bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-xl focus:ring-1 focus:ring-stone-900 focus:border-stone-900 block ${Icon ? 'pl-10' : 'px-3'} p-3 transition-all outline-none ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors"
            size={16}
          />
        )}
        {isTextArea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            rows={rows}
            className={`${inputClasses} ${Icon ? 'pl-11 pt-3.5' : ''} resize-none`}
            disabled={disabled}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={inputClasses}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};
