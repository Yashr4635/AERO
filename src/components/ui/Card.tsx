import React from 'react';

/* ── Card ── */
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'compact';
  className?: string;
  onClick?: () => void;
}

export function Card({ children, variant = 'default', className = '', onClick }: CardProps) {
  const base = 'bg-navy-800 border border-navy-600/50 rounded-[8px] shadow-card';
  const variants = {
    default: 'p-5',
    interactive: 'p-5 cursor-pointer hover:bg-navy-700/80 hover:border-navy-500/50 transition-colors duration-150',
    compact: 'p-3',
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
        <h3 className="text-base font-semibold text-navy-50">{title}</h3>
        {subtitle && <p className="text-[13px] text-navy-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
