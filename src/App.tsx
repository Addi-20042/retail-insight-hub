import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import DashboardLayout from "./components/layout/DashboardLayout";

const Overview = lazy(() => import("./pages/dashboard/Overview"));
const SalesForecast = lazy(() => import("./pages/dashboard/SalesForecast"));
const CustomerSegmentation = lazy(() => import("./pages/dashboard/CustomerSegmentation"));
const MarketBasket = lazy(() => import("./pages/dashboard/MarketBasket"));
const DataUpload = lazy(() => import("./pages/dashboard/DataUpload"));
const DataManagement = lazy(() => import("./pages/dashboard/DataManagement"));
const LivePOS = lazy(() => import("./pages/dashboard/LivePOS"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const Goals = lazy(() => import("./pages/dashboard/Goals"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "disabled";

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <GoogleOAuthProvider clientId={googleClientId}>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/dashboard" element={<DashboardLayout />}>
                      <Route index element={<Overview />} />
                      <Route path="forecast" element={<SalesForecast />} />
                      <Route path="segmentation" element={<CustomerSegmentation />} />
                      <Route path="basket" element={<MarketBasket />} />
                      <Route path="goals" element={<Goals />} />
                      <Route path="live-pos" element={<LivePOS />} />
                      <Route path="upload" element={<DataUpload />} />
                      <Route path="data" element={<DataManagement />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
);

export default App;
