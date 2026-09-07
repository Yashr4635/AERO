import React from 'react';
import type { ButtonVariant, ButtonSize } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'enterprise-button-primary',
  emergency:
    'bg-status-error text-white hover:bg-red-600 active:scale-95 shadow-[0_0_20px_rgba(229,57,53,0.4)]',
  success:
    'bg-status-success text-[#0B0D10] font-bold hover:brightness-110 active:scale-95',
  danger:
    'bg-status-error text-white hover:bg-red-600 active:scale-95',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5 active:scale-95',
  outline:
    'enterprise-button-secondary',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[13px] gap-1.5 rounded-[6px] min-h-[32px]',
  md: 'px-4 py-2 text-sm gap-2 rounded-[6px] min-h-[40px]',
  lg: 'px-5 py-2.5 text-base gap-2 rounded-[8px] min-h-[48px]',
  xl: 'px-6 py-3 text-lg gap-3 rounded-[8px] min-h-[56px] font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        transition-colors duration-150 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin shrink-0"
          width={size === 'sm' ? 14 : size === 'xl' ? 22 : 18}
          height={size === 'sm' ? 14 : size === 'xl' ? 22 : 18}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : icon ? (
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
