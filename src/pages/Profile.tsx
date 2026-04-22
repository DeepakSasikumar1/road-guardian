import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
    User,
    Save,
    Loader2,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

export default function Profile() {
    const { user, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
    });
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [isResetExpanded, setIsResetExpanded] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Load user profile on mount
    useEffect(() => {
        const loadProfile = async () => {
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
                        department: profile.department || 'Road Authority',
                    });
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
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
                    department: formData.department,
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

    const handlePasswordReset = async () => {
        if (newPassword.length < 8) {
            toast({
                variant: "destructive",
                title: 'Error',
                description: 'Password must be at least 8 characters',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: 'Error',
                description: 'Passwords do not match',
            });
            return;
        }

        setIsResetting(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setNewPassword('');
            setConfirmPassword('');
            setIsResetExpanded(false);
            toast({
                title: 'Success',
                description: 'Password updated successfully',
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: 'Error',
                description: error.message || 'Update failed',
            });
        } finally {
            setIsResetting(false);
        }
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
            <Header title="My Profile" subtitle="Manage your personal information and security" />

            <div className="p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Profile Section */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            <h2 className="font-semibold">Personal Information</h2>
                        </div>

                        <div className="p-8">
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                                    <span className="text-4xl font-bold text-primary">
                                        {formData.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="text-2xl font-bold">{formData.name || 'User'}</h3>
                                    <p className="text-muted-foreground">{user?.email}</p>
                                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        {formData.department}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-secondary/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="bg-secondary/50 opacity-70"
                                    />
                                    <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-secondary/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        placeholder="Department"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="bg-secondary/50"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <Button onClick={handleSaveProfile} disabled={isSaving} className="min-w-[120px]">
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => setIsResetExpanded(!isResetExpanded)}
                            className="w-full p-4 border-b border-border flex items-center justify-between hover:bg-secondary/20 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold">Security & Password</h2>
                            </div>
                            {isResetExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>

                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isResetExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="new-password"
                                                type={showPasswords ? "text" : "password"}
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="bg-secondary/50 pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type={showPasswords ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="bg-secondary/50"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Validation Feedback */}
                                <div className="space-y-2 bg-secondary/30 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium mb-2">Password Requirements:</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className={`flex items-center gap-2 text-sm ${newPassword.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                            {newPassword.length >= 8 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            At least 8 characters
                                        </div>
                                        <div className={`flex items-center gap-2 text-sm ${newPassword && newPassword === confirmPassword ? 'text-green-500' : 'text-muted-foreground'}`}>
                                            {newPassword && newPassword === confirmPassword ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            Passwords match
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button
                                        onClick={handlePasswordReset}
                                        disabled={isResetting || newPassword.length < 8 || newPassword !== confirmPassword}
                                        className="min-w-[150px]"
                                    >
                                        {isResetting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Password'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
