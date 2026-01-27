import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu, Search, Keyboard } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { QuickNotes } from '@/components/QuickNotes';
import { CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcuts, useKeyboardShortcuts } from '@/components/KeyboardShortcuts';
import AIChatAssistant from '@/components/AIChatAssistant';

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Listen for ? key to show shortcuts and ⌘+N for notes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShortcutsOpen(true);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setNotesOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-14 px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            
            <span className="font-semibold text-foreground">RetailMind</span>
            
            <div className="flex items-center gap-1">
              <NotificationBell />
              <QuickNotes open={notesOpen} onOpenChange={setNotesOpen} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-14 px-6 w-full">
            {/* Search / Command Palette Trigger */}
            <button 
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search or command...</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-background rounded text-xs border border-border">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShortcutsOpen(true)}
                className="text-muted-foreground"
              >
                <Keyboard className="w-5 h-5" />
              </Button>
              <NotificationBell />
              <QuickNotes open={notesOpen} onOpenChange={setNotesOpen} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette onOpenNotes={() => setNotesOpen(true)} />
      
      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* AI Chat Assistant */}
      <AIChatAssistant />
    </div>
  );
};

export default DashboardLayout;
