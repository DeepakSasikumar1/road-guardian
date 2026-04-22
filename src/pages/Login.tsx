import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { login, signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({ phone: '' });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await login(email, password);
        if (error) setError(error);
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        const { error } = await signup(email, password, name, formData.phone);
        if (error) {
          setError(error);
        } else {
          const { error: loginError } = await login(email, password);
          if (loginError) setError(loginError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('rate limit')) {
          msg = 'Too many requests. Please wait a few minutes before trying again.';
        } else if (msg.includes('Email provider')) {
          msg = 'Email service is currently unavailable. Please check Supabase SMTP settings.';
        }
        setError(msg);
        toast({
          variant: "destructive",
          title: 'Error',
          description: msg,
        });
        throw error;
      }

      setResetSent(true);
      toast({
        title: 'Email Sent',
        description: `We've sent a password reset link to ${email}`,
      });
    } catch (err: any) {
      console.error('Reset Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        setError(error.message || 'Google sign-in failed');
      }
    } catch (err) {
      setError('Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-background p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-8 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="RoadWatch AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">RoadWatch AI</h1>
              <p className="text-sm text-muted-foreground">Smart Monitoring System</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            AI-Powered Road<br />
            <span className="text-primary">Obstacle Detection</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md">
            Real-time monitoring and alert system for road authorities in Salem district.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border">
              <p className="text-3xl font-bold text-primary">24/7</p>
              <p className="text-sm text-muted-foreground">Real-time Monitoring</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border">
              <p className="text-3xl font-bold text-severity-high">98%</p>
              <p className="text-sm text-muted-foreground">Detection Accuracy</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border">
              <p className="text-3xl font-bold text-severity-medium">12</p>
              <p className="text-sm text-muted-foreground">Areas Covered</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border">
              <p className="text-3xl font-bold text-severity-low">&lt;5s</p>
              <p className="text-sm text-muted-foreground">Alert Response</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground">
          © 2026 Salem Road Authority • Smart City Initiative
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3 justify-center mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white">
                <img src="/logo.png" alt="RoadWatch AI" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold">RoadWatch AI</h1>
                <p className="text-xs text-muted-foreground">Smart Monitoring</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {mode === 'login'
                ? 'Sign in to access the command center'
                : mode === 'signup'
                  ? 'Register to join the monitoring team'
                  : 'Enter your email to receive a reset link'}
            </p>
          </div>

          {mode !== 'forgot-password' ? (
            <>
              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 gap-3"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 bg-secondary/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-12 bg-secondary/50"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-secondary/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-secondary/50 pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                    </>
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Sign Up'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-6">
              {resetSent ? (
                <div className="bg-primary/10 p-6 rounded-xl border border-primary/20 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">Check Your Email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setMode('login'); setResetSent(false); }}
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email-reset">Email Address</Label>
                    <Input
                      id="email-reset"
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-secondary/50"
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending Link...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setMode('login')}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="text-center">
            <p className="text-muted-foreground">
              {mode === 'login' ? "Don't have an account?" : mode === 'signup' ? 'Already have an account?' : ''}
              {(mode === 'login' || mode === 'signup') && (
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                  className="text-primary hover:underline ml-1 font-medium"
                >
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              )}
            </p>
          </div>

          <div className="border-t border-border pt-6">
            <p className="text-xs text-muted-foreground text-center">
              Protected system for authorized road authority personnel only.
              <br />All activities are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
