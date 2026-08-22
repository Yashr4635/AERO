import type { BadgeVariant, EmergencyStatus } from '../../types';

/* ── Badge ── */
interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  info: 'bg-info-900/60 text-info-300 border-info-700/50',
  success: 'bg-success-900/60 text-success-300 border-success-700/50',
  warning: 'bg-warning-900/60 text-warning-300 border-warning-700/50',
  danger: 'bg-emergency-900/60 text-emergency-300 border-emergency-700/50',
  neutral: 'bg-navy-700/60 text-navy-300 border-navy-600/50',
  emergency: 'bg-emergency-600 text-white border-emergency-500',
};

const dotColorClasses: Record<BadgeVariant, string> = {
  info: 'bg-info-400',
  success: 'bg-success-400',
  warning: 'bg-warning-400',
  danger: 'bg-emergency-400',
  neutral: 'bg-navy-400',
  emergency: 'bg-white',
};

export function Badge({
  variant = 'neutral',
  size = 'sm',
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap
        ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]'}
        ${badgeVariantClasses[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClasses[variant]}`} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

/* ── StatusBadge (Emergency-specific) ── */
interface StatusBadgeProps {
  status: EmergencyStatus;
  className?: string;
}

const statusConfig: Record<EmergencyStatus, { variant: BadgeVariant; label: string }> = {
  PENDING: { variant: 'warning', label: 'PENDING' },
  ACCEPTED: { variant: 'info', label: 'ACCEPTED' },
  ACTIVE: { variant: 'emergency', label: 'ACTIVE' },
  COMPLETED: { variant: 'success', label: 'COMPLETED' },
  CANCELLED: { variant: 'neutral', label: 'CANCELLED' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} size="md" dot className={className}>
      {config.label}
    </Badge>
  );
}
