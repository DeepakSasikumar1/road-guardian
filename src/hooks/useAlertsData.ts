import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/types/obstacle';
/** Maps a raw Supabase alerts row to the app's Alert type */
function mapRowToAlert(row: any): Alert {
  return {
    id: row.id, // switched to UUID
    obstacleId: row.obstacle_id ?? '',
    type: row.type as Alert['type'],
    message: row.message,
    status: row.status as Alert['status'],
    createdAt: new Date(row.created_at),
    readAt: row.read_at ? new Date(row.read_at) : undefined,
    emailSent: row.email_sent ?? undefined,
    smsSent: row.sms_sent ?? undefined,
  };
}

interface UseAlertsDataReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAlertAsReadInDB: (id: string) => Promise<void>;
  markAllAlertsAsReadInDB: () => Promise<void>;
}

export function useAlertsData(): UseAlertsDataReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // 👈 INCREASED LIMIT: Show ALL alerts (up to 1000)

      if (fetchError) throw fetchError;

      const realData = (data ?? []).map(mapRowToAlert);
      setAlerts(realData);
    } catch (err: any) {
      const message = err?.message ?? 'Failed to fetch alerts';
      setError(message);
      console.error('[useAlertsData] Fetch error:', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Real-time subscription for new alerts
  useEffect(() => {
    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('[useAlertsData] New alert:', payload.new);
          const newAlert = mapRowToAlert(payload.new);
          setAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('[useAlertsData] Alert updated:', payload.new);
          const updated = mapRowToAlert(payload.new);
          setAlerts((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
        }
      )
      .subscribe((status) => {
        console.log('[useAlertsData] Channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /** Marks a single alert as read both locally and in DB */
  const markAlertAsReadInDB = useCallback(async (id: string) => {
    const now = new Date();
    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, readAt: now } : a))
    );

    try {
      const { error: updateError } = await supabase
        .from('alerts')
        .update({ read_at: now.toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('[useAlertsData] markAlertAsRead error:', err);
      // Revert optimistic update
      fetchAlerts();
    }
  }, [fetchAlerts]);

  /** Marks ALL unread alerts as read both locally and in DB */
  const markAllAlertsAsReadInDB = useCallback(async () => {
    const now = new Date();
    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => ({ ...a, readAt: a.readAt ?? now }))
    );

    try {
      const { error: updateError } = await supabase
        .from('alerts')
        .update({ read_at: now.toISOString() })
        .is('read_at', null);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('[useAlertsData] markAllAlertsAsRead error:', err);
      fetchAlerts();
    }
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    markAlertAsReadInDB,
    markAllAlertsAsReadInDB,
  };
}
