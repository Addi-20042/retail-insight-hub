import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/layout/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import SalesForecast from "./pages/dashboard/SalesForecast";
import CustomerSegmentation from "./pages/dashboard/CustomerSegmentation";
import MarketBasket from "./pages/dashboard/MarketBasket";
import Alerts from "./pages/dashboard/Alerts";
import DataUpload from "./pages/dashboard/DataUpload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
              <Route path="alerts" element={<Alerts />} />
              <Route path="upload" element={<DataUpload />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
