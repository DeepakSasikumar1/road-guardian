import React, { createContext, useContext, useState, useCallback } from 'react';
import { Obstacle, Alert, DashboardStats } from '@/types/obstacle';
import { supabase } from '@/integrations/supabase/client';
import { useObstacleData } from '@/hooks/useObstacleData';
import { useAlertsData } from '@/hooks/useAlertsData';

// ─── Context type ─────────────────────────────────────────────────────────────

interface ObstacleContextType {
  obstacles: Obstacle[];
  alerts: Alert[];
  stats: DashboardStats;
  selectedObstacle: Obstacle | null;
  setSelectedObstacle: (obstacle: Obstacle | null) => void;
  updateObstacleStatus: (id: string, status: Obstacle['status']) => void;
  markAlertAsRead: (id: string) => void;
  markAllAlertsAsRead: () => void;
  unreadAlertCount: number;
  /** True while the initial obstacles/alerts fetch is in progress */
  isLoading: boolean;
  /** Non-null when a fetch error occurred */
  obstaclesError: string | null;
  alertsError: string | null;
  sendAlert: (obstacle: Obstacle) => Promise<any>;
}

const ObstacleContext = createContext<ObstacleContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateStats(obstacles: Obstacle[], alerts: Alert[]): DashboardStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    totalObstacles: obstacles.length,
    highSeverity: obstacles.filter((o) => o.severity === 'high' && o.status !== 'resolved').length,
    mediumSeverity: obstacles.filter((o) => o.severity === 'medium' && o.status !== 'resolved').length,
    lowSeverity: obstacles.filter((o) => o.severity === 'low' && o.status !== 'resolved').length,
    activeAlerts: alerts.filter((a) => !a.readAt).length,
    resolvedToday: obstacles.filter((o) => o.resolvedAt && o.resolvedAt >= today).length,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ObstacleProvider({ children }: { children: React.ReactNode }) {
  const {
    obstacles,
    loading: obstaclesLoading,
    error: obstaclesError,
    updateObstacleStatusInDB,
  } = useObstacleData();

  const {
    alerts,
    loading: alertsLoading,
    error: alertsError,
    markAlertAsReadInDB,
    markAllAlertsAsReadInDB,
  } = useAlertsData();

  const [selectedObstacle, setSelectedObstacle] = useState<Obstacle | null>(null);

  const isLoading = obstaclesLoading || alertsLoading;
  const stats = calculateStats(obstacles, alerts);
  const unreadAlertCount = alerts.filter((a) => !a.readAt).length;

  // ── Status update: delegates to DB then local state via real-time reflection
  const updateObstacleStatus = useCallback(
    (id: string, status: Obstacle['status']) => {
      updateObstacleStatusInDB(id, status);
    },
    [updateObstacleStatusInDB]
  );

  // ── Alert actions
  const markAlertAsRead = useCallback(
    (id: string) => {
      markAlertAsReadInDB(id);
    },
    [markAlertAsReadInDB]
  );

  const markAllAlertsAsRead = useCallback(() => {
    markAllAlertsAsReadInDB();
  }, [markAllAlertsAsReadInDB]);

  // ── Edge-function helper for manual alerts
  const sendAlert = async (obstacle: Obstacle) => {
    const { data: result, error } = await supabase.functions.invoke('send-alert', {
      body: {
        obstacleId: (obstacle as any).obstacle_id || obstacle.id,
        obstacleType: obstacle.type,
        severity: obstacle.severity,
        location: {
          lat: obstacle.location?.lat || (obstacle as any).lat || 0,
          lng: obstacle.location?.lng || (obstacle as any).lng || 0,
          address: obstacle.location?.address || (obstacle as any).address || 'Unknown',
          area: obstacle.location?.area || (obstacle as any).area || 'Unknown',
        },
        detectedAt: obstacle.detectedAt || new Date().toISOString(),
      },
    });
    
    if (error) {
      console.error('Failed to trigger send-alert Edge Function:', error);
      throw new Error(error.message || 'Failed to send alert');
    }
    
    return result;
  };

  return (
    <ObstacleContext.Provider
      value={{
        obstacles,
        alerts,
        stats,
        selectedObstacle,
        setSelectedObstacle,
        updateObstacleStatus,
        markAlertAsRead,
        markAllAlertsAsRead,
        unreadAlertCount,
        isLoading,
        obstaclesError,
        alertsError,
        sendAlert,
      }}
    >
      {children}
    </ObstacleContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useObstacles() {
  const context = useContext(ObstacleContext);
  if (context === undefined) {
    throw new Error('useObstacles must be used within an ObstacleProvider');
  }
  return context;
}
