import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Database, Palette, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    defaultForecastDays: '7',
    notificationsEnabled: true,
    emailAlerts: false,
    theme: 'dark',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  });

  const handleSave = () => {
    localStorage.setItem('retailmind_settings', JSON.stringify(settings));
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and configuration</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={user?.avatar} alt={user?.name} className="w-16 h-16 rounded-full" />
              <div>
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              Analytics Preferences
            </CardTitle>
            <CardDescription>Configure default analytics behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="forecastDays">Default Forecast Days</Label>
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
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>In-app Notifications</Label>
                <p className="text-sm text-muted-foreground">Show alerts in dashboard</p>
              </div>
              <Switch checked={settings.notificationsEnabled} onCheckedChange={(v) => setSettings({ ...settings, notificationsEnabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive critical alerts via email</p>
              </div>
              <Switch checked={settings.emailAlerts} onCheckedChange={(v) => setSettings({ ...settings, emailAlerts: v })} />
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="apiUrl">Backend API URL</Label>
              <Input id="apiUrl" value={settings.apiBaseUrl} onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })} placeholder="http://localhost:5000/api" />
              <p className="text-xs text-muted-foreground">Set VITE_API_BASE_URL in environment to override</p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
