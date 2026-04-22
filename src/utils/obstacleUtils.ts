import { Obstacle } from '@/types/obstacle';

export const getObstacleTypeLabel = (type: Obstacle['type']): string => {
  const labels: Record<Obstacle['type'], string> = {
    pothole: 'Pothole',
    crack: 'Road Crack',
    water_hazard: 'Water Drain',
    debris: 'Road Debris',
  };
  return labels[type];
};

export const getObstacleTypeIcon = (type: Obstacle['type']): string => {
  const icons: Record<Obstacle['type'], string> = {
    pothole: '🕳️',
    crack: '⚡',
    water_hazard: '💧',
    debris: '🪨',
  };
  return icons[type];
};

// Salem center coordinates for map
export const SALEM_CENTER: [number, number] = [11.6643, 78.1460];
