import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { SeverityLevel } from '@/types/obstacle';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const severityLabels: Record<SeverityLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

interface SeverityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  severity: SeverityLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const SeverityBadge = forwardRef<HTMLSpanElement, SeverityBadgeProps>(
  ({ severity, showIcon = true, size = 'md', className, ...props }, ref) => {
    const icons = {
      high: AlertTriangle,
      medium: AlertCircle,
      low: Info,
    };

    const Icon = icons[severity];

    return (
      <span
        ref={ref}
        className={cn(
          'severity-badge',
          `severity-${severity}`,
          size === 'sm' && 'text-[10px] px-2 py-0.5',
          className
        )}
        {...props}
      >
        {showIcon && <Icon className={cn('w-3 h-3', size === 'sm' && 'w-2.5 h-2.5')} />}
        {severityLabels[severity]}
      </span>
    );
  }
);

SeverityBadge.displayName = 'SeverityBadge';
