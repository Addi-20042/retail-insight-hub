import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Database,
  Download,
  History,
  Key,
  Monitor,
  Moon,
  Palette,
  Save,
  Settings as SettingsIcon,
  Shield,
  Smartphone,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

interface UserSettings {
  defaultForecastDays: string;
  notificationsEnabled: boolean;
  emailAlerts: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  apiBaseUrl: string;
  exportFormat: string;
  language: string;
  timezone: string;
  twoFactorEnabled: boolean;
  sessionTimeout: string;
}

const getInitials = (name?: string) => {
  const parts = (name || "Retail User").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "RU";
};

const Settings: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = localStorage.getItem("retailmind_settings");
    return stored
      ? JSON.parse(stored)
      : {
          defaultForecastDays: "7",
          notificationsEnabled: true,
          emailAlerts: false,
          pushNotifications: true,
          weeklyReports: false,
          apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
          exportFormat: "pdf",
          language: "en",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
          twoFactorEnabled: false,
          sessionTimeout: "30",
        };
  });

  useEffect(() => {
    setDisplayName(user?.name || "");
    setAvatarUrl(user?.avatar || "");
  }, [user?.avatar, user?.name]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      localStorage.setItem("retailmind_settings", JSON.stringify(settings));
      await updateProfile({
        name: displayName,
        avatar: avatarUrl || null,
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    toast.info("Preparing data export...");
    window.setTimeout(() => toast.success("Data exported successfully"), 1500);
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all local data? This cannot be undone.")) {
      localStorage.clear();
      toast.success("Local data cleared");
      window.location.reload();
    }
  };

  const sessions = [
    {
      device: navigator.userAgent.includes("Chrome")
        ? "Chrome"
        : navigator.userAgent.includes("Firefox")
          ? "Firefox"
          : "Browser",
      location: "Current session",
      lastActive: "Now",
      current: true,
    },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences, security, and configuration</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="hidden h-4 w-4 sm:block" />
            <span className="hidden sm:inline">Profile</span>
            <span className="sm:hidden">Me</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="hidden h-4 w-4 sm:block" />
            <span className="hidden sm:inline">Theme</span>
            <span className="sm:hidden">UI</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="hidden h-4 w-4 sm:block" />
            <span className="hidden sm:inline">Alerts</span>
            <span className="sm:hidden">Bell</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="hidden h-4 w-4 sm:block" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">Safe</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="hidden h-4 w-4 sm:block" />
            <span className="hidden sm:inline">Data</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                  <AvatarImage src={avatarUrl || user?.avatar} alt={displayName || user?.name || "RetailMind user"} />
                  <AvatarFallback className="text-lg font-semibold">
                    {getInitials(displayName || user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-xl font-semibold text-foreground">{displayName || user?.name || "Retail User"}</p>
                  <p className="text-muted-foreground">{user?.email || "No email available"}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary">Free Plan</Badge>
                    <Badge variant="outline" className="border-success text-success">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} type="email" disabled />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Avatar URL</Label>
                  <Input
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use your provider profile image or initials fallback.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                <Button variant="outline">Change Password</Button>
                <Button variant="destructive" onClick={() => void logout()}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      value: "light" as const,
                      icon: Sun,
                      label: "Light",
                      previewClass: "bg-white border border-border",
                      iconClass: "text-amber-500",
                    },
                    {
                      value: "dark" as const,
                      icon: Moon,
                      label: "Dark",
                      previewClass: "bg-slate-900",
                      iconClass: "text-slate-300",
                    },
                    {
                      value: "system" as const,
                      icon: Monitor,
                      label: "System",
                      previewClass: "bg-gradient-to-br from-white to-slate-900",
                      iconClass: "text-white",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        theme === option.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${option.previewClass}`}>
                        <option.icon className={`h-6 w-6 ${option.iconClass}`} />
                      </div>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "notificationsEnabled",
                  label: "In-app Notifications",
                  desc: "Show real-time alerts in dashboard",
                },
                {
                  key: "pushNotifications",
                  label: "Push Notifications",
                  desc: "Browser push notifications for critical alerts",
                },
                {
                  key: "emailAlerts",
                  label: "Email Alerts",
                  desc: "Receive critical alerts via email",
                },
                {
                  key: "weeklyReports",
                  label: "Weekly Reports",
                  desc: "Get weekly analytics summary every Monday",
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label className="text-base">{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as Record<string, boolean | string>)[item.key] as boolean}
                    onCheckedChange={(value) => setSettings({ ...settings, [item.key]: value })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <Label className="text-base">Authenticator App</Label>
                    <p className="text-sm text-muted-foreground">Use an app like Google Authenticator or Authy</p>
                  </div>
                </div>
                <Switch
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(value) => {
                    setSettings({ ...settings, twoFactorEnabled: value });
                    toast.info(value ? "2FA setup would open here" : "2FA disabled");
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Active Sessions
              </CardTitle>
              <CardDescription>Manage devices where you're currently signed in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((sessionItem, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{sessionItem.device}</span>
                      {sessionItem.current && <Badge className="text-xs">Current</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sessionItem.location} | {sessionItem.lastActive}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Session Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Select value={settings.sessionTimeout} onValueChange={(value) => setSettings({ ...settings, sessionTimeout: value })}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Automatically log out after inactivity</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Analytics Preferences
              </CardTitle>
              <CardDescription>Configure default analytics behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Forecast Days</Label>
                  <Select
                    value={settings.defaultForecastDays}
                    onValueChange={(value) => setSettings({ ...settings, defaultForecastDays: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={settings.exportFormat} onValueChange={(value) => setSettings({ ...settings, exportFormat: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                API Configuration
              </CardTitle>
              <CardDescription>Backend connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Backend API URL</Label>
                <Input
                  value={settings.apiBaseUrl}
                  onChange={(event) => setSettings({ ...settings, apiBaseUrl: event.target.value })}
                  placeholder="http://localhost:5000/api"
                />
                <p className="text-xs text-muted-foreground">Set `VITE_API_BASE_URL` in environment to override.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Data Management
              </CardTitle>
              <CardDescription>Export or clear your analytics data</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleExportData} className="gap-2">
                <Download className="h-4 w-4" />
                Export All Data
              </Button>
              <Button variant="outline" onClick={handleClearData} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Clear Local Data
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-warning/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                This will permanently delete your account and all associated data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={() => void handleSave()} size="lg" className="gap-2 shadow-lg" disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
