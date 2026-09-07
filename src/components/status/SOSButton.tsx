import { useState } from 'react';
import { Dialog } from '../ui/Dialog';

interface SOSButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  hospitalName?: string;
  disabledReason?: string;
  className?: string;
}

export function SOSButton({
  disabled = false,
  loading = false,
  onConfirm,
  hospitalName,
  disabledReason,
  className = '',
}: SOSButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onConfirm();
  };

  return (
    <>
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <button
          onClick={handleClick}
          disabled={disabled || loading}
          className={`
            relative w-20 h-20 rounded-full
            flex items-center justify-center
            text-white font-bold text-lg tracking-wide
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3B30] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main
            ${disabled
              ? 'bg-white/10 cursor-not-allowed opacity-50'
              : loading
                ? 'bg-[#FF3B30]/80 cursor-wait'
                : 'bg-[#FF3B30] hover:bg-[#FF3B30]/90 active:bg-[#FF3B30]/70 cursor-pointer shadow-[0_0_20px_rgba(255,59,48,0.4)] hover:shadow-[0_0_30px_rgba(255,59,48,0.5)]'
            }
          `}
          aria-label="Send Emergency SOS"
        >
          {loading ? (
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              <span className="relative z-10">SOS</span>
              {!disabled && (
                <span className="absolute inset-0 rounded-full animate-pulse-emergency" aria-hidden="true" />
              )}
            </>
          )}
        </button>
        {disabled && disabledReason && (
          <p className="text-[11px] text-text-secondary text-center max-w-[180px]">
            {disabledReason}
          </p>
        )}
      </div>

      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        variant="emergency"
        title="Confirm Emergency Alert"
        description="You are about to send an emergency SOS to all available traffic police officers."
        confirmLabel="CONFIRM SOS"
        cancelLabel="Cancel"
      >
        {hospitalName && (
          <div className="bg-bg-surface rounded-[6px] p-3 text-sm">
            <span className="text-text-secondary">Destination: </span>
            <span className="text-text-primary font-medium">{hospitalName}</span>
          </div>
        )}
      </Dialog>
    </>
  );
}
