import React from 'react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        let borderClass = 'border-outline-variant';
        let icon = 'info';
        let iconColor = 'text-primary';

        if (toast.type === 'success') {
          borderClass = 'border-secondary/40';
          icon = 'check_circle';
          iconColor = 'text-secondary';
        } else if (toast.type === 'error') {
          borderClass = 'border-error/40';
          icon = 'error';
          iconColor = 'text-error';
        } else if (toast.type === 'warning') {
          borderClass = 'border-tertiary/40';
          icon = 'warning';
          iconColor = 'text-tertiary';
        }

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto p-3 rounded-lg bg-surface-container-high text-on-surface border ${borderClass} shadow-xl flex items-start gap-2.5 transition-all animate-in fade-in slide-in-from-bottom-2`}
          >
            <span className={`material-symbols-outlined text-lg ${iconColor} mt-0.5`}>
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold tracking-wide">{toast.title}</div>
              <div className="text-[11px] text-on-surface-variant break-words">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-outline hover:text-on-surface p-0.5 transition-colors"
              aria-label="Dismiss notification"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
