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

  const handleLogout = () => {
    logout();
    onNavigate?.();
  };

  return (
    <aside className="w-64 h-screen sidebar-gradient flex flex-col border-r border-sidebar-border overflow-hidden">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-chart-secondary flex items-center justify-center shrink-0"
            whileHover={{ scale: 1.08, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{ boxShadow: '0 0 18px hsl(168 76% 42% / 0.4)' }}
          >
            <Brain className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">RetailMind</h1>
            <p className="text-[11px] text-sidebar-muted">AI Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.end 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "nav-item relative overflow-hidden",
                isActive && "nav-item-active"
              )}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-sidebar-accent rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                )}
              </AnimatePresence>
              <span className="relative flex items-center gap-3">
                <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? 'text-sidebar-primary' : '')} />
                <span className="text-sm truncate">{item.label}</span>
              </span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-sidebar-primary"
                  transition={{ duration: 0.2 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-3 py-2 flex items-center justify-end border-t border-sidebar-border/50">
        <ThemeToggle />
      </div>

      {/* User section */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 mb-2 px-2">
          <div className="relative">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-full bg-sidebar-accent object-cover"
            />
            <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success border border-sidebar-background" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name}</p>
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
