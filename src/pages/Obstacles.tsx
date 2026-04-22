import { Header } from '@/components/layout/Header';
import { ObstacleTable } from '@/components/dashboard/ObstacleTable';
import { useObstacles } from '@/context/ObstacleContext';
import { useNavigate } from 'react-router-dom';
import { Obstacle } from '@/types/obstacle';
import { Loader2, WifiOff } from 'lucide-react';

export default function Obstacles() {
  const { setSelectedObstacle, isLoading, obstaclesError } = useObstacles();
  const navigate = useNavigate();

  const handleViewOnMap = (obstacle: Obstacle) => {
    setSelectedObstacle(obstacle);
    navigate('/map');
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Obstacle Management"
        subtitle="View and manage all detected road obstacles"
      />

      <div className="p-6 space-y-4">
        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Loading obstacle data from Supabase…</span>
          </div>
        )}
        {obstaclesError && !isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>{obstaclesError} — The table may be empty or unavailable.</span>
          </div>
        )}

        <ObstacleTable onViewOnMap={handleViewOnMap} />
      </div>
    </div>
  );
}
