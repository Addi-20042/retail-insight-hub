import React from 'react';
import { Navigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Brain, BarChart3, Users, ShoppingCart, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Get user info from Google
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` }
        }).then(res => res.json());
        
        await login(response.access_token, userInfo);
        toast.success('Welcome back!');
      } catch (error) {
        console.error('Google login error:', error);
        // Fallback to demo mode
        await login();
        toast.info('Demo mode - Backend not configured');
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      // Fallback to demo login
      login();
      toast.info('Demo mode activated');
    }
  });

  const handleLogin = () => {
    // Try Google OAuth first, fall back to demo
    try {
      googleLogin();
    } catch {
      login();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    { icon: BarChart3, title: 'Sales Forecasting', desc: 'AI-powered demand prediction' },
    { icon: Users, title: 'Customer Segmentation', desc: 'Smart clustering analysis' },
    { icon: ShoppingCart, title: 'Basket Analysis', desc: 'Product association mining' },
    { icon: AlertTriangle, title: 'Smart Alerts', desc: 'Real-time anomaly detection' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 sidebar-gradient items-center justify-center p-12">
        <div className="max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-chart-secondary flex items-center justify-center mx-auto mb-8 shadow-elevated">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">RetailMind</h1>
          <p className="text-xl text-sidebar-muted mb-8">AI-Powered Retail Analytics</p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            {features.map((f, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <f.icon className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-medium text-white text-sm">{f.title}</h3>
                <p className="text-xs text-sidebar-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md animate-slide-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-chart-secondary flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">RetailMind</h1>
            <p className="text-muted-foreground">AI-Powered Retail Analytics</p>
          </div>

          <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-elevated border border-border">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
              <p className="text-muted-foreground">Sign in to access your analytics dashboard</p>
            </div>

            <Button 
              variant="google" 
              size="lg" 
              className="w-full"
              onClick={handleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            © 2026 RetailMind. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
