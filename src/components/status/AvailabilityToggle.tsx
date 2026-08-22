import type { AvailabilityStatus } from '../../types';

interface AvailabilityToggleProps {
  status: AvailabilityStatus;
  onChange: (status: AvailabilityStatus) => void;
  disabled?: boolean;
  className?: string;
}

export function AvailabilityToggle({
  status,
  onChange,
  disabled = false,
  className = '',
}: AvailabilityToggleProps) {
  const isAvailable = status === 'AVAILABLE';

  const handleToggle = () => {
    if (disabled) return;
    onChange(isAvailable ? 'UNAVAILABLE' : 'AVAILABLE');
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-[13px] font-medium text-navy-300">Status</span>
      <button
        role="switch"
        aria-checked={isAvailable}
        aria-label={`Availability: ${isAvailable ? 'Available' : 'Unavailable'}`}
        onClick={handleToggle}
        disabled={disabled || status === 'BUSY'}
        className={`
          relative w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isAvailable ? 'bg-success-600' : 'bg-navy-600'}
        `}
      >
        <span
          className={`
            absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${isAvailable ? 'left-6' : 'left-1'}
          `}
          aria-hidden="true"
        />
      </button>
      <span className={`text-[12px] font-semibold ${
        status === 'BUSY' ? 'text-warning-400' :
        isAvailable ? 'text-success-400' : 'text-navy-400'
      }`}>
        {status === 'BUSY' ? 'Busy' : isAvailable ? 'Available' : 'Unavailable'}
      </span>
    </div>
  );
}
