import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, User, Bell, Database, Palette, Save, Moon, Sun, Monitor, Download,
  Shield, Key, Smartphone, History, Trash2, AlertTriangle, Globe, Clock, FileText, LogOut, Camera
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserSettings {
  defaultForecastDays: string;
  notificationsEnabled: boolean;
  emailAlerts: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  exportFormat: string;
  language: string;
  timezone: string;
  twoFactorEnabled: boolean;
  sessionTimeout: string;
}

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = localStorage.getItem('retailmind_settings');
    return stored ? JSON.parse(stored) : {
      defaultForecastDays: '7',
      notificationsEnabled: true,
      emailAlerts: false,
      pushNotifications: true,
      weeklyReports: false,
      exportFormat: 'pdf',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      twoFactorEnabled: false,
      sessionTimeout: '30',
    };
  });

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [bio, setBio] = useState('');

  // Load profile from DB
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || user?.name || '');
    }
  }, [profile, user]);

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from('profiles').update({
        display_name: displayName,
      }).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  // Upload stats
  const { data: stats } = useQuery({
    queryKey: ['user_stats', user?.id],
    queryFn: async () => {
      const [{ count: salesCount }, { count: uploadCount }, { count: goalCount }] = await Promise.all([
        supabase.from('sales_data').select('*', { count: 'exact', head: true }),
        supabase.from('upload_history').select('*', { count: 'exact', head: true }),
        supabase.from('goals').select('*', { count: 'exact', head: true }),
      ]);
      return { salesCount: salesCount || 0, uploadCount: uploadCount || 0, goalCount: goalCount || 0 };
    },
    enabled: !!user,
  });

  const handleSave = () => {
    localStorage.setItem('retailmind_settings', JSON.stringify(settings));
    updateProfile.mutate();
  };

  const handleExportData = async () => {
    toast.info('Preparing data export...');
    try {
      const { data } = await supabase.from('sales_data').select('*');
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]);
        const csv = [headers.join(','), ...data.map(r => headers.map(h => r[h] ?? '').join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'retailmind_export.csv'; a.click();
        URL.revokeObjectURL(url);
        toast.success('Data exported successfully');
      } else {
        toast.info('No data to export');
      }
    } catch {
      toast.error('Export failed');
    }
  };

  const handleClearLocalData = () => {
    localStorage.removeItem('retailmind_settings');
    localStorage.removeItem('retailmind_notes');
    toast.success('Local cache cleared');
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    const { error } = await supabase.from('sales_data').delete().eq('user_id', user.id);
    if (error) {
      toast.error('Failed to delete data');
    } else {
      queryClient.invalidateQueries({ queryKey: ['sales_data'] });
      queryClient.invalidateQueries({ queryKey: ['sales_stats'] });
      toast.success('All sales data deleted');
    }
  };

  const sessions = [
    { device: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser', location: 'Current session', lastActive: 'Now', current: true },
  ];

  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences, security, and configuration</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full overflow-x-auto">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 text-xs sm:text-sm">
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm">
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5 text-xs sm:text-sm">
            <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Data</span>
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
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group">
                  <img 
                    src={user?.avatar} 
                    alt={user?.name} 
                    className="w-20 h-20 rounded-full border-4 border-primary/20 object-cover" 
                  />
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <p className="text-xl font-semibold text-foreground">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <Badge variant="secondary">Free Plan</Badge>
                    <Badge variant="outline" className="text-success border-success">Active</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Member since {memberSince}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Account stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{stats.salesCount}</p>
                    <p className="text-xs text-muted-foreground">Records</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{stats.uploadCount}</p>
                    <p className="text-xs text-muted-foreground">Uploads</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{stats.goalCount}</p>
                    <p className="text-xs text-muted-foreground">Goals</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} type="email" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(v) => setSettings({ ...settings, timezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex flex-wrap gap-3">
                <Button variant="destructive" onClick={logout} className="gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
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
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">Theme</Label>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { value: 'light' as const, icon: Sun, label: 'Light', bgClass: 'bg-white border border-border', iconClass: 'text-amber-500' },
                    { value: 'dark' as const, icon: Moon, label: 'Dark', bgClass: 'bg-slate-900', iconClass: 'text-slate-300' },
                    { value: 'system' as const, icon: Monitor, label: 'System', bgClass: 'bg-gradient-to-br from-white to-slate-900', iconClass: 'text-white' },
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                        theme === t.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${t.bgClass} flex items-center justify-center shadow-sm`}>
                        <t.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${t.iconClass}`} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
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
              <CardDescription>Configure alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'notificationsEnabled', label: 'In-app Notifications', desc: 'Show real-time alerts in dashboard' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push for critical alerts' },
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive critical alerts via email' },
                { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Analytics summary every Monday' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border">
                  <div className="mr-3">
                    <Label className="text-sm sm:text-base">{item.label}</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch 
                    checked={(settings as any)[item.key]} 
                    onCheckedChange={(v) => setSettings({ ...settings, [item.key]: v })} 
                  />
                </div>
              ))}
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
              <CardDescription>Add extra security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mr-3">
                  <Smartphone className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground shrink-0" />
                  <div>
                    <Label className="text-sm sm:text-base">Authenticator App</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">Google Authenticator or Authy</p>
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
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{session.device}</span>
                      {session.current && <Badge className="text-xs">Current</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{session.location} • {session.lastActive}</p>
                  </div>
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
                <Select value={settings.sessionTimeout} onValueChange={(v) => setSettings({ ...settings, sessionTimeout: v })}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Auto log out after inactivity</p>
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Forecast Days</Label>
                  <Select value={settings.defaultForecastDays} onValueChange={(v) => setSettings({ ...settings, defaultForecastDays: v })}>
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
                  <Select value={settings.exportFormat} onValueChange={(v) => setSettings({ ...settings, exportFormat: v })}>
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
                <Download className="w-5 h-5 text-primary" />
                Data Management
              </CardTitle>
              <CardDescription>Export or manage your data</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Button variant="outline" onClick={handleExportData} className="gap-2">
                <Download className="w-4 h-4" /> Export All Data
              </Button>
              <Button variant="outline" onClick={handleClearLocalData} className="gap-2">
                <Trash2 className="w-4 h-4" /> Clear Cache
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" /> Delete All Sales Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete all sales data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {stats?.salesCount || 0} sales records. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllData} className="bg-destructive text-destructive-foreground">Delete All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-xs text-muted-foreground">
                Deleting data is permanent and cannot be recovered.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={handleSave} size="lg" className="gap-2 shadow-lg" disabled={updateProfile.isPending}>
          <Save className="w-4 h-4" />
          {updateProfile.isPending ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
