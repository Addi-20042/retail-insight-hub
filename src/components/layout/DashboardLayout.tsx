import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Keyboard, Menu, PanelLeft, PanelLeftClose, Search } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { QuickNotes } from "@/components/QuickNotes";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcuts, useKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import AIChatAssistant from "@/components/AIChatAssistant";
import { useAchievementChecker } from "@/hooks/useAchievementChecker";
import { useRealtimeSales } from "@/hooks/useRealtimeSales";
import { useRealtimeRetailEvents } from "@/hooks/useRealtimeRetailEvents";

const AchievementContext = createContext<{ recheckAchievements: () => Promise<void> }>({
  recheckAchievements: async () => {},
});

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
  useRealtimeRetailEvents();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "?" && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          setShortcutsOpen(true);
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "n") {
        event.preventDefault();
        setNotesOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-background">
      <div
        className={`fixed left-0 top-0 z-30 hidden h-screen transition-transform duration-300 lg:block ${
          sidebarCollapsed ? "-translate-x-64" : "translate-x-0"
        }`}
      >
        <Sidebar />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] max-w-[85vw] p-0">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-0" : "lg:pl-64"
        }`}
      >
        <header className="safe-area-top sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
          <div className="flex h-14 items-center justify-between px-3 sm:px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <span className="text-sm font-semibold text-foreground">RetailMind</span>
            <div className="flex items-center gap-0.5">
              <NotificationBell />
              <QuickNotes open={notesOpen} onOpenChange={setNotesOpen} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <header className="sticky top-0 z-40 hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:flex">
          <div className="flex h-14 w-full items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="text-muted-foreground"
                title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              >
                {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>

              <button
                onClick={() =>
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
                }
                className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <Search className="h-4 w-4" />
                <span>Search or command...</span>
                <kbd className="hidden items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs sm:inline-flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShortcutsOpen(true)}
                className="text-muted-foreground"
              >
                <Keyboard className="h-5 w-5" />
              </Button>
              <QuickNotes open={notesOpen} onOpenChange={setNotesOpen} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 pb-20 sm:p-4 sm:pb-8 md:p-6 lg:p-8">
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
