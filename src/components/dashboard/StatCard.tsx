import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'high' | 'medium' | 'low' | 'primary';
  trend?: { value: number; isUp: boolean };
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, variant = 'default', trend, subtitle }: StatCardProps) {
  const variantClasses = {
    default: 'stat-card',
    high: 'stat-card stat-card-high',
    medium: 'stat-card stat-card-medium',
    low: 'stat-card stat-card-low',
    primary: 'stat-card stat-card-primary',
  };

  const iconColors = {
    default: 'text-muted-foreground',
    high: 'text-severity-high',
    medium: 'text-severity-medium',
    low: 'text-severity-low',
    primary: 'text-primary',
  };

  return (
    <div className={cn(variantClasses[variant], 'animate-fade-in')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2 animate-count-up">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              trend.isUp ? 'text-severity-high' : 'text-severity-low'
            )}>
              <span>{trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">vs yesterday</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          variant === 'high' && 'bg-severity-high/10',
          variant === 'medium' && 'bg-severity-medium/10',
          variant === 'low' && 'bg-severity-low/10',
          variant === 'primary' && 'bg-primary/10',
          variant === 'default' && 'bg-secondary'
        )}>
          <Icon className={cn('w-6 h-6', iconColors[variant])} />
        </div>
      </div>
    </div>
  );
}
