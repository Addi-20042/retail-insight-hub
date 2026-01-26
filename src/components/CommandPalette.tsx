import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  BarChart3,
  Users,
  ShoppingCart,
  AlertTriangle,
  Upload,
  Settings,
  LayoutDashboard,
  Search,
  Moon,
  Sun,
  LogOut,
  FileText,
  Download,
  StickyNote,
  Keyboard,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { exportForecastToPdf, exportAlertsToPdf } from '@/lib/exportPdf';

interface CommandPaletteProps {
  onOpenNotes?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onOpenNotes }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: BarChart3, label: 'Sales Forecast', path: '/dashboard/forecast' },
    { icon: Users, label: 'Customer Segmentation', path: '/dashboard/segmentation' },
    { icon: ShoppingCart, label: 'Market Basket', path: '/dashboard/basket' },
    { icon: AlertTriangle, label: 'Smart Alerts', path: '/dashboard/alerts' },
    { icon: Upload, label: 'Data Upload', path: '/dashboard/upload' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => runCommand(() => navigate(item.path))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => exportForecastToPdf({}))}>
            <Download className="mr-2 h-4 w-4" />
            Export Forecast Report
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => exportAlertsToPdf([]))}>
            <FileText className="mr-2 h-4 w-4" />
            Export Alerts Report
          </CommandItem>
          {onOpenNotes && (
            <CommandItem onSelect={() => runCommand(onOpenNotes)}>
              <StickyNote className="mr-2 h-4 w-4" />
              Open Quick Notes
            </CommandItem>
          )}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2 h-4 w-4" />
            Light Mode
            {theme === 'light' && <span className="ml-auto text-xs text-primary">Active</span>}
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2 h-4 w-4" />
            Dark Mode
            {theme === 'dark' && <span className="ml-auto text-xs text-primary">Active</span>}
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => runCommand(logout)}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </CommandItem>
        </CommandGroup>
      </CommandList>
      
      <div className="p-2 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
        <Keyboard className="w-3 h-3" />
        <span>Press</span>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">⌘K</kbd>
        <span>to open command palette</span>
      </div>
    </CommandDialog>
  );
};
