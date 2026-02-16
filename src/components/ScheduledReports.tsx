import React, { useState } from 'react';
import { 
  Calendar, Clock, Mail, Plus, Edit2, Trash2, Send,
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSendReport } from '@/hooks/useApiData';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sendReport = useSendReport();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['scheduled_reports', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newReport, setNewReport] = useState({
    name: '',
    reportType: 'sales_forecast',
    schedule: 'weekly',
    dayOfWeek: 1,
    timeOfDay: '09:00',
    emailRecipients: '',
  });

  const saveMutation = useMutation({
    mutationFn: async (report: typeof newReport & { id?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const recipients = report.emailRecipients.split(',').map(e => e.trim()).filter(e => e);
      if (recipients.length === 0) throw new Error('Add at least one recipient');

      const payload = {
        user_id: user.id,
        name: report.name,
        report_type: report.reportType,
        schedule: report.schedule,
        day_of_week: report.dayOfWeek,
        time_of_day: report.timeOfDay,
        email_recipients: recipients,
        enabled: true,
      };

      if (report.id) {
        const { error } = await supabase.from('scheduled_reports').update(payload).eq('id', report.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('scheduled_reports').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled_reports'] });
      setDialogOpen(false);
      setEditingId(null);
      setNewReport({ name: '', reportType: 'sales_forecast', schedule: 'weekly', dayOfWeek: 1, timeOfDay: '09:00', emailRecipients: '' });
      toast.success(editingId ? 'Report updated' : 'Report scheduled');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('scheduled_reports').update({ enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled_reports'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scheduled_reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled_reports'] });
      toast.success('Report deleted');
    },
  });

  const handleSendNow = async (report: typeof reports[0]) => {
    try {
      await sendReport.mutateAsync({
        reportType: report.report_type,
        recipients: report.email_recipients || [],
        reportName: report.name,
      });
      toast.success(`Report sent to ${(report.email_recipients || []).length} recipient(s)`);
      queryClient.invalidateQueries({ queryKey: ['scheduled_reports'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to send report');
    }
  };

  const openEditDialog = (report: typeof reports[0]) => {
    setEditingId(report.id);
    setNewReport({
      name: report.name,
      reportType: report.report_type,
      schedule: report.schedule,
      dayOfWeek: report.day_of_week || 1,
      timeOfDay: report.time_of_day || '09:00',
      emailRecipients: (report.email_recipients || []).join(', '),
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
          <CardDescription>Automate your analytics reports with email delivery via Resend</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setNewReport({ name: '', reportType: 'sales_forecast', schedule: 'weekly', dayOfWeek: 1, timeOfDay: '09:00', emailRecipients: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Schedule Report</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Scheduled Report' : 'Schedule New Report'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input value={newReport.name} onChange={(e) => setNewReport({ ...newReport, name: e.target.value })} placeholder="e.g., Weekly Sales Summary" />
              </div>
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={newReport.reportType} onValueChange={(v) => setNewReport({ ...newReport, reportType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{reportTypes.map(rt => (<SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={newReport.schedule} onValueChange={(v) => setNewReport({ ...newReport, schedule: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{scheduleOptions.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                {newReport.schedule === 'weekly' && (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select value={String(newReport.dayOfWeek)} onValueChange={(v) => setNewReport({ ...newReport, dayOfWeek: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{daysOfWeek.map((day, i) => (<SelectItem key={i} value={String(i)}>{day}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Input type="time" value={newReport.timeOfDay} onChange={(e) => setNewReport({ ...newReport, timeOfDay: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <Input value={newReport.emailRecipients} onChange={(e) => setNewReport({ ...newReport, emailRecipients: e.target.value })} placeholder="email1@example.com, email2@example.com" />
                <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
              </div>
              <Button 
                onClick={() => saveMutation.mutate({ ...newReport, id: editingId || undefined })} 
                className="w-full"
                disabled={saveMutation.isPending || !newReport.name.trim()}
              >
                {editingId ? 'Update Report' : 'Schedule Report'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No scheduled reports yet</p>
            <p className="text-sm text-muted-foreground">Create your first automated report above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className={`p-4 rounded-lg border transition-all ${report.enabled ? 'border-border bg-card' : 'border-border/50 bg-muted/30 opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${report.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {getReportIcon(report.report_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{report.name}</h4>
                        <Badge variant={report.enabled ? "default" : "secondary"}>{report.enabled ? 'Active' : 'Paused'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{reportTypes.find(r => r.value === report.report_type)?.label}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {report.schedule === 'weekly' ? `${daysOfWeek[report.day_of_week || 0]}s` : report.schedule} at {report.time_of_day || '09:00'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {(report.email_recipients || []).length} recipient{(report.email_recipients || []).length !== 1 ? 's' : ''}
                        </span>
                        {report.last_sent_at && (
                          <span className="text-xs">Last sent: {new Date(report.last_sent_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleSendNow(report)} title="Send now" disabled={sendReport.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                    <Switch checked={report.enabled} onCheckedChange={() => toggleMutation.mutate({ id: report.id, enabled: !report.enabled })} />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(report)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm('Delete this scheduled report?')) deleteMutation.mutate(report.id); }}>
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
