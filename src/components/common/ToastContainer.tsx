import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
        let borderClass = 'border-emerald-500/30 dark:border-emerald-500/20';

        if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
          borderClass = 'border-amber-500/30 dark:border-amber-500/20';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
          borderClass = 'border-rose-500/30 dark:border-rose-500/20';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-[#F97316] shrink-0" />;
          borderClass = 'border-orange-500/30 dark:border-orange-500/20';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#141414] border ${borderClass} shadow-lg shadow-black/5 dark:shadow-black/50 animate-fade-in transition-all`}
          >
            <div className="flex items-center gap-3">
              {icon}
              <span className="text-sm font-medium text-[#171717] dark:text-[#FAFAFA]">
                {toast.title}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
