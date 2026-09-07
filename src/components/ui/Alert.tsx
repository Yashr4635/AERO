import React from 'react';
import type { AlertVariant } from '../../types';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-[#35C7FF]/10 border-[#35C7FF]/30 text-[#35C7FF]',
  success: 'bg-[#20D67A]/10 border-[#20D67A]/30 text-[#20D67A]',
  warning: 'bg-[#FFB020]/10 border-[#FFB020]/30 text-[#FFB020]',
  error: 'bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF3B30]',
  emergency: 'bg-[#FF3B30]/20 border-[#FF3B30]/50 text-white shadow-[0_0_15px_rgba(255,59,48,0.3)]',
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  emergency: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className = '',
  actions,
}: AlertProps) {
  return (
    <div
      className={`
        flex gap-3 p-4 border rounded-[8px] animate-fade-in
        ${variantClasses[variant]}
        ${variant === 'emergency' ? 'animate-pulse-emergency' : ''}
        ${className}
      `}
      role="alert"
    >
      <span className="shrink-0 mt-0.5">{icon || defaultIcons[variant]}</span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm mb-1">{title}</p>
        )}
        <div className="text-[13px] opacity-90">{children}</div>
        {actions && (
          <div className="mt-3 flex gap-2">{actions}</div>
        )}
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
