import React from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder = 'Select...',
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-[13px] font-medium text-navy-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full bg-navy-800 border rounded-[6px] px-3 py-2 text-sm text-navy-50
            appearance-none cursor-pointer pr-10
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-navy-900
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? 'border-emergency-500 focus:ring-emergency-500'
              : 'border-navy-600 hover:border-navy-500 focus:ring-info-500 focus:border-info-500'
            }
          `}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          <option value="" disabled className="text-navy-500">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-[12px] text-emergency-400" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${selectId}-hint`} className="text-[12px] text-navy-400">
          {hint}
        </p>
      )}
    </div>
  );
}
