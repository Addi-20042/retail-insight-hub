import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open command palette' },
  { keys: ['⌘', '1'], description: 'Go to Overview' },
  { keys: ['⌘', '2'], description: 'Go to Forecast' },
  { keys: ['⌘', '3'], description: 'Go to Segmentation' },
  { keys: ['⌘', '4'], description: 'Go to Market Basket' },
  { keys: ['⌘', '5'], description: 'Go to Alerts' },
  { keys: ['⌘', 'U'], description: 'Upload Data' },
  { keys: ['⌘', ','], description: 'Settings' },
  { keys: ['⌘', 'N'], description: 'Quick Notes' },
  { keys: ['?'], description: 'Show shortcuts' },
  { keys: ['Esc'], description: 'Close dialogs' },
];

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 mt-4">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50"
            >
              <span className="text-sm text-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd 
                    key={i} 
                    className="px-2 py-1 bg-muted rounded text-xs font-mono text-muted-foreground border border-border"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          On Windows, use Ctrl instead of ⌘
        </p>
      </DialogContent>
    </Dialog>
  );
};

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      
      // Number shortcuts for navigation
      if (isMeta && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const routes = ['/dashboard', '/dashboard/forecast', '/dashboard/segmentation', '/dashboard/basket', '/dashboard/alerts'];
        navigate(routes[parseInt(e.key) - 1]);
      }
      
      // ⌘+U for Upload
      if (isMeta && e.key === 'u') {
        e.preventDefault();
        navigate('/dashboard/upload');
      }
      
      // ⌘+, for Settings
      if (isMeta && e.key === ',') {
        e.preventDefault();
        navigate('/dashboard/settings');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
};
