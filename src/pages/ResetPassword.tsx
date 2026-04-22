import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a session (Supabase handles the hash fragment automatically)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session but we're on this page, maybe the link expired or is invalid
        // But let's allow the user to try updating if they just landed from the link
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        toast({
          variant: "destructive",
          title: 'Update Failed',
          description: error.message,
        });
      } else {
        setIsSuccess(true);
        toast({
          title: 'Success',
          description: 'Your password has been reset successfully.',
        });
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 justify-center">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white">
              <img src="/logo.png" alt="RoadWatch AI" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold">RoadWatch AI</h1>
              <p className="text-xs text-muted-foreground">Smart Monitoring</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold">Reset Your Password</h2>
          <p className="text-muted-foreground mt-2">
            Enter your new password below to regain access to your account.
          </p>
        </div>

        {isSuccess ? (
          <div className="bg-primary/10 p-8 rounded-2xl border border-primary/20 text-center space-y-6 animate-count-up">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto ring-8 ring-primary/5">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl text-primary">Password Updated</h3>
              <p className="text-muted-foreground">
                Your password has been changed successfully. You will be redirected to the login page shortly.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Go to Login Now
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl border border-border shadow-elevated">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-secondary/30 pr-10 focus:ring-primary/50"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-secondary/30 focus:ring-primary/50"
                  required
                />
              </div>

              {/* Password strength indicators */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className={`flex items-center gap-2 text-sm ${password.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {password.length >= 8 ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4 opacity-50" />}
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-2 text-sm ${password && password === confirmPassword ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {password && password === confirmPassword ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4 opacity-50" />}
                  Passwords match
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || !password || password !== confirmPassword}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Set New Password'
              )}
            </Button>
          </form>
        )}

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Salem Road Authority • Smart City Initiative
          </p>
        </div>
      </div>
    </div>
  );
}
