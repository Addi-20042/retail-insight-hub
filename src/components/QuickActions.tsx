import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Upload,
  FileText,
  AlertTriangle,
  Users,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exportForecastToPdf, exportAlertsToPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: BarChart3,
      label: 'New Forecast',
      description: 'Generate sales prediction',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => navigate('/dashboard/forecast'),
    },
    {
      icon: Upload,
      label: 'Upload Data',
      description: 'Import CSV dataset',
      color: 'text-chart-secondary',
      bgColor: 'bg-chart-secondary/10',
      onClick: () => navigate('/dashboard/upload'),
    },
    {
      icon: FileText,
      label: 'Export Report',
      description: 'Download PDF report',
      color: 'text-success',
      bgColor: 'bg-success/10',
      onClick: () => {
        exportForecastToPdf({});
        toast.success('Report generated!');
      },
    },
    {
      icon: AlertTriangle,
      label: 'View Alerts',
      description: 'Check smart alerts',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      onClick: () => navigate('/dashboard/alerts'),
    },
    {
      icon: Users,
      label: 'Segments',
      description: 'Customer clusters',
      color: 'text-chart-accent',
      bgColor: 'bg-chart-accent/10',
      onClick: () => navigate('/dashboard/segmentation'),
    },
    {
      icon: Search,
      label: 'Basket Search',
      description: 'Find associations',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      onClick: () => navigate('/dashboard/basket'),
    },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
            >
              <div className={`w-10 h-10 rounded-lg ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">{action.label}</p>
                <p className="text-[10px] text-muted-foreground">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
