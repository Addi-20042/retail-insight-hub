import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Bell,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAlerts } from '@/hooks/useApiData';
import type { Alert } from '@/lib/api';
import { exportAlertsToPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'spike':
      return TrendingUp;
    case 'drop':
      return TrendingDown;
    case 'pattern':
      return Info;
    case 'warning':
      return AlertTriangle;
    default:
      return Bell;
  }
};

const getAlertStyles = (type: Alert['type']) => {
  switch (type) {
    case 'spike':
      return { bg: 'bg-success/10', border: 'border-success/30', icon: 'text-success' };
    case 'drop':
      return { bg: 'bg-destructive/10', border: 'border-destructive/30', icon: 'text-destructive' };
    case 'pattern':
      return { bg: 'bg-chart-secondary/10', border: 'border-chart-secondary/30', icon: 'text-chart-secondary' };
    case 'warning':
      return { bg: 'bg-warning/10', border: 'border-warning/30', icon: 'text-warning' };
    default:
      return { bg: 'bg-muted', border: 'border-border', icon: 'text-muted-foreground' };
  }
};

const getSeverityBadge = (severity: Alert['severity']) => {
  switch (severity) {
    case 'high':
      return 'bg-destructive/10 text-destructive';
    case 'medium':
      return 'bg-warning/10 text-warning';
    case 'low':
      return 'bg-muted text-muted-foreground';
  }
};

const Alerts: React.FC = () => {
  const { data, isLoading, isError, refetch } = useAlerts();

  const alerts = data?.alerts || [];
  const highPriorityCount = data?.high_count || 0;
  const mediumPriorityCount = data?.medium_count || 0;
  const lowPriorityCount = data?.low_count || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Smart Alerts</h1>
          <p className="text-muted-foreground mt-1">AI-generated insights and anomaly detection from the Alerts Engine</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              exportAlertsToPdf(alerts.map(a => ({ 
                type: a.type, 
                message: a.message, 
                severity: a.severity, 
                timestamp: a.timestamp 
              })));
              toast.success('PDF exported successfully');
            }}
            title="Export to PDF"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          Failed to load alerts. Using cached or mock data.
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <p className="text-xl font-bold text-foreground">
                {isLoading ? '...' : alerts.length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-xl font-bold text-foreground">
                {isLoading ? '...' : highPriorityCount}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medium Priority</p>
              <p className="text-xl font-bold text-foreground">
                {isLoading ? '...' : mediumPriorityCount}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Info className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Priority</p>
              <p className="text-xl font-bold text-foreground">
                {isLoading ? '...' : lowPriorityCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ) : (
          alerts.map((alert, index) => {
            const Icon = getAlertIcon(alert.type);
            const styles = getAlertStyles(alert.type);

            return (
              <div 
                key={alert.id}
                className={`${styles.bg} ${styles.border} border rounded-xl p-5 animate-slide-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${styles.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {alert.timestamp}
                      </span>
                      <span className="px-2 py-0.5 bg-muted rounded text-xs">
                        {alert.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Alerts;
