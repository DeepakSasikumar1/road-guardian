import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  User,
  Bell,
  Shield,
  Database,
  Mail,
  Smartphone,
  Volume2,
  Save,
  Loader2,
  MapPin,
  LogOut
} from 'lucide-react';

export default function Settings() {
  const { user, logout, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [notifications, setNotifications] = useState({
    sound: true,
    email: true,
    sms: true,
  });

  // Load user profile and notification settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        // Load profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFormData({
            name: profile.name || '',
            email: user.email || '',
            phone: profile.phone || '',
          });
        }

        // Load notification settings
        const { data: recipient } = await supabase
          .from('alert_recipients')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (recipient) {
          setNotifications({
            sound: true,
            email: recipient.receive_email ?? true,
            sms: true, // Always on
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.id, user?.email]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: 'Error',
        description: 'Failed to save changes',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      // Check if recipient exists
      const { data: existing } = await supabase
        .from('alert_recipients')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('alert_recipients')
          .update({
            receive_email: notifications.email,
            receive_sms: true, // Always on
            phone: formData.phone || null,
            severity_filter: ['high', 'medium', 'low'], // Default to all for now
          })
          .eq('user_id', user?.id);
      } else {
        await supabase
          .from('alert_recipients')
          .insert({
            user_id: user?.id,
            email: user?.email || '',
            receive_email: notifications.email,
            receive_sms: true, // Always on
            phone: formData.phone || null,
            severity_filter: ['high', 'medium', 'low'],
          });
      }

      toast({
        title: 'Success',
        description: 'Notification preferences updated',
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: 'Error',
        description: 'Failed to save changes',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your account settings and preferences" />

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">


          {/* Notification Settings */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Notifications</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sound Alerts</p>
                    <p className="text-sm text-muted-foreground">Play sound for critical detections</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.sound}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, sound: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive high priority alerts via email</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">SMS Alerts</p>
                    <p className="text-sm text-muted-foreground">Send SMS for emergency situations</p>
                  </div>
                </div>
                <Switch
                  checked={true}
                  disabled={true}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Notifications
                </Button>
              </div>
            </div>
          </div>

          {/* Coverage Area */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Coverage Area</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Steel Plant Junction', 'Fairlands', 'Hasthampatti', 'Suramangalam', 'Shevapet', 'Ammapet', 'Kondalampatti', 'Ayothiyapattinam', 'Omalur Road', 'Yercaud Foothills', 'Five Roads', 'Junction Main Road'].map((area) => (
                  <div key={area} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                    <div className="w-2 h-2 rounded-full bg-severity-low" />
                    <span className="text-sm">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">System Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">RoadWatch AI v2.0.0</p>
                </div>
                <div>
                  <p className="text-muted-foreground">API Status</p>
                  <p className="font-medium text-severity-low">● Connected</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-medium">{new Date().toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Refresh Rate</p>
                  <p className="font-medium">15 seconds</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Region</p>
                  <p className="font-medium">Salem District, Tamil Nadu</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Detection Model</p>
                  <p className="font-medium">YOLOv8 + CNN</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Emergency Line</p>
                  <a
                    href="tel:1033"
                    className="font-medium text-destructive hover:underline flex items-center gap-1"
                  >
                    1033
                    <span className="text-xs font-normal text-muted-foreground">(NHAI Helpline)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Security</h2>
            </div>
            <div className="p-6 space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
