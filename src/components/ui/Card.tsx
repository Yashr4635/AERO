import React from 'react';

/* ── Card ── */
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'compact';
  className?: string;
  onClick?: () => void;
}

export function Card({ children, variant = 'default', className = '', onClick }: CardProps) {
  const base = 'enterprise-card';
  const variants = {
    default: 'p-6',
    interactive: 'p-6 cursor-pointer hover:border-brand-primary/50',
    compact: 'p-4',
  };

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      className={`${base} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...(onClick ? { type: 'button' as const } : {})}
    >
      {children}
    </Tag>
  );
}

/* ── Card Header ── */
export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-[13px] text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
