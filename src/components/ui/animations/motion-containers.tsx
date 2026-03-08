import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

// Staggered container
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className, staggerDelay = 0.03 }) => (
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
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } },
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
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
    }}
    {...props}
  >
    {children}
  </motion.div>
);
