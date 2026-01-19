import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { TOKENS } from './tokens';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  icon?: React.ReactNode;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  icon,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Backdrop with higher blur for premium feel */}
      <div
        role="button"
        tabIndex={0}
        className="absolute inset-0 bg-stone-900/10 backdrop-blur-[8px] transition-all duration-700 animate-in fade-in-0"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.1)_100%)]"></div>
      </div>

      {/* Modal Content */}
      <div
        className={`
                relative bg-white text-stone-900 border-stone-200
                ${TOKENS.radius.large} ${TOKENS.shadows.premium} 
                w-full ${maxWidth} flex flex-col max-h-[90vh] 
                animate-in zoom-in-95 fade-in-0 duration-500
                border overflow-hidden shadow-2xl
            `}
      >
        {/* Decorative Gold Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 gold-gradient z-20" />

        {/* Header */}
        {(title || subtitle || icon) && (
          <div className="flex items-center justify-between p-8 border-b border-stone-100 bg-stone-50/50 shrink-0 relative">
            <div className="flex items-center gap-5">
              {icon && (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white text-gold-start border border-stone-100 shadow-sm">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h2 className={`${TOKENS.typography.cardHeader} text-stone-900`}>{title}</h2>
                )}
                {subtitle && (
                  <p className="text-[10px] mt-1.5 uppercase font-bold tracking-[0.2em] text-stone-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl transition-all duration-300 group hover:bg-stone-100 text-stone-400 hover:text-stone-900"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div
          className={`
                    flex-1 overflow-y-auto p-8 custom-scrollbar bg-white
                    ${!footer ? 'pb-10' : ''}
                `}
        >
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both text-stone-600">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-8 border-t border-stone-100 flex justify-end gap-3 shrink-0 bg-stone-50/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
