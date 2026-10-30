import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ActionConfig {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

interface PageHeaderProps {
  badge?: string;
  badgeIcon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ActionConfig[];
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  badge,
  badgeIcon: BadgeIcon,
  title,
  description,
  actions = [],
  children,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      <div className="space-y-1">
        {badge && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#F97316] uppercase tracking-wider">
            {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
            <span>{badge}</span>
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#171717] dark:text-[#FAFAFA] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A3A3A3] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
        {actions.map((act, i) => {
          const ActionIcon = act.icon;
          const isPrimary = act.variant !== 'secondary';
          return (
            <button
              key={i}
              type="button"
              disabled={act.disabled}
              onClick={act.onClick}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer ${
                isPrimary
                  ? 'bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white'
                  : 'bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C]'
              }`}
            >
              {ActionIcon && <ActionIcon className="w-4 h-4" />}
              <span>{act.label}</span>
            </button>
          );
        })}
        {children}
      </div>
    </div>
  );
};

