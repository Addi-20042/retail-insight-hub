import React from 'react';
import { cn } from '@/lib/utils';

// Shimmer loading skeleton
export const ShimmerSkeleton: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { className?: string }
> = ({ className, style, ...props }) => (
  <div className={cn(
    "relative overflow-hidden rounded-lg bg-muted",
    className
  )} style={style} {...props}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

// Stat card skeleton
export const StatCardSkeleton: React.FC = () => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <ShimmerSkeleton className="h-3.5 w-20 mb-3" />
        <ShimmerSkeleton className="h-7 w-28" />
      </div>
      <ShimmerSkeleton className="w-9 h-9 rounded-lg" />
    </div>
  </div>
);

// Chart skeleton with realistic bars
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-[280px]" }) => {
  const barHeights = [45, 62, 38, 75, 55, 80, 48, 70, 42, 68, 58, 72];
  return (
    <div className={`${height} flex items-end gap-2 px-8 pb-4`}>
      {barHeights.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <ShimmerSkeleton
            className="w-full rounded-t-sm"
            style={{ height: `${h}%` } as React.CSSProperties}
          />
        </div>
      ))}
    </div>
  );
};

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    <div className="flex gap-4 py-2">
      {Array.from({ length: cols }).map((_, i) => (
        <ShimmerSkeleton key={i} className={`h-4 ${i === 0 ? 'w-32' : 'flex-1'}`} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3 border-t border-border/30">
        {Array.from({ length: cols }).map((_, j) => (
          <ShimmerSkeleton key={j} className={`h-4 ${j === 0 ? 'w-32' : 'flex-1'}`} />
        ))}
      </div>
    ))}
  </div>
);
