import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ToastVariant } from '../../types';

/* ── Types ── */
interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

/* ── Context ── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

/* ── Toast Item ── */
const toastVariantClasses: Record<ToastVariant, string> = {
  info: 'bg-navy-800 border-info-600/50 text-info-200',
  success: 'bg-navy-800 border-success-600/50 text-success-200',
  warning: 'bg-navy-800 border-warning-600/50 text-warning-200',
  error: 'bg-navy-800 border-emergency-600/50 text-emergency-200',
};

const toastIcons: Record<ToastVariant, React.ReactNode> = {
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    timerRef.current = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`
        flex items-start gap-3 p-3 border rounded-[8px] shadow-overlay
        animate-slide-up max-w-sm w-full
        ${toastVariantClasses[toast.variant]}
      `}
      role="status"
      aria-live="polite"
    >
      <span className="shrink-0 mt-0.5">{toastIcons[toast.variant]}</span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm">{toast.title}</p>
        )}
        <p className="text-[13px] opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/* ── Provider ── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
