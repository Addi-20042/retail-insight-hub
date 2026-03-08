import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/layout/DashboardLayout";

// Lazy load dashboard pages for faster initial load
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const SalesForecast = lazy(() => import("./pages/dashboard/SalesForecast"));
const CustomerSegmentation = lazy(() => import("./pages/dashboard/CustomerSegmentation"));
const MarketBasket = lazy(() => import("./pages/dashboard/MarketBasket"));
const DataUpload = lazy(() => import("./pages/dashboard/DataUpload"));
const DataManagement = lazy(() => import("./pages/dashboard/DataManagement"));
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

const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
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
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="forecast" element={<SalesForecast />} />
                    <Route path="segmentation" element={<CustomerSegmentation />} />
                    <Route path="basket" element={<MarketBasket />} />
                    <Route path="goals" element={<Goals />} />
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
);

export default App;
