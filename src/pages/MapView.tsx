import { Header } from '@/components/layout/Header';
import { LeafletMap } from '@/components/dashboard/LeafletMap';
import { useObstacles } from '@/context/ObstacleContext';
import { SeverityBadge } from '@/components/dashboard/SeverityBadge';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { getObstacleTypeLabel, getObstacleTypeIcon } from '@/utils/obstacleUtils';
import { Button } from '@/components/ui/button';
import { X, PlayCircle, CheckCircle, Navigation, Loader2, WifiOff } from 'lucide-react';

export default function MapView() {
  const { selectedObstacle, setSelectedObstacle, updateObstacleStatus, isLoading, obstaclesError } = useObstacles();

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Live Map" subtitle="Real-time obstacle locations across Salem district" />

      <div className="flex-1 relative">
        <LeafletMap height="calc(100vh - 64px)" />

        {/* Loading / Error status overlay */}
        {isLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2 px-4 py-2 rounded-full bg-card/95 backdrop-blur-sm border border-primary/30 text-primary text-xs shadow-lg animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading live obstacles…
          </div>
        )}
        {obstaclesError && !isLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2 px-4 py-2 rounded-full bg-card/95 backdrop-blur-sm border border-destructive/30 text-destructive text-xs shadow-lg">
            <WifiOff className="w-3.5 h-3.5" />
            {obstaclesError}
          </div>
        )}

        {/* Selected Obstacle Detail Panel */}
        {selectedObstacle && (
          <div className="absolute left-6 top-6 w-80 bg-card rounded-xl border border-border shadow-elevated animate-slide-in">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getObstacleTypeIcon(selectedObstacle.type)}</span>
                <div>
                  <h3 className="font-semibold">{getObstacleTypeLabel(selectedObstacle.type)}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{selectedObstacle.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedObstacle(null)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={selectedObstacle.severity} />
                <StatusBadge status={selectedObstacle.status} />
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedObstacle.location.area}</p>
                  <p className="text-sm text-muted-foreground">{selectedObstacle.location.address}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">GPS Coordinates</p>
                  <p className="text-sm font-mono">
                    {selectedObstacle.location.lat.toFixed(6)}, {selectedObstacle.location.lng.toFixed(6)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Detected</p>
                  <p className="text-sm">
                    {selectedObstacle.detectedAt.toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                {selectedObstacle.assignedTo && (
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="text-sm font-medium">{selectedObstacle.assignedTo}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-border space-y-2">
                {selectedObstacle.status === 'reported' && (
                  <Button
                    className="w-full"
                    variant="warning"
                    onClick={() => updateObstacleStatus(selectedObstacle.id, 'in_progress')}
                  >
                    <PlayCircle className="w-4 h-4" />
                    Mark In Progress
                  </Button>
                )}
                {selectedObstacle.status === 'in_progress' && (
                  <Button
                    className="w-full"
                    variant="success"
                    onClick={() => updateObstacleStatus(selectedObstacle.id, 'resolved')}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Resolved
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${selectedObstacle.location.lat},${selectedObstacle.location.lng}`,
                      '_blank'
                    );
                  }}
                >
                  <Navigation className="w-4 h-4" />
                  View on Maps
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
