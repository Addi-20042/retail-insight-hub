import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const completeOAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get('error_description') || params.get('error');

      if (authError) {
        toast.error(decodeURIComponent(authError));
        if (isMounted) {
          navigate('/login', { replace: true });
        }
        return;
      }

      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast.error(error.message || 'Google sign-in failed');
          if (isMounted) {
            navigate('/login', { replace: true });
          }
          return;
        }
      }

      if (isMounted) {
        navigate('/dashboard', { replace: true });
      }
    };

    void completeOAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div>
          <p className="font-medium text-foreground">Completing sign-in</p>
          <p className="text-sm text-muted-foreground">Finishing your Google login and loading your dashboard.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
