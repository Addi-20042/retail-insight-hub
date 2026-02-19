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
      hidden: { opacity: 0, y: 18 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] } },
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

// Chart skeleton with more realistic bars
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

// Animated number counter
export const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  locale?: string;
}> = ({ value, prefix = '', suffix = '', className, locale = 'en-IN' }) => (
  <motion.span
    className={className}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    key={value}
  >
    {prefix}{typeof value === 'number' ? value.toLocaleString(locale) : value}{suffix}
  </motion.span>
);

// Hover lift card — with subtle glow on hover
export const HoverCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div
    className={cn("transition-shadow", className)}
    whileHover={{ y: -3, boxShadow: '0 8px 32px -12px hsl(var(--primary) / 0.22)' }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// Page header with gradient title accent
export const PageHeader: React.FC<{
  title: string;
  description: string;
  children?: React.ReactNode;
}> = ({ title, description, children }) => (
  <motion.div
    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    initial={{ opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
        <span className="gradient-text">{title}</span>
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
    {children && (
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        {children}
      </motion.div>
    )}
  </motion.div>
);

// Glow badge
export const GlowBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}> = ({ children, variant = 'primary', className }) => {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
};
