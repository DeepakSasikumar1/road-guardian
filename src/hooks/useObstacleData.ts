import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Obstacle } from '@/types/obstacle';
import { useToast } from '@/hooks/use-toast';
/** Maps a raw Supabase obstacles row to the app's Obstacle type */
function mapRowToObstacle(row: any): Obstacle {
  return {
    id: row.id,
    obstacleId: row.obstacle_id, // Map the text ID (RODS-XXX)
    type: row.type,
    severity: row.severity,
    location: {
      lat: row.lat,
      lng: row.lng,
      address: row.address,
      area: row.area,
    },
    detectedAt: new Date(row.detected_at),
    status: row.status,
    assignedTo: row.assigned_to ?? undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
    imageUrl: row.image_url ?? undefined,
    isFalseDetection: row.is_false_detection ?? false,
  };
}

interface UseObstacleDataReturn {
  obstacles: Obstacle[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateObstacleStatusInDB: (id: string, status: Obstacle['status']) => Promise<void>;
  deleteObstacleFromDB: (id: string) => Promise<void>;
}

export function useObstacleData(): UseObstacleDataReturn {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchObstacles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('obstacles')
        .select('*')
        .order('detected_at', { ascending: false });

      if (fetchError) throw fetchError;

      const realData = (data ?? []).map(mapRowToObstacle);
      setObstacles(realData);
    } catch (err: any) {
      const message = err?.message ?? 'Failed to fetch obstacles';
      setError(message);
      console.error('[useObstacleData] Fetch error:', err);
      // Empty array on error to prevent old state persistence
      setObstacles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchObstacles();
  }, [fetchObstacles]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('obstacles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'obstacles' },
        (payload) => {
          console.log('[useObstacleData] Real-time event:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            const newObstacle = mapRowToObstacle(payload.new);
            setObstacles((prev) => [newObstacle, ...prev.filter((o) => o.id !== newObstacle.id)]);

            if (newObstacle.severity === 'high') {
              toast({
                title: '🚨 High Severity Alert',
                description: `Critical ${newObstacle.type.replace('_', ' ')} detected at ${newObstacle.location.area}`,
                variant: 'destructive',
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapRowToObstacle(payload.new);
            setObstacles((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).obstacle_id;
            setObstacles((prev) => prev.filter((o) => o.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        console.log('[useObstacleData] Channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  /** Updates obstacle status both locally and in the database */
  const updateObstacleStatusInDB = useCallback(
    async (id: string, status: Obstacle['status']) => {
      // Optimistic local update
      setObstacles((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          return {
            ...o,
            status,
            resolvedAt: status === 'resolved' ? new Date() : o.resolvedAt,
            assignedTo:
              status !== 'reported'
                ? o.assignedTo ?? `TEAM-${Math.floor(Math.random() * 10) + 1}`
                : o.assignedTo,
          };
        })
      );

      try {
        const updatePayload: any = {
          status,
          updated_at: new Date().toISOString(),
        };
        if (status === 'resolved') {
          updatePayload.resolved_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('obstacles')
          .update(updatePayload)
          .eq('id', id);

        if (updateError) throw updateError;
      } catch (err: any) {
        console.error('[useObstacleData] Update error:', err);
        toast({
          title: 'Update Failed',
          description: 'Could not update obstacle status. Please try again.',
          variant: 'destructive',
        });
        // Revert optimistic update by re-fetching
        fetchObstacles();
      }
    },
    [fetchObstacles, toast]
  );

  const deleteObstacleFromDB = useCallback(
    async (id: string) => {
      // Optimistic delete
      setObstacles((prev) => prev.filter((o) => o.id !== id));

      try {
        const { error: deleteError } = await supabase
          .from('obstacles')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        
        toast({
          title: 'False Alarm Removed',
          description: 'The invalid detection has been permanently deleted.',
        });
      } catch (err: any) {
        console.error('[useObstacleData] Delete error:', err);
        toast({
          title: 'Deletion Failed',
          description: 'Could not delete the false detection.',
          variant: 'destructive',
        });
        fetchObstacles();
      }
    },
    [fetchObstacles, toast]
  );

  return { obstacles, loading, error, refetch: fetchObstacles, updateObstacleStatusInDB, deleteObstacleFromDB };
}
