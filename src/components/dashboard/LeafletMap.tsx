import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useObstacles } from '@/context/ObstacleContext';
import { Obstacle } from '@/types/obstacle';
import { getObstacleTypeLabel } from '@/utils/obstacleUtils';

interface LeafletMapProps {
  height?: string;
  onMarkerClick?: (obstacle: Obstacle) => void;
}

const severityColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const createCustomIcon = (severity: 'high' | 'medium' | 'low') => {
  const color = severityColors[severity];
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px ${color}80, 0 0 20px ${color}40;
        ${severity === 'high' ? 'animation: pulse 1.5s infinite;' : ''}
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const severityLabel: Record<string, string> = {
  high: 'High Severity',
  medium: 'Medium Severity',
  low: 'Low Severity',
};

export function LeafletMap({ height = '500px', onMarkerClick }: LeafletMapProps) {
  const { obstacles, selectedObstacle, setSelectedObstacle } = useObstacles();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Salem center
  const center: [number, number] = [11.6643, 78.1460];

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Slight initial zoom animation
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(center, 12, {
          animate: true,
          duration: 1.5
        });
      }
    }, 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when obstacles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    obstacles
      .filter(o => o.status !== 'resolved')
      .forEach(obstacle => {
        const marker = L.marker([obstacle.location.lat, obstacle.location.lng], {
          icon: createCustomIcon(obstacle.severity),
        });

        marker.bindPopup(`
          <div style="min-width: 180px; font-family: system-ui, sans-serif;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1e293b;">
              ${getObstacleTypeLabel(obstacle.type)}
            </div>
            <div style="display: flex; gap: 6px; margin-bottom: 8px;">
              <span style="
                background: ${obstacle.severity === 'high' ? '#fef2f2' : obstacle.severity === 'medium' ? '#fffbeb' : '#f0fdf4'};
                color: ${obstacle.severity === 'high' ? '#dc2626' : obstacle.severity === 'medium' ? '#d97706' : '#16a34a'};
                padding: 2px 8px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 500;
                text-transform: uppercase;
              ">${severityLabel[obstacle.severity] ?? obstacle.severity}</span>
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
              📍 ${obstacle.location.area}
            </div>
            <div style="font-size: 11px; color: #94a3b8;">
              ${obstacle.location.address}
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              Detected: ${obstacle.detectedAt.toLocaleString('en-IN')}
            </div>
          </div>
        `, {
          className: 'custom-popup',
        });

        marker.on('click', () => {
          setSelectedObstacle(obstacle);
          onMarkerClick?.(obstacle);
        });

        marker.addTo(map);
        markersRef.current.set(obstacle.id, marker);
      });
  }, [obstacles, setSelectedObstacle, onMarkerClick]);

  // Pan to selected obstacle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedObstacle) return;

    map.flyTo([selectedObstacle.location.lat, selectedObstacle.location.lng], 15, {
      duration: 1,
    });

    const marker = markersRef.current.get(selectedObstacle.id);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedObstacle]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-border">
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="z-0"
      />

      {/* Legend overlay */}
      <div className="absolute left-4 bottom-4 p-3 bg-card/95 backdrop-blur-sm rounded-lg border border-border z-[1000]">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Severity</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-severity-high shadow-glow-danger" />
            <span className="text-xs text-foreground">High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-severity-medium" />
            <span className="text-xs text-foreground">Medium Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-severity-low" />
            <span className="text-xs text-foreground">Low Severity</span>
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute right-4 bottom-4 p-3 bg-card/95 backdrop-blur-sm rounded-lg border border-border z-[1000]">
        <p className="text-xs font-semibold text-muted-foreground mb-1">Active Hazards</p>
        <p className="text-2xl font-bold text-foreground">
          {obstacles.filter(o => o.status !== 'resolved').length}
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
