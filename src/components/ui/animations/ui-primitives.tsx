import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

// Hover lift card
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
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
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
