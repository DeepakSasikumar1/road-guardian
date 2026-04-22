import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { LeafletMap } from '@/components/dashboard/LeafletMap';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useObstacles } from '@/context/ObstacleContext';
import { useAlertNotifications } from '@/hooks/useAlertNotifications';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  CheckCircle2,
  TrendingUp,
  Loader2,
  WifiOff,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert } from '@/types/obstacle';

export default function Dashboard() {
  useAlertNotifications();
  const { stats, isLoading, obstaclesError, alertsError, setSelectedObstacle, obstacles } = useObstacles();
  const navigate = useNavigate();

  const handleAlertClick = (alert: Alert) => {
    const obstacle = obstacles.find(o => o.obstacleId === alert.obstacleId);
    if (obstacle) {
      setSelectedObstacle(obstacle);
      navigate('/map');
    }
  };

  const hasError = obstaclesError || alertsError;

  return (
    <div className="min-h-screen">
      <Header
        title="Command Center"
        subtitle="Real-time road obstacle monitoring"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Connecting to live data…</span>
          </div>
        )}

        {hasError && !isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              {obstaclesError || alertsError} — Showing cached data. Real-time updates may be delayed.
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Detections" value={stats.totalObstacles} icon={TrendingUp} variant="primary" />
          <StatCard title="High Severity" value={stats.highSeverity} icon={AlertTriangle} variant="high" trend={{ value: 12, isUp: true }} />
          <StatCard title="Medium Severity" value={stats.mediumSeverity} icon={AlertCircle} variant="medium" />
          <StatCard title="Low Severity" value={stats.lowSeverity} icon={Info} variant="low" />
          <StatCard title="Active Alerts" value={stats.activeAlerts} icon={Bell} variant="high" />
          <StatCard title="Resolved Today" value={stats.resolvedToday} icon={CheckCircle2} variant="low" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Map */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Live Map View</h2>
              <Link to="/map">
                <Button variant="ghost" size="sm">Open Full Map →</Button>
              </Link>
            </div>
            <LeafletMap height="500px" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-severity-high" />
                  <h3 className="font-semibold">Critical Alerts</h3>
                </div>
                <Link to="/alerts">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              <div className="p-3 max-h-[300px] overflow-y-auto">
                <AlertsPanel limit={5} onAlertClick={handleAlertClick} />
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <RecentActivity />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
