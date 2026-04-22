import { useState } from 'react';
import { useObstacles } from '@/context/ObstacleContext';
import { Alert, Obstacle } from '@/types/obstacle';
import { Bell, AlertTriangle, AlertCircle, Clock, MapPin, Check, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { enIN } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

const typeLabels: Record<string, string> = {
  pothole: 'Pothole',
  crack: 'Road Crack',
  water_hazard: 'Water Drain',
  debris: 'Road Debris',
};

interface AlertsPanelProps {
  limit?: number;
  onAlertClick?: (alert: Alert) => void;
  customAlerts?: Alert[];
}

export function AlertsPanel({ limit, onAlertClick, customAlerts }: AlertsPanelProps) {
  const { alerts, markAlertAsRead, obstacles, setSelectedObstacle, sendAlert } = useObstacles();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const baseAlerts = customAlerts || alerts;
  const displayAlerts = limit ? baseAlerts.slice(0, limit) : baseAlerts;

  const handleAlertClick = (alert: Alert) => {
    if (!alert.readAt) {
      markAlertAsRead(alert.id);
    }
    const obstacle = obstacles.find(o => o.obstacleId === alert.obstacleId);
    if (obstacle) {
      setSelectedObstacle(obstacle);
    }
    onAlertClick?.(alert);
  };

  const getAlertIcon = (severity?: string) => {
    switch (severity) {
      case 'high': return AlertTriangle;
      case 'medium': return AlertCircle;
      case 'low': return Check;
      default: return Bell;
    }
  };

  const getSeverityColorClass = (severity?: string) => {
    switch (severity) {
      case 'high': return 'text-severity-high bg-severity-high/20';
      case 'medium': return 'text-severity-medium bg-severity-medium/20';
      case 'low': return 'text-severity-low bg-severity-low/20';
      default: return 'text-primary bg-primary/20';
    }
  };

  const getAlertStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'sent': return 'text-status-reported';
      case 'acknowledged': return 'text-status-progress';
      case 'resolved': return 'text-status-resolved';
    }
  };

  const statusLabels: Record<Alert['status'], string> = {
    sent: 'Sent',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
  };

  const renderAlertMessage = (alert: Alert) => {
    const obstacle = obstacles.find(o => o.obstacleId === alert.obstacleId);
    const cleanMessage = alert.message?.split('View:')[0].replace(/https?:\/\/\S+/g, '').trim();
    if (!obstacle) return cleanMessage || alert.message;
    const typeLabel = typeLabels[obstacle.type] ?? obstacle.type;
    return `${obstacle.severity.toUpperCase()}: ${typeLabel} at ${obstacle.location.area}${cleanMessage ? ` - ${cleanMessage}` : ''}`;
  };

  const handleSendAlert = async (e: React.MouseEvent, obstacle: any) => {
    e.stopPropagation();
    if (!sendAlert) return;
    try {
      setSendingId(obstacle.id || obstacle.obstacle_id);
      await sendAlert(obstacle);
      toast({ title: 'Alert Resent', description: 'Notifications refreshed successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send notifications.' });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {displayAlerts.length === 0 ? (
        <div className="p-8 text-center glass-morphism rounded-2xl border border-white/5">
          <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">System idling. No active alerts.</p>
        </div>
      ) : (
        displayAlerts.map((alert, index) => {
          const isUnread = !alert.readAt;
          const obstacle = obstacles.find(o => o.obstacleId === alert.obstacleId);
          
          let interpretedSeverity = obstacle?.severity;
          if (!interpretedSeverity) {
            if (alert.type === 'high_severity') interpretedSeverity = 'high';
            else if (alert.message.toLowerCase().includes('medium')) interpretedSeverity = 'medium';
            else interpretedSeverity = 'low';
          }

          const Icon = getAlertIcon(interpretedSeverity);
          const colorClasses = getSeverityColorClass(interpretedSeverity);

          return (
            <div
              key={alert.id}
              className={cn(
                'notification-item animate-slide-in group relative overflow-hidden transition-all',
                isUnread && 'notification-unread',
                interpretedSeverity === 'high' && 'border-l-4 border-l-severity-high shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse-subtle',
                interpretedSeverity === 'medium' && 'border-l-4 border-l-severity-medium shadow-[0_0_15px_rgba(234,179,8,0.1)]',
                interpretedSeverity === 'low' && 'border-l-4 border-l-severity-low shadow-[0_0_15px_rgba(34,197,94,0.1)]'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleAlertClick(alert)}
            >
              <div className={cn('p-2 rounded-lg shrink-0', colorClasses.split(' ').pop())}>
                <Icon className={cn('w-4 h-4', colorClasses.split(' ')[0])} />
              </div>

              <div className="flex-1 min-w-0 px-1">
                <p className={cn(
                  'text-sm line-clamp-2 md:line-clamp-1',
                  isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'
                )}>
                  {renderAlertMessage(alert)}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDistanceToNow(alert.createdAt, { addSuffix: true, locale: enIN })}
                  </div>
                  <span className={cn('text-[10px] font-bold uppercase tracking-tight', getAlertStatusColor(alert.status))}>
                    • {statusLabels[alert.status]}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  className="p-1.5 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-primary transition-colors shrink-0"
                  title="View on Map"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAlertClick(alert);
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </button>

                {isUnread && (
                  <button
                    className="p-1.5 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-status-resolved transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAlertAsRead(alert.id);
                    }}
                    title="Mark Resolved"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                {alert.obstacleId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 px-3 text-[10px] font-bold tracking-tighter uppercase rounded-full border-blue-500/30 text-blue-500 hover:bg-blue-500/10",
                      sendingId === (obstacle?.id || alert.id) && "bg-blue-500/10"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (obstacle) {
                        handleSendAlert(e, obstacle);
                      } else {
                        const vObstacle: any = {
                          id: alert.id,
                          obstacle_id: alert.obstacleId,
                          type: alert.message.toLowerCase().includes('pothole') ? 'pothole' : 'debris',
                          severity: interpretedSeverity,
                          location: { area: alert.message.split('at ')[1] || 'Unknown' }
                        };
                        handleSendAlert(e, vObstacle);
                      }
                    }}
                    disabled={sendingId === (obstacle?.id || alert.id)}
                  >
                    {sendingId === (obstacle?.id || alert.id) ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3 mr-1" />
                    )}
                    {sendingId === (obstacle?.id || alert.id) ? "Sending..." : "RE-SEND"}
                  </Button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
