import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-neutral-200/70 dark:bg-neutral-800/80 rounded-xl ${className}`}
    />
  );
};

export const CardSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = '',
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-5 rounded-3xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm space-y-4 ${className}`}
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-2xl" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </>
  );
};

export const TableRowSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 4, columns: _columns }) => {
  return (
    <div className="divide-y divide-[#E5E5E5] dark:divide-[#333333]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="w-4 h-4 rounded-md shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-2/3 max-w-sm" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
          <Skeleton className="h-4 w-20 shrink-0 hidden sm:block" />
        </div>
      ))}
    </div>
  );
};

