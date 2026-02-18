import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

// Staggered container
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className, staggerDelay = 0.06 }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: staggerDelay } },
    }}
  >
    {children}
  </motion.div>
);

// Fade-up item
export const FadeUp: React.FC<HTMLMotionProps<'div'> & { children: React.ReactNode }> = ({ 
  children, className, ...props 
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Scale-in item
export const ScaleIn: React.FC<HTMLMotionProps<'div'> & { children: React.ReactNode }> = ({ 
  children, className, ...props 
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, scale: 0.92 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
    }}
    {...props}
  >
    {children}
  </motion.div>
);

// Shimmer loading skeleton
export const ShimmerSkeleton: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { className?: string }
> = ({ className, style, ...props }) => (
  <div className={cn(
    "relative overflow-hidden rounded-lg bg-muted",
    className
  )} style={style} {...props}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

// Stat card skeleton
export const StatCardSkeleton: React.FC = () => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <ShimmerSkeleton className="h-4 w-24 mb-2" />
        <ShimmerSkeleton className="h-8 w-32" />
      </div>
      <ShimmerSkeleton className="w-10 h-10 rounded-lg" />
    </div>
  </div>
);

// Chart skeleton
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-[280px]" }) => (
  <div className={`${height} flex items-end gap-2 px-8 pb-4`}>
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="flex-1 flex flex-col justify-end">
        <ShimmerSkeleton
          className="w-full rounded-t-sm"
          style={{ height: `${20 + Math.random() * 60}%` } as React.CSSProperties}
        />
      </div>
    ))}
  </div>
);

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    <div className="flex gap-4 py-2">
      {Array.from({ length: cols }).map((_, i) => (
        <ShimmerSkeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3 border-t border-border/30">
        {Array.from({ length: cols }).map((_, j) => (
          <ShimmerSkeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Animated number counter
export const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({ value, prefix = '', suffix = '', className }) => (
  <motion.span
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    key={value}
  >
    {prefix}{value.toLocaleString()}{suffix}
  </motion.span>
);

// Hover lift card
export const HoverCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div
    className={cn("transition-shadow", className)}
    whileHover={{ y: -2, boxShadow: '0 8px 30px -12px hsl(var(--primary) / 0.15)' }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

// Page header with animated underline
export const PageHeader: React.FC<{
  title: string;
  description: string;
  children?: React.ReactNode;
}> = ({ title, description, children }) => (
  <motion.div
    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-1">{description}</p>
    </div>
    {children && <div className="flex items-center gap-3">{children}</div>}
  </motion.div>
);
