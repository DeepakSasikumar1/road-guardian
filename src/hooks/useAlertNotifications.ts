import { useEffect, useRef } from 'react';
import { useObstacles } from '@/context/ObstacleContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useAlertNotifications() {
  const { alerts, obstacles, sendAlert } = useObstacles();
  const { toast } = useToast();
  const previousAlertsRef = useRef<Set<string>>(new Set());
  const previousObstaclesRef = useRef<Set<string>>(new Set());

  // Track new obstacles and show toast notifications
  useEffect(() => {
    // 🚩 CRITICAL: If this is the FIRST run, just populate the ref and exit.
    // This prevents the system from "re-alerting" for every old item in the DB on mount.
    if (previousObstaclesRef.current.size === 0 && obstacles.length > 0) {
      obstacles.forEach(o => previousObstaclesRef.current.add(o.id));
      console.log(`[useAlertNotifications] Initialized with ${obstacles.length} existing obstacles.`);
      return;
    }

    const currentObstacleIds = new Set(obstacles.map(o => o.id));
    
    obstacles.forEach(obstacle => {
      if (!previousObstaclesRef.current.has(obstacle.id)) {
        // This is a GENUINELY new detection from real-time stream
        if (obstacle.severity === 'high') {
          toast({
            variant: "destructive",
            title: "🚨 LIVE: High Severity Alert",
            description: `${obstacle.type.replace('_', ' ').toUpperCase()} detected at ${obstacle.location.area}`,
          });
          // Auto-trigger for autonomous/background detections only
          // (Manual reports are already handled by ManualUpload.tsx)
        } else {
          toast({
            title: `New ${obstacle.severity} Detection`,
            description: `${obstacle.type.replace('_', ' ')} detected at ${obstacle.location.area}`,
          });
        }
        previousObstaclesRef.current.add(obstacle.id);
      }
    });
  }, [obstacles, toast]);

  // Track new alerts
  useEffect(() => {
    const currentAlertIds = new Set(alerts.map(a => a.id));
    
    alerts.forEach(alert => {
      if (!previousAlertsRef.current.has(alert.id) && !alert.readAt) {
        // Play notification sound (if supported)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('RoadWatch Alert', {
            body: alert.message,
            icon: '/favicon.ico',
          });
        }
      }
    });

    previousAlertsRef.current = currentAlertIds;
  }, [alerts]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
}
