import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ObstacleStatus } from '@/types/obstacle';
import { Clock, Loader2, CheckCircle2 } from 'lucide-react';

const statusConfig: Record<ObstacleStatus, { icon: typeof Clock; class: string; label: string }> = {
  reported: {
    icon: Clock,
    class: 'status-reported',
    label: 'Reported',
  },
  in_progress: {
    icon: Loader2,
    class: 'status-progress',
    label: 'In Progress',
  },
  resolved: {
    icon: CheckCircle2,
    class: 'status-resolved',
    label: 'Resolved',
  },
};

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: ObstacleStatus;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span
        ref={ref}
        className={cn('status-badge', config.class, className)}
        {...props}
      >
        <Icon className={cn('w-3 h-3', status === 'in_progress' && 'animate-spin')} />
        {config.label}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
