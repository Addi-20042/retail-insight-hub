import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  Upload, 
  LogOut,
  LayoutDashboard,
  Brain
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import BackendStatus from '@/components/BackendStatus';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/dashboard/forecast', icon: BarChart3, label: 'Sales Forecast' },
  { path: '/dashboard/segmentation', icon: Users, label: 'Customer Segmentation' },
  { path: '/dashboard/basket', icon: ShoppingCart, label: 'Market Basket' },
  { path: '/dashboard/alerts', icon: AlertTriangle, label: 'Smart Alerts' },
  { path: '/dashboard/upload', icon: Upload, label: 'Data Upload' },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 h-screen sidebar-gradient flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-secondary flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">RetailMind</h1>
            <p className="text-xs text-sidebar-muted">AI Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/dashboard' && location.pathname === '/dashboard');
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item",
                isActive && "nav-item-active"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Backend Status */}
      <div className="px-4 py-2">
        <BackendStatus />
      </div>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-9 h-9 rounded-full bg-sidebar-accent"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="nav-item w-full text-sidebar-muted hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
