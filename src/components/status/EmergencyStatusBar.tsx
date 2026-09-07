import type { EmergencyStatus } from '../../types';

interface EmergencyStatusBarProps {
  status: EmergencyStatus;
  className?: string;
}

const stages: { key: EmergencyStatus; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Complete' },
];

const statusOrder: Record<EmergencyStatus, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  ACTIVE: 2,
  COMPLETED: 3,
  CANCELLED: -1,
};

export function EmergencyStatusBar({ status, className = '' }: EmergencyStatusBarProps) {
  const currentIndex = statusOrder[status];

  if (status === 'CANCELLED') {
    return (
      <div className={`flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border-subtle rounded-[8px] ${className}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span className="text-sm font-medium text-text-secondary">Emergency Cancelled</span>
      </div>
    );
  }

  return (
    <div
      className={`px-4 py-3 bg-bg-surface border border-border-subtle rounded-[8px] ${className}`}
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={stages.length}
      aria-label={`Emergency status: ${status}`}
    >
      {/* Status label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold tracking-[0.05em] uppercase text-text-secondary">
          Emergency Status
        </span>
        <span className={`text-[12px] font-semibold ${
          status === 'ACTIVE' ? 'text-[#FF3B30]' :
          status === 'COMPLETED' ? 'text-[#20D67A]' :
          status === 'ACCEPTED' ? 'text-[#35C7FF]' :
          'text-warning-400'
        }`}>
          {status}
        </span>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-1">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Bar segment */}
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted
                      ? 'w-full bg-success-500'
                      : isCurrent
                        ? status === 'ACTIVE'
                          ? 'w-full bg-[#FF3B30]'
                          : status === 'COMPLETED'
                            ? 'w-full bg-success-500'
                            : 'w-1/2 bg-[#35C7FF]'
                        : 'w-0'
                  }`}
                />
              </div>
              {/* Label */}
              <span className={`text-[10px] font-medium ${
                isCompleted ? 'text-[#20D67A]' :
                isCurrent ? (status === 'ACTIVE' ? 'text-[#FF3B30]' : 'text-[#35C7FF]') :
                'text-text-secondary/50'
              }`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
