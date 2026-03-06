import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/layout/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import SalesForecast from "./pages/dashboard/SalesForecast";
import CustomerSegmentation from "./pages/dashboard/CustomerSegmentation";
import MarketBasket from "./pages/dashboard/MarketBasket";
import DataUpload from "./pages/dashboard/DataUpload";
import DataManagement from "./pages/dashboard/DataManagement";
import Settings from "./pages/dashboard/Settings";
import Goals from "./pages/dashboard/Goals";
import NotFound from "./pages/NotFound";

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



const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<Login />} />
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
              </BrowserRouter>
            </TooltipProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
