import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, User, Bell, Database, Palette, Save, Moon, Sun, Monitor, Download,
  Shield, Key, Smartphone, History, Trash2, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

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

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = localStorage.getItem('retailmind_settings');
    return stored ? JSON.parse(stored) : {
      defaultForecastDays: '7',
      notificationsEnabled: true,
      emailAlerts: false,
      pushNotifications: true,
      weeklyReports: false,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      exportFormat: 'pdf',
      language: 'en',
      timezone: 'America/New_York',
      twoFactorEnabled: false,
      sessionTimeout: '30',
    };
  });

  const handleSave = () => {
    localStorage.setItem('retailmind_settings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  const handleExportData = () => {
    toast.info('Preparing data export...');
    setTimeout(() => toast.success('Data exported successfully'), 1500);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      localStorage.clear();
      toast.success('Local data cleared');
      window.location.reload();
    }
  };

  // Sessions are managed by the authentication system
  const sessions = [
    { device: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser', location: 'Current session', lastActive: 'Now', current: true },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences, security, and configuration</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Profile</span>
            <span className="sm:hidden">👤</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Theme</span>
            <span className="sm:hidden">🎨</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Alerts</span>
            <span className="sm:hidden">🔔</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">🔒</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Data</span>
            <span className="sm:hidden">💾</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img 
                  src={user?.avatar} 
                  alt={user?.name} 
                  className="w-20 h-20 rounded-full border-4 border-primary/20" 
                />
                <div className="space-y-1">
                  <p className="text-xl font-semibold text-foreground">{user?.name}</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Free Plan</Badge>
                    <Badge variant="outline" className="text-success border-success">Active</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input defaultValue={user?.name} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} type="email" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={settings.timezone} 
                    onValueChange={(v) => setSettings({ ...settings, timezone: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
                  <Select 
                    value={settings.language} 
                    onValueChange={(v) => setSettings({ ...settings, language: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex flex-wrap gap-3">
                <Button variant="outline">Change Password</Button>
                <Button variant="destructive" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      theme === 'light' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center shadow-sm">
                      <Sun className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-sm font-medium">Light</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shadow-sm">
                      <Moon className="w-6 h-6 text-slate-300" />
                    </div>
                    <span className="text-sm font-medium">Dark</span>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      theme === 'system' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-slate-900 flex items-center justify-center shadow-sm">
                      <Monitor className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label className="text-base">In-app Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show real-time alerts in dashboard</p>
                </div>
                <Switch 
                  checked={settings.notificationsEnabled} 
                  onCheckedChange={(v) => setSettings({ ...settings, notificationsEnabled: v })} 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Browser push notifications for critical alerts</p>
                </div>
                <Switch 
                  checked={settings.pushNotifications} 
                  onCheckedChange={(v) => setSettings({ ...settings, pushNotifications: v })} 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label className="text-base">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive critical alerts via email</p>
                </div>
                <Switch 
                  checked={settings.emailAlerts} 
                  onCheckedChange={(v) => setSettings({ ...settings, emailAlerts: v })} 
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label className="text-base">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Get weekly analytics summary every Monday</p>
                </div>
                <Switch 
                  checked={settings.weeklyReports} 
                  onCheckedChange={(v) => setSettings({ ...settings, weeklyReports: v })} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <Label className="text-base">Authenticator App</Label>
                    <p className="text-sm text-muted-foreground">Use an app like Google Authenticator or Authy</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(v) => {
                    setSettings({ ...settings, twoFactorEnabled: v });
                    toast.info(v ? '2FA setup would open here' : '2FA disabled');
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Active Sessions
              </CardTitle>
              <CardDescription>Manage devices where you're currently signed in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{session.device}</span>
                      {session.current && <Badge className="text-xs">Current</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{session.location} • {session.lastActive}</p>
                  </div>
                  {!session.current && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
                Session Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Select 
                  value={settings.sessionTimeout} 
                  onValueChange={(v) => setSettings({ ...settings, sessionTimeout: v })}
                >
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
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

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-primary" />
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
                    onValueChange={(v) => setSettings({ ...settings, defaultForecastDays: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Select 
                    value={settings.exportFormat} 
                    onValueChange={(v) => setSettings({ ...settings, exportFormat: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Database className="w-5 h-5 text-primary" />
                API Configuration
              </CardTitle>
              <CardDescription>Backend connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Backend API URL</Label>
                <Input 
                  value={settings.apiBaseUrl} 
                  onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })} 
                  placeholder="http://localhost:5000/api" 
                />
                <p className="text-xs text-muted-foreground">
                  Set VITE_API_BASE_URL in environment to override
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Data Management
              </CardTitle>
              <CardDescription>Export or clear your analytics data</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleExportData} className="gap-2">
                <Download className="w-4 h-4" />
                Export All Data
              </Button>
              <Button variant="outline" onClick={handleClearData} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
                Clear Local Data
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-warning/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will permanently delete your account and all associated data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={handleSave} size="lg" className="gap-2 shadow-lg">
          <Save className="w-4 h-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
