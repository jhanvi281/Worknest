import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  badge?: string;
  badgeType?: 'default' | 'success' | 'warning' | 'accent';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  subtitle,
  badge,
  badgeType = 'default',
  onClick,
  className = '',
}) => {
  const badgeClasses = {
    default: 'bg-neutral-100 dark:bg-neutral-800 text-[#737373] dark:text-[#A3A3A3]',
    success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50',
    warning: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50',
    accent: 'bg-orange-50 dark:bg-orange-950/40 text-[#F97316] dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/50',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-3xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex flex-col justify-between transition-all ${
        onClick ? 'cursor-pointer hover:border-orange-300 dark:hover:border-orange-800/60 hover:shadow-md' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] truncate">
          {label}
        </span>
        <div className="p-2.5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[#F97316] shrink-0">
          <Icon className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <div className="text-2xl md:text-3xl font-extrabold text-[#171717] dark:text-[#FAFAFA] tracking-tight">
          {value}
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeClasses[badgeType]}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-[11px] text-[#737373] dark:text-[#A3A3A3] truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};

