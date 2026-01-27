import React, { useState } from 'react';
import { 
  Calendar, Clock, Mail, Plus, Edit2, Trash2, 
  FileText, TrendingUp, Users, ShoppingCart, Bell, Play, Pause
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  schedule: string;
  dayOfWeek?: number;
  timeOfDay: string;
  emailRecipients: string[];
  enabled: boolean;
  lastSentAt?: Date;
  nextRunAt?: Date;
}

const reportTypes = [
  { value: 'sales_forecast', label: 'Sales Forecast', icon: TrendingUp },
  { value: 'customer_segments', label: 'Customer Segments', icon: Users },
  { value: 'basket_analysis', label: 'Basket Analysis', icon: ShoppingCart },
  { value: 'smart_alerts', label: 'Smart Alerts', icon: Bell },
  { value: 'full_dashboard', label: 'Full Dashboard', icon: FileText },
];

const scheduleOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ScheduledReports: React.FC = () => {
  const [reports, setReports] = useState<ScheduledReport[]>(() => {
    const stored = localStorage.getItem('retailmind_scheduled_reports');
    return stored ? JSON.parse(stored) : [
      {
        id: '1',
        name: 'Weekly Sales Summary',
        reportType: 'sales_forecast',
        schedule: 'weekly',
        dayOfWeek: 1,
        timeOfDay: '09:00',
        emailRecipients: ['team@company.com'],
        enabled: true,
        nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        name: 'Monthly Performance Report',
        reportType: 'full_dashboard',
        schedule: 'monthly',
        dayOfWeek: 1,
        timeOfDay: '08:00',
        emailRecipients: ['executives@company.com', 'analytics@company.com'],
        enabled: true,
        nextRunAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [newReport, setNewReport] = useState({
    name: '',
    reportType: 'sales_forecast',
    schedule: 'weekly',
    dayOfWeek: 1,
    timeOfDay: '09:00',
    emailRecipients: '',
  });

  const saveReports = (updated: ScheduledReport[]) => {
    setReports(updated);
    localStorage.setItem('retailmind_scheduled_reports', JSON.stringify(updated));
  };

  const handleToggleEnabled = (id: string) => {
    const updated = reports.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    saveReports(updated);
    toast.success(reports.find(r => r.id === id)?.enabled ? 'Report paused' : 'Report activated');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;
    const updated = reports.filter(r => r.id !== id);
    saveReports(updated);
    toast.success('Report deleted');
  };

  const handleSave = () => {
    if (!newReport.name.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    const recipients = newReport.emailRecipients
      .split(',')
      .map(e => e.trim())
      .filter(e => e);

    if (recipients.length === 0) {
      toast.error('Please add at least one email recipient');
      return;
    }

    const report: ScheduledReport = {
      id: editingReport?.id || `report_${Date.now()}`,
      name: newReport.name,
      reportType: newReport.reportType,
      schedule: newReport.schedule,
      dayOfWeek: newReport.dayOfWeek,
      timeOfDay: newReport.timeOfDay,
      emailRecipients: recipients,
      enabled: true,
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    const updated = editingReport
      ? reports.map(r => r.id === editingReport.id ? report : r)
      : [...reports, report];

    saveReports(updated);
    setDialogOpen(false);
    setEditingReport(null);
    setNewReport({ name: '', reportType: 'sales_forecast', schedule: 'weekly', dayOfWeek: 1, timeOfDay: '09:00', emailRecipients: '' });
    toast.success(editingReport ? 'Report updated' : 'Report scheduled');
  };

  const openEditDialog = (report: ScheduledReport) => {
    setEditingReport(report);
    setNewReport({
      name: report.name,
      reportType: report.reportType,
      schedule: report.schedule,
      dayOfWeek: report.dayOfWeek || 1,
      timeOfDay: report.timeOfDay,
      emailRecipients: report.emailRecipients.join(', '),
    });
    setDialogOpen(true);
  };

  const getReportIcon = (type: string) => {
    const rt = reportTypes.find(r => r.value === type);
    if (!rt) return <FileText className="h-5 w-5" />;
    const Icon = rt.icon;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>Automate your analytics reports with email delivery</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingReport(null);
            setNewReport({ name: '', reportType: 'sales_forecast', schedule: 'weekly', dayOfWeek: 1, timeOfDay: '09:00', emailRecipients: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Schedule Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingReport ? 'Edit Scheduled Report' : 'Schedule New Report'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input 
                  value={newReport.name} 
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  placeholder="e.g., Weekly Sales Summary"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={newReport.reportType} onValueChange={(v) => setNewReport({ ...newReport, reportType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {reportTypes.map(rt => (
                      <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={newReport.schedule} onValueChange={(v) => setNewReport({ ...newReport, schedule: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {scheduleOptions.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {newReport.schedule === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select 
                      value={String(newReport.dayOfWeek)} 
                      onValueChange={(v) => setNewReport({ ...newReport, dayOfWeek: parseInt(v) })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day, i) => (
                          <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Input 
                  type="time"
                  value={newReport.timeOfDay} 
                  onChange={(e) => setNewReport({ ...newReport, timeOfDay: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <Input 
                  value={newReport.emailRecipients} 
                  onChange={(e) => setNewReport({ ...newReport, emailRecipients: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                />
                <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingReport ? 'Update Report' : 'Schedule Report'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No scheduled reports yet</p>
            <p className="text-sm text-muted-foreground">Create your first automated report above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div 
                key={report.id}
                className={`p-4 rounded-lg border transition-all ${
                  report.enabled ? 'border-border bg-card' : 'border-border/50 bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${report.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {getReportIcon(report.reportType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{report.name}</h4>
                        <Badge variant={report.enabled ? "default" : "secondary"}>
                          {report.enabled ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reportTypes.find(r => r.value === report.reportType)?.label}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {report.schedule === 'weekly' ? `${daysOfWeek[report.dayOfWeek || 0]}s` : report.schedule} at {report.timeOfDay}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {report.emailRecipients.length} recipient{report.emailRecipients.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={report.enabled}
                      onCheckedChange={() => handleToggleEnabled(report.id)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(report)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(report.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledReports;
