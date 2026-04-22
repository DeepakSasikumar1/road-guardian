import { useState } from 'react';
import { useObstacles } from '@/context/ObstacleContext';
import { getObstacleTypeIcon } from '@/utils/obstacleUtils';
import { SeverityBadge } from './SeverityBadge';
import { formatDistanceToNow } from 'date-fns';
import { enIN } from 'date-fns/locale';
import { TrendingUp, Clock, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useNavigate } from 'react-router-dom';
import { Alert, Obstacle } from '@/types/obstacle';

export function RecentActivity() {
  const { obstacles, setSelectedObstacle } = useObstacles();
  const navigate = useNavigate();
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const handleObstacleClick = (obstacle: Obstacle) => {
    setSelectedObstacle(obstacle);
    navigate('/map');
  };

  const recentObstacles = [...obstacles]
    .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
    .slice(0, 5);

  const typeLabels: Record<string, string> = {
    pothole: 'Pothole',
    crack: 'Road Crack',
    water_hazard: 'Water Drain',
    debris: 'Road Debris',
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Recent Detections</h3>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> LIVE
        </span>
      </div>

      <div className="divide-y divide-border/50">
        {recentObstacles.map((obstacle, index) => (
          <div
            key={obstacle.id}
            className="p-4 hover:bg-secondary/30 transition-colors animate-slide-in cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => handleObstacleClick(obstacle)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{typeLabels[obstacle.type] ?? obstacle.type}</span>
                  <SeverityBadge severity={obstacle.severity} size="sm" showIcon={false} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{obstacle.location.area} • {obstacle.location.address}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {formatDistanceToNow(obstacle.detectedAt, { addSuffix: true, locale: enIN })}
                </p>
              </div>

              {obstacle.imageUrl ? (
                <div 
                  className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border cursor-zoom-in hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage({
                      url: obstacle.imageUrl!,
                      title: `${typeLabels[obstacle.type] ?? obstacle.type} Detection - ${obstacle.location.area}`
                    });
                  }}
                >
                  <img 
                    src={obstacle.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ImageIcon className="w-3 h-3 text-white" />
                  </div>
                </div>
              ) : (
                <div className="text-2xl shrink-0 opacity-50">{getObstacleTypeIcon(obstacle.type)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-none">
          <DialogHeader className="p-4 bg-background/10 backdrop-blur-md absolute top-0 inset-x-0 z-10">
            <DialogTitle className="text-white text-base">
              {previewImage?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video flex items-center justify-center p-4 pt-16">
            <img 
              src={previewImage?.url} 
              alt="Full detection" 
              className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
