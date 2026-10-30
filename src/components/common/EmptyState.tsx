import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`py-12 px-6 text-center bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[#737373] dark:text-[#A3A3A3] flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 stroke-[1.75]" />
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm md:text-base font-bold text-[#171717] dark:text-[#FAFAFA] tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

