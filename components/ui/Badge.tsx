import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/20 text-warning-foreground border border-warning/40',
    error: 'bg-destructive/10 text-destructive border border-destructive/20',
    info: 'bg-accent/20 text-accent-foreground border border-accent/40',
    default: 'bg-secondary text-secondary-foreground border border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
