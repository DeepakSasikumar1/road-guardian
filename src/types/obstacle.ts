export type ObstacleType = 'pothole' | 'crack' | 'water_hazard' | 'debris';
export type SeverityLevel = 'low' | 'medium' | 'high';
export type ObstacleStatus = 'reported' | 'in_progress' | 'resolved';
export type AlertStatus = 'sent' | 'acknowledged' | 'resolved';

export interface Obstacle {
  id: string; // UUID
  obstacleId?: string; // Text ID (RODS-XXX) for linking
  type: ObstacleType;
  severity: SeverityLevel;
  location: {
    lat: number;
    lng: number;
    address: string;
    area: string;
  };
  detectedAt: Date;
  status: ObstacleStatus;
  assignedTo?: string;
  resolvedAt?: Date;
  imageUrl?: string;
  isFalseDetection?: boolean;
}

export interface Alert {
  id: string;
  obstacleId: string;
  type: 'high_severity' | 'new_detection' | 'status_change';
  message: string;
  status: AlertStatus;
  createdAt: Date;
  readAt?: Date;
  emailSent?: boolean;
  smsSent?: boolean;
}

export interface DashboardStats {
  totalObstacles: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  activeAlerts: number;
  resolvedToday: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'authority';
  department?: string;
}
