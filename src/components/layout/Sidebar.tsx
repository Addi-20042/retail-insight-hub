import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Users, ShoppingCart, Upload, LogOut,
  LayoutDashboard, Brain, Settings, Target, Table2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';


const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { path: '/dashboard/forecast', icon: BarChart3, label: 'Sales Forecast' },
  { path: '/dashboard/segmentation', icon: Users, label: 'Customer Segmentation' },
  { path: '/dashboard/basket', icon: ShoppingCart, label: 'Market Basket' },
  { path: '/dashboard/goals', icon: Target, label: 'Goals & Reports' },
  { path: '/dashboard/upload', icon: Upload, label: 'Data Upload' },
  { path: '/dashboard/data', icon: Table2, label: 'Data Management' },
  { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const displayName = profile?.display_name || user?.name || 'User';
  const avatarUrl = profile?.avatar_url || user?.avatar;

  const handleLogout = () => {
    logout();
    onNavigate?.();
  };

  return (
    <aside className="w-64 h-screen sidebar-gradient flex flex-col border-r border-sidebar-border overflow-hidden">
...
      {/* User section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 mb-2 px-2">
          <div className="relative">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full bg-sidebar-accent object-cover"
            />
            <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success border border-sidebar-background" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-sidebar-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-item w-full text-sidebar-muted hover:text-destructive hover:bg-destructive/10 mt-1"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
