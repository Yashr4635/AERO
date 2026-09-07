interface ETADisplayProps {
  etaSeconds: number;
  distanceMeters: number;
  speed?: number;
  className?: string;
  compact?: boolean;
}

function formatETA(seconds: number): string {
  if (seconds < 60) return `<1 min`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function ETADisplay({
  etaSeconds,
  distanceMeters,
  speed,
  className = '',
  compact = false,
}: ETADisplayProps) {
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-3 text-[13px] ${className}`}>
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">{formatETA(etaSeconds)}</span>
          {' '}ETA
        </span>
        <span className="text-border-strong">|</span>
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">{formatDistance(distanceMeters)}</span>
        </span>
        {speed != null && (
          <>
            <span className="text-border-strong">|</span>
            <span className="text-text-secondary">
              <span className="font-semibold text-text-primary">{Math.round(speed)}</span> km/h
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex gap-4 ${className}`} role="status" aria-label={`ETA: ${formatETA(etaSeconds)}, Distance: ${formatDistance(distanceMeters)}`}>
      {/* ETA */}
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-text-primary tabular-nums">
          {formatETA(etaSeconds)}
        </span>
        <span className="text-[11px] font-medium tracking-[0.05em] uppercase text-text-secondary">
          ETA
        </span>
      </div>

      <div className="w-px bg-border-subtle" />

      {/* Distance */}
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-text-primary tabular-nums">
          {formatDistance(distanceMeters)}
        </span>
        <span className="text-[11px] font-medium tracking-[0.05em] uppercase text-text-secondary">
          Distance
        </span>
      </div>

      {speed != null && (
        <>
          <div className="w-px bg-border-subtle" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-text-primary tabular-nums">
              {Math.round(speed)}
            </span>
            <span className="text-[11px] font-medium tracking-[0.05em] uppercase text-text-secondary">
              km/h
            </span>
          </div>
        </>
      )}
    </div>
  );
}
