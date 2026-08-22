import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  icon,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-navy-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-navy-800 border rounded-[6px] px-3 py-2 text-sm text-navy-50
            placeholder:text-navy-500
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-navy-900
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${error
              ? 'border-emergency-500 focus:ring-emergency-500'
              : 'border-navy-600 hover:border-navy-500 focus:ring-info-500 focus:border-info-500'
            }
          `}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-[12px] text-emergency-400 flex items-center gap-1" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[12px] text-navy-400">
          {hint}
        </p>
      )}
    </div>
  );
}
