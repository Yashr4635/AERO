import type { BadgeVariant, EmergencyStatus } from '../../types';
import { motion } from 'framer-motion';

/* ── Badge ── */
interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  info: 'bg-[#35C7FF]/10 text-[#35C7FF] border-[#35C7FF]/20',
  success: 'bg-[#20D67A]/10 text-[#20D67A] border-[#20D67A]/20',
  warning: 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/20',
  danger: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20',
  neutral: 'bg-bg-elevated text-text-secondary border-border-subtle',
  emergency: 'bg-[#FF3B30] text-white border-[#FF3B30]/50 shadow-[0_0_15px_rgba(255,59,48,0.3)]',
};

const dotColorClasses: Record<BadgeVariant, string> = {
  info: 'bg-[#35C7FF]',
  success: 'bg-[#20D67A]',
  warning: 'bg-[#FFB020]',
  danger: 'bg-[#FF3B30]',
  neutral: 'bg-text-secondary',
  emergency: 'bg-white animate-pulse',
};

export function Badge({
  variant = 'neutral',
  size = 'sm',
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
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
    </motion.span>
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
  const config = statusConfig[status] || { variant: 'neutral', label: status };
  return (
    <Badge variant={config.variant} size="md" dot className={className}>
      {config.label}
    </Badge>
  );
}
