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
    'bg-info-600 text-white hover:bg-info-700 active:bg-info-800 focus-visible:ring-info-500',
  emergency:
    'bg-emergency-600 text-white hover:bg-emergency-700 active:bg-emergency-800 focus-visible:ring-emergency-500 shadow-emergency',
  success:
    'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 focus-visible:ring-success-500',
  danger:
    'bg-emergency-600 text-white hover:bg-emergency-700 active:bg-emergency-800 focus-visible:ring-emergency-500',
  ghost:
    'bg-transparent text-navy-200 hover:bg-navy-800 active:bg-navy-700 focus-visible:ring-navy-500',
  outline:
    'bg-transparent text-navy-200 border border-navy-600 hover:bg-navy-800 active:bg-navy-700 focus-visible:ring-navy-500',
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
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900
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
