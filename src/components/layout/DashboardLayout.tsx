import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu, Search, Keyboard, PanelLeftClose, PanelLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { QuickNotes } from '@/components/QuickNotes';
import { CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcuts, useKeyboardShortcuts } from '@/components/KeyboardShortcuts';
import AIChatAssistant from '@/components/AIChatAssistant';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';
import { useRealtimeSales } from '@/hooks/useRealtimeSales';

// Context to expose recheckAchievements globally
const AchievementContext = createContext<{ recheckAchievements: () => Promise<void> }>({ recheckAchievements: async () => {} });
export const useAchievementRecheck = () => useContext(AchievementContext);

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcuts();
  const { recheckAchievements } = useAchievementChecker();
  useRealtimeSales();

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
    <div className="flex min-h-screen bg-background overflow-x-hidden max-w-[100vw]">
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:block fixed left-0 top-0 h-screen z-30 transition-transform duration-300 ${
          sidebarCollapsed ? '-translate-x-64' : 'translate-x-0'
        }`}
      >
        <Sidebar />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] max-w-[85vw]">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'
        }`}
      >
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-area-top">
          <div className="flex items-center justify-between h-14 px-3 sm:px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <span className="font-semibold text-foreground text-sm">RetailMind</span>
            <div className="flex items-center gap-0.5">
              <QuickNotes open={notesOpen} onOpenChange={setNotesOpen} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-14 px-6 w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-muted-foreground"
                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </Button>

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
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShortcutsOpen(true)}
                className="text-muted-foreground"
              >
                <Keyboard className="w-5 h-5" />
              </Button>
              <QuickNotes open={notesOpen} onOpenChange={setNotesOpen} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto animate-fade-in pb-20 sm:pb-8">
          <AchievementContext.Provider value={{ recheckAchievements }}>
            <Outlet />
          </AchievementContext.Provider>
        </main>
      </div>

      <CommandPalette onOpenNotes={() => setNotesOpen(true)} />
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <AIChatAssistant />
    </div>
  );
};

export default DashboardLayout;
