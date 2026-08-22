import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  variant?: 'default' | 'danger' | 'emergency';
  loading?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  loading = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => dialogRef.current?.focus(), 0);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const confirmVariant = variant === 'emergency' ? 'emergency' : variant === 'danger' ? 'danger' : 'primary';

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        tabIndex={-1}
        className={`
          relative bg-navy-800 border rounded-[12px] shadow-modal
          w-full max-w-md p-6 animate-slide-up
          focus:outline-none
          ${variant === 'emergency' ? 'border-emergency-600/70' : 'border-navy-600'}
        `}
      >
        <h2
          id="dialog-title"
          className={`text-lg font-semibold ${variant === 'emergency' ? 'text-emergency-300' : 'text-navy-50'}`}
        >
          {title}
        </h2>
        {description && (
          <p id="dialog-description" className="text-[13px] text-navy-300 mt-2">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button
              variant={confirmVariant}
              size="md"
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
