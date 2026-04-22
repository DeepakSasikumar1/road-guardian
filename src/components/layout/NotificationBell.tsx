import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useObstacles } from '@/context/ObstacleContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SeverityBadge } from '@/components/dashboard/SeverityBadge';
import { formatDistanceToNow } from 'date-fns';
import { enIN } from 'date-fns/locale';
import { Alert } from '@/types/obstacle';

export function NotificationBell() {
  const { alerts, unreadAlertCount, markAlertAsRead, markAllAlertsAsRead, obstacles } = useObstacles();
  const [isOpen, setIsOpen] = useState(false);

  const recentAlerts = alerts.slice(0, 10);

  const handleMarkAllRead = () => {
    markAllAlertsAsRead();
  };

  const handleAlertClick = (alertId: string) => {
    markAlertAsRead(alertId);
  };

  const renderAlertMessage = (alert: Alert) => {
    const obstacle = obstacles.find(o => o.id === alert.obstacleId);
    if (!obstacle) return alert.message;

    const typeLabel = obstacle.type.replace('_', ' ');
    const baseMessage = alert.type === 'high_severity'
      ? `🚨 High Severity: ${typeLabel}`
      : `New Detection: ${typeLabel}`;

    return `${baseMessage} at ${obstacle.location.area}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="glass" size="icon-sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-severity-high text-[9px] font-bold text-white px-1">
              {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-card border-border"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadAlertCount > 0 ? `${unreadAlertCount} unread alerts` : 'All caught up!'}
            </p>
          </div>
          {unreadAlertCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {recentAlerts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => handleAlertClick(alert.id)}
                  className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${!alert.readAt ? 'bg-primary/5' : ''
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!alert.readAt ? 'bg-primary' : 'bg-muted'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge
                          severity={alert.type === 'high_severity' ? 'high' : 'medium'}
                          size="sm"
                        />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: enIN })}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{renderAlertMessage(alert)}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {alert.emailSent && (
                          <span className="text-status-resolved">✓ Email Sent</span>
                        )}
                        {alert.smsSent && (
                          <span className="text-status-resolved">✓ SMS Sent</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border">
          <Link to="/alerts" onClick={() => setIsOpen(false)}>
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="w-3 h-3 mr-2" />
              View All Alerts
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
