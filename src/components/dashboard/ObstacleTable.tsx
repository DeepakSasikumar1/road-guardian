import { useState } from 'react';
import { useObstacles } from '@/context/ObstacleContext';
import { Obstacle, SeverityLevel, ObstacleStatus } from '@/types/obstacle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { getObstacleTypeLabel, getObstacleTypeIcon } from '@/utils/obstacleUtils';
import { 
  Loader2,
  Search,
  Filter,
  MapPin,
  PlayCircle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

type SortField = 'id' | 'type' | 'severity' | 'detectedAt' | 'status';
type SortOrder = 'asc' | 'desc';

interface ObstacleTableProps {
  onViewOnMap?: (obstacle: Obstacle) => void;
}

export function ObstacleTable({ onViewOnMap }: ObstacleTableProps) {
  const { obstacles, updateObstacleStatus, deleteObstacle, isLoading } = useObstacles();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ObstacleStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('detectedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const severityPriority = { high: 0, medium: 1, low: 2 };

  const typeLabels: Record<string, string> = {
    pothole: 'Pothole',
    crack: 'Road Crack',
    water_hazard: 'Water Drain',
    debris: 'Road Debris',
  };

  const filteredObstacles = obstacles
    .filter(o => {
      const matchesSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.location.area.toLowerCase().includes(search.toLowerCase()) ||
        o.type.toLowerCase().includes(search.toLowerCase()) ||
        (typeLabels[o.type] ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || o.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'severity':
          comparison = severityPriority[a.severity] - severityPriority[b.severity];
          break;
        case 'detectedAt':
          comparison = a.detectedAt.getTime() - b.detectedAt.getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="cursor-pointer hover:bg-secondary/80 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  const handleViewEvidence = (obstacle: Obstacle) => {
    if (obstacle.imageUrl) {
      setPreviewImage({
        url: obstacle.imageUrl,
        title: `${typeLabels[obstacle.type] ?? obstacle.type} Evidence - ${obstacle.location.area}`
      });
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-border flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, area, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityLevel | 'all')}
            className="h-9 px-3 rounded-md bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ObstacleStatus | 'all')}
            className="h-9 px-3 rounded-md bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All</option>
            <option value="reported">Reported</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredObstacles.length} of {obstacles.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <SortHeader field="id">ID</SortHeader>
              <SortHeader field="type">Type</SortHeader>
              <SortHeader field="severity">Severity</SortHeader>
              <th>Location</th>
              <SortHeader field="detectedAt">Detected</SortHeader>
              <SortHeader field="status">Status</SortHeader>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredObstacles.map((obstacle, index) => (
              <tr
                key={obstacle.id}
                className={cn(
                  'animate-fade-in group',
                  obstacle.severity === 'high' && obstacle.status !== 'resolved' && 'bg-severity-high/5'
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="font-mono text-xs font-medium">{obstacle.id.split('-')[0]}...</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn(
                        "relative w-10 h-10 rounded-md overflow-hidden border border-border bg-secondary/50 flex items-center justify-center shrink-0",
                        obstacle.imageUrl && "cursor-zoom-in hover:ring-2 hover:ring-primary/50 transition-all"
                      )}
                      onClick={() => obstacle.imageUrl && handleViewEvidence(obstacle)}
                    >
                      {obstacle.imageUrl ? (
                        <img 
                          src={obstacle.imageUrl} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">{getObstacleTypeIcon(obstacle.type)}</span>
                      )}
                      {obstacle.imageUrl && (
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImageIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{typeLabels[obstacle.type] ?? obstacle.type}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {obstacle.imageUrl ? 'Evidence Attached' : 'No Image'}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <SeverityBadge severity={obstacle.severity} />
                </td>
                <td>
                  <div className="max-w-[150px]">
                    <p className="font-medium truncate">{obstacle.location.area}</p>
                    <p className="text-xs text-muted-foreground truncate">{obstacle.location.address}</p>
                  </div>
                </td>
                <td className="text-xs text-muted-foreground">
                  {obstacle.detectedAt.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td>
                  <StatusBadge status={obstacle.status} />
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    {obstacle.status === 'reported' && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => updateObstacleStatus(obstacle.id, 'in_progress')}
                        title="Mark In Progress"
                      >
                        <PlayCircle className="w-4 h-4 text-status-progress" />
                      </Button>
                    )}
                    {obstacle.status === 'in_progress' && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => updateObstacleStatus(obstacle.id, 'resolved')}
                        title="Mark Resolved"
                      >
                        <CheckCircle className="w-4 h-4 text-status-resolved" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onViewOnMap?.(obstacle)}
                      title="View on Map"
                    >
                      <MapPin className="w-4 h-4 text-primary" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewOnMap?.(obstacle)}>
                          <MapPin className="w-4 h-4 mr-2" /> View on Map
                        </DropdownMenuItem>

                        {obstacle.imageUrl && (
                          <>
                            <DropdownMenuItem onClick={() => handleViewEvidence(obstacle)}>
                              <ImageIcon className="w-4 h-4 mr-2" /> View Evidence
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(obstacle.imageUrl, '_blank')}>
                              <ExternalLink className="w-4 h-4 mr-2" /> Open in New Tab
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />

                        {obstacle.status !== 'resolved' && (
                          <>
                            {obstacle.status === 'reported' && (
                              <DropdownMenuItem onClick={() => updateObstacleStatus(obstacle.id, 'in_progress')}>
                                <PlayCircle className="w-4 h-4 mr-2" /> Start Progress
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => updateObstacleStatus(obstacle.id, 'resolved')}>
                              <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            deleteObstacle(obstacle.id);
                          }}
                        >
                          <Filter className="w-4 h-4 mr-2" /> Mark as False Alarm
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Skeleton loading rows */}
      {isLoading && obstacles.length === 0 && (
        <div className="divide-y divide-border/40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
              <div className="h-4 bg-secondary rounded w-24" />
              <div className="h-4 bg-secondary rounded w-32" />
              <div className="h-5 bg-secondary rounded-full w-16" />
              <div className="h-4 bg-secondary rounded flex-1" />
              <div className="h-4 bg-secondary rounded w-28" />
              <div className="h-5 bg-secondary rounded-full w-20" />
              <div className="h-6 bg-secondary rounded w-16" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredObstacles.length === 0 && (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3 hidden" />
          <p className="text-muted-foreground">No obstacles found matching your criteria.</p>
        </div>
      )}

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
