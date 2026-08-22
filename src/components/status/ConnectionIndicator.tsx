import type { ConnectionState } from '../../types';
import { Tooltip } from '../ui/Tooltip';

interface ConnectionIndicatorProps {
  state: ConnectionState;
  className?: string;
  showLabel?: boolean;
}

const stateConfig: Record<ConnectionState, { color: string; label: string; animate: string }> = {
  connected: {
    color: 'bg-success-500',
    label: 'Connected',
    animate: '',
  },
  disconnected: {
    color: 'bg-emergency-500',
    label: 'Disconnected',
    animate: '',
  },
  reconnecting: {
    color: 'bg-warning-500',
    label: 'Reconnecting...',
    animate: 'animate-pulse-soft',
  },
};

export function ConnectionIndicator({
  state,
  className = '',
  showLabel = false,
}: ConnectionIndicatorProps) {
  const config = stateConfig[state];

  const indicator = (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status" aria-label={`Server connection: ${config.label}`}>
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${config.color} ${config.animate}`}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={`text-[12px] font-medium ${
          state === 'connected' ? 'text-success-400' :
          state === 'disconnected' ? 'text-emergency-400' :
          'text-warning-400'
        }`}>
          {config.label}
        </span>
      )}
    </div>
  );

  if (showLabel) return indicator;

  return (
    <Tooltip content={config.label}>
      {indicator}
    </Tooltip>
  );
}
