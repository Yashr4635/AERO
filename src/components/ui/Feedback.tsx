/* ── Skeleton Loaders ── */

interface SkeletonProps {
  className?: string;
}

const shimmer = 'bg-navy-700/60 animate-pulse rounded-[4px]';

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return <div className={`h-4 ${shimmer} ${className}`} />;
}

export function SkeletonCircle({ className = '' }: SkeletonProps) {
  return <div className={`w-10 h-10 rounded-full ${shimmer} ${className}`} />;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-navy-800 border border-navy-600/50 rounded-[8px] p-5 space-y-3 ${className}`}>
      <div className={`h-5 w-1/3 ${shimmer}`} />
      <div className={`h-4 w-full ${shimmer}`} />
      <div className={`h-4 w-2/3 ${shimmer}`} />
      <div className="flex gap-2 pt-2">
        <div className={`h-8 w-20 ${shimmer} rounded-[6px]`} />
        <div className={`h-8 w-20 ${shimmer} rounded-[6px]`} />
      </div>
    </div>
  );
}

export function SkeletonMap({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-navy-800 rounded-[8px] flex items-center justify-center ${className}`}>
      <div className="text-center">
        <svg className="mx-auto mb-2 text-navy-600 animate-pulse" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <p className="text-[13px] text-navy-500">Loading map...</p>
      </div>
    </div>
  );
}

/* ── Empty State ── */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {icon || (
        <svg className="text-navy-500 mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" />
        </svg>
      )}
      <h3 className="text-base font-semibold text-navy-200 mb-1">{title}</h3>
      {description && (
        <p className="text-[13px] text-navy-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Error State ── */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <svg className="text-emergency-400 mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <h3 className="text-base font-semibold text-emergency-300 mb-1">{title}</h3>
      <p className="text-[13px] text-navy-400 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium bg-navy-700 text-navy-200 rounded-[6px] hover:bg-navy-600 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/* ── Offline Overlay ── */
interface OfflineOverlayProps {
  show: boolean;
  message?: string;
}

export function OfflineOverlay({
  show,
  message = 'You are offline. Emergency features are unavailable.',
}: OfflineOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9500] bg-navy-950/90 flex flex-col items-center justify-center p-6 animate-fade-in">
      <svg className="text-warning-400 mb-4 animate-pulse-soft" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
        <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0122.56 9" />
        <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
        <path d="M8.53 16.11a6 6 0 016.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <h2 className="text-xl font-bold text-navy-100 mb-2">Connection Lost</h2>
      <p className="text-sm text-navy-400 text-center max-w-sm" role="alert" aria-live="assertive">
        {message}
      </p>
      <p className="text-[12px] text-navy-500 mt-4">
        Reconnecting automatically...
      </p>
    </div>
  );
}
