import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertTriangle, BarChart3, Brain, Eye, EyeOff, Lock, Mail, ShoppingCart, Users } from "lucide-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { loginSchema, signupSchema } from "@/lib/validations";
import { toast } from "sonner";

const Login: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        toast.success("Welcome!");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const getAuthErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      const normalized = error.message.toLowerCase();

      if (normalized.includes("invalid login credentials")) {
        return "Invalid credentials. Use Sign up for a new account, or use Google if that account was created with Google.";
      }

      return error.message;
    }

    return fallback;
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    setIsSubmitting(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error("Google did not return a sign-in token");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credentialResponse.credential,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(getAuthErrorMessage(error, "Google login failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    const normalizedEmail = email.trim().toLowerCase();

    if (authMode === "signup") {
      const result = signupSchema.safeParse({ email: normalizedEmail, password, confirmPassword });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((item) => {
          if (item.path[0]) {
            errors[item.path[0] as string] = item.message;
          }
        });
        setFieldErrors(errors);
        toast.error(Object.values(errors)[0]);
        return;
      }
    } else {
      const result = loginSchema.safeParse({ email: normalizedEmail, password });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((item) => {
          if (item.path[0]) {
            errors[item.path[0] as string] = item.message;
          }
        });
        setFieldErrors(errors);
        toast.error(Object.values(errors)[0]);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          toast.success("Account created successfully!");
        } else {
          toast.success("Account created. Please verify from your email before logging in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          throw error;
        }

        toast.success("Welcome back!");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(getAuthErrorMessage(error, "Authentication failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    { icon: BarChart3, title: "Sales Forecasting", desc: "AI-powered demand prediction" },
    { icon: Users, title: "Customer Segmentation", desc: "Smart clustering analysis" },
    { icon: ShoppingCart, title: "Basket Analysis", desc: "Product association mining" },
    { icon: AlertTriangle, title: "Smart Alerts", desc: "Real-time anomaly detection" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="sidebar-gradient relative hidden flex-1 items-center justify-center p-12 lg:flex">
        <div className="max-w-md animate-fade-in text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-secondary shadow-elevated">
            <Brain className="h-12 w-12 text-white" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-white">RetailMind</h1>
          <p className="mb-8 text-xl text-sidebar-muted">AI-Powered Retail Analytics</p>

          <div className="grid grid-cols-2 gap-4 text-left">
            {features.map((feature, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <feature.icon className="mb-2 h-6 w-6 text-primary" />
                <h3 className="text-sm font-medium text-white">{feature.title}</h3>
                <p className="text-xs text-sidebar-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md animate-slide-in">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-secondary shadow-lg">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">RetailMind</h1>
            <p className="text-muted-foreground">AI-Powered Retail Analytics</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                {authMode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-muted-foreground">
                {authMode === "login" ? "Sign in to access your dashboard" : "Get started with RetailMind"}
              </p>
            </div>

            <div className="w-full rounded-lg border border-input bg-background px-4 py-3">
              <div className="flex w-full justify-center">
                {googleClientId ? (
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => {
                      toast.error("Google sign-in could not be started");
                    }}
                    shape="rectangular"
                    text="continue_with"
                    width="320"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Google sign-in is not configured</span>
                )}
              </div>
            </div>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                or continue with email
              </span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 ${fieldErrors.email ? "border-destructive" : ""}`}
                    maxLength={255}
                  />
                </div>
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
                    maxLength={128}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
              </div>

              {authMode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 ${fieldErrors.confirmPassword ? "border-destructive" : ""}`}
                      maxLength={128}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {authMode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : authMode === "login" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                New user? Click <span className="font-medium">Sign up</span> first. If your account was created with
                Google, use Google login.
              </p>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setFieldErrors({});
                }}
                className="font-medium text-primary hover:underline"
              >
                {authMode === "login" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        onBackToLogin={() => setForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default Login;
