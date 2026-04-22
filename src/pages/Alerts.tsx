import { Header } from '@/components/layout/Header';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { useObstacles } from '@/context/ObstacleContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, RefreshCw, Search, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { Alert } from '@/types/obstacle';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function Alerts() {
  const { alerts, markAlertAsRead, unreadAlertCount, setSelectedObstacle, obstacles, isLoading } = useObstacles();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAlertClick = (alert: Alert) => {
    const obstacle = obstacles.find(o => o.obstacleId === alert.obstacleId);
    if (obstacle) {
      setSelectedObstacle(obstacle);
      navigate('/map');
    }
  };

  const markAllAsRead = () => {
    alerts.forEach(alert => {
      if (!alert.readAt) {
        markAlertAsRead(alert.id);
      }
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    const obstacle = obstacles.find(o => o.obstacleId === alert.obstacleId);
    const matchesFilter = filter === 'all' || (obstacle?.severity === filter);
    const matchesSearch = alert.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          obstacle?.location.area.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background/50">
      <Header
        title="Alert Intelligence"
        subtitle="Live monitoring and notification dispatch system"
      />

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Advanced Controls Bar */}
          <div className="glass-morphism p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search area or hazard..." 
                className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl focus:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('all')}
                className="rounded-full px-4"
              >
                All
              </Button>
              <Button 
                variant={filter === 'high' ? 'destructive' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('high')}
                className={cn("rounded-full px-4", filter === 'high' && "bg-severity-high hover:bg-severity-high/90")}
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Critical
              </Button>
              <Button 
                variant={filter === 'medium' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('medium')}
                className={cn("rounded-full px-4", filter === 'medium' && "bg-severity-medium text-black hover:bg-severity-medium/90")}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Medium
              </Button>
              <Button 
                variant={filter === 'low' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('low')}
                className={cn("rounded-full px-4", filter === 'low' && "bg-severity-low text-black hover:bg-severity-low/90")}
              >
                <ShieldQuestion className="w-4 h-4 mr-2" />
                Low
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-full transition-all",
              unreadAlertCount > 0 ? "bg-primary/10 border border-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}>
              <Bell className={cn("w-4 h-4", unreadAlertCount > 0 && "animate-bounce")} />
              <span className="text-sm font-semibold tracking-tight uppercase">
                {unreadAlertCount} notifications pending
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-white/10" 
                onClick={() => window.location.reload()}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
              {unreadAlertCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead} className="rounded-full border-primary/30 hover:bg-primary/5 text-primary">
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="glass-morphism rounded-3xl border border-white/5 shadow-2xl overflow-hidden min-h-[400px]">
            <div className="p-4 md:p-6 overflow-y-auto max-h-[70vh]">
              <AlertsPanel 
                onAlertClick={handleAlertClick} 
                customAlerts={filteredAlerts}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
