import React, { useEffect } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'right';
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  position = 'bottom',
  className = '',
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const positionClasses = position === 'bottom'
    ? 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-[16px]'
    : 'right-0 top-0 bottom-0 w-full max-w-md rounded-l-[12px]';

  const slideAnimation = position === 'bottom'
    ? 'animate-slide-up'
    : 'animate-fade-in';

  return (
    <div className="fixed inset-0 z-[8000]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Panel'}
        className={`
          absolute bg-navy-800 border-navy-600/50 shadow-modal
          flex flex-col overflow-hidden ${slideAnimation}
          ${positionClasses}
          ${position === 'bottom' ? 'border-t' : 'border-l'}
          ${className}
        `}
      >
        {/* Handle bar (bottom drawer) */}
        {position === 'bottom' && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-navy-600" />
          </div>
        )}
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-navy-600/50">
            <h3 className="text-base font-semibold text-navy-50">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[6px] hover:bg-navy-700 transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
