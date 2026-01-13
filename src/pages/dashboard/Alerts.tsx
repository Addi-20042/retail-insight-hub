import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Bell,
  Clock
} from 'lucide-react';

interface Alert {
  id: number;
  type: 'spike' | 'drop' | 'pattern' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
}

const alerts: Alert[] = [
  {
    id: 1,
    type: 'spike',
    title: 'Sales Spike Detected',
    message: 'Electronics category experienced a 45% increase in sales compared to the weekly average. This may indicate seasonal demand or successful marketing campaign.',
    timestamp: '2 hours ago',
    category: 'Electronics',
    severity: 'high'
  },
  {
    id: 2,
    type: 'drop',
    title: 'Sudden Sales Drop',
    message: 'Furniture category sales have dropped by 28% compared to the previous week. Consider reviewing pricing strategy or checking for supply chain issues.',
    timestamp: '5 hours ago',
    category: 'Furniture',
    severity: 'high'
  },
  {
    id: 3,
    type: 'pattern',
    title: 'New Buying Pattern',
    message: 'Customers purchasing laptops are now 35% more likely to also buy extended warranties. Consider creating a bundle offer.',
    timestamp: '1 day ago',
    category: 'Electronics',
    severity: 'medium'
  },
  {
    id: 4,
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Popular items in Sports category are running low. Based on current demand forecast, stock will deplete in 5 days.',
    timestamp: '1 day ago',
    category: 'Sports',
    severity: 'medium'
  },
  {
    id: 5,
    type: 'spike',
    title: 'Weekend Performance',
    message: 'Weekend sales outperformed weekday sales by 62% this week. Consider adjusting staff schedules and inventory.',
    timestamp: '2 days ago',
    category: 'All Categories',
    severity: 'low'
  },
  {
    id: 6,
    type: 'pattern',
    title: 'Customer Segment Shift',
    message: 'Premium buyer segment has grown by 12% this month. These customers show higher loyalty and average order value.',
    timestamp: '3 days ago',
    category: 'Customer Analysis',
    severity: 'low'
  },
];

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
  const highPriorityCount = alerts.filter(a => a.severity === 'high').length;
  const mediumPriorityCount = alerts.filter(a => a.severity === 'medium').length;
  const lowPriorityCount = alerts.filter(a => a.severity === 'low').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Smart Alerts</h1>
        <p className="text-muted-foreground mt-1">AI-generated insights and anomaly detection</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <p className="text-xl font-bold text-foreground">{alerts.length}</p>
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
              <p className="text-xl font-bold text-foreground">{highPriorityCount}</p>
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
              <p className="text-xl font-bold text-foreground">{mediumPriorityCount}</p>
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
              <p className="text-xl font-bold text-foreground">{lowPriorityCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {alerts.map((alert, index) => {
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
        })}
      </div>
    </div>
  );
};

export default Alerts;
