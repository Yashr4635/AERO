import type { GPSState } from '../../types';
import { Tooltip } from '../ui/Tooltip';

interface GPSIndicatorProps {
  state: GPSState;
  accuracy?: number;
  className?: string;
  showLabel?: boolean;
}

const stateConfig: Record<GPSState, { label: string; color: string; animate: string }> = {
  acquiring: {
    label: 'Acquiring GPS...',
    color: 'text-warning-400',
    animate: 'animate-pulse-soft',
  },
  active: {
    label: 'GPS Active',
    color: 'text-success-400',
    animate: '',
  },
  unavailable: {
    label: 'GPS Unavailable',
    color: 'text-emergency-400',
    animate: '',
  },
};

function GPSSvg({ state }: { state: GPSState }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {state === 'unavailable' ? (
        <>
          <line x1="2" y1="2" x2="22" y2="22" />
          <path d="M8.5 16.5a5 5 0 017 0" opacity="0.3" />
          <path d="M2 8.82a15 15 0 014.17-2.65" />
          <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
          <path d="M16.85 11.25a10 10 0 00-2.16-1.22" />
          <path d="M5 12.86a10 10 0 012.54-1.7" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </>
      ) : (
        <>
          <path d="M12 2a7 7 0 017 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 017-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </>
      )}
    </svg>
  );
}

export function GPSIndicator({
  state,
  accuracy,
  className = '',
  showLabel = false,
}: GPSIndicatorProps) {
  const config = stateConfig[state];
  const labelText = state === 'active' && accuracy != null
    ? `GPS ±${Math.round(accuracy)}m`
    : config.label;

  const indicator = (
    <div
      className={`inline-flex items-center gap-1.5 ${config.color} ${config.animate} ${className}`}
      role="status"
      aria-label={labelText}
    >
      <GPSSvg state={state} />
      {showLabel && (
        <span className="text-[12px] font-medium">{labelText}</span>
      )}
    </div>
  );

  if (showLabel) return indicator;

  return (
    <Tooltip content={labelText}>
      {indicator}
    </Tooltip>
  );
}
