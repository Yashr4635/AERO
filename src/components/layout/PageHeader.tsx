interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 px-4 py-3 sm:px-6 ${className}`}>
      <div>
        <h1 className="text-lg font-semibold text-navy-50">{title}</h1>
        {subtitle && <p className="text-[13px] text-navy-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
