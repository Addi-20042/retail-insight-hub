import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Info, Bell, Clock, RefreshCw, Download, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAlerts } from '@/hooks/useApiData';
import { useSalesData } from '@/hooks/useSupabaseData';
import { EmptyState } from '@/components/EmptyState';
import type { Alert } from '@/lib/api';
import { exportAlertsToPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';
import { 
  StaggerContainer, FadeUp, PageHeader, StatCardSkeleton, HoverCard, ShimmerSkeleton
} from '@/components/ui/animated-container';

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'spike': return TrendingUp;
    case 'drop': return TrendingDown;
    case 'pattern': return Info;
    case 'warning': return AlertTriangle;
    default: return Bell;
  }
};

const getAlertStyles = (type: Alert['type']) => {
  switch (type) {
    case 'spike': return { bg: 'bg-success/10', border: 'border-success/30', icon: 'text-success' };
    case 'drop': return { bg: 'bg-destructive/10', border: 'border-destructive/30', icon: 'text-destructive' };
    case 'pattern': return { bg: 'bg-chart-secondary/10', border: 'border-chart-secondary/30', icon: 'text-chart-secondary' };
    case 'warning': return { bg: 'bg-warning/10', border: 'border-warning/30', icon: 'text-warning' };
    default: return { bg: 'bg-muted', border: 'border-border', icon: 'text-muted-foreground' };
  }
};

const getSeverityBadge = (severity: Alert['severity']) => {
  switch (severity) {
    case 'high': return 'bg-destructive/10 text-destructive';
    case 'medium': return 'bg-warning/10 text-warning';
    case 'low': return 'bg-muted text-muted-foreground';
  }
};

const Alerts: React.FC = () => {
  const { data, isLoading, isError, refetch } = useAlerts();
  const { data: salesData } = useSalesData();

  const hasData = salesData && salesData.length > 0;
  const alerts = data?.alerts || [];
  const highPriorityCount = data?.high_count || 0;
  const mediumPriorityCount = data?.medium_count || 0;
  const lowPriorityCount = data?.low_count || 0;

  if (!hasData && !isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Smart Alerts" description="AI-generated insights and anomaly detection" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chart-container">
          <EmptyState icon={<Bell className="w-8 h-8 text-muted-foreground" />} title="No Data for Alerts" description="Upload sales data to enable the AI alerts engine." />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Smart Alerts" description="AI-generated insights and anomaly detection from the Alerts Engine">
        <Button variant="outline" size="icon" onClick={() => { exportAlertsToPdf(alerts.map(a => ({ type: a.type, message: a.message, severity: a.severity, timestamp: a.timestamp }))); toast.success('PDF exported'); }}>
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </PageHeader>

      {isError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-destructive font-medium">Failed to load alerts</p>
            <p className="text-sm text-muted-foreground">The analytics engine may be processing.</p>
          </div>
        </motion.div>
      )}

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Bell, color: 'primary', bg: 'bg-primary/10', label: 'Total Alerts', value: alerts.length },
          { icon: AlertTriangle, color: 'destructive', bg: 'bg-destructive/10', label: 'High Priority', value: highPriorityCount },
          { icon: AlertTriangle, color: 'warning', bg: 'bg-warning/10', label: 'Medium Priority', value: mediumPriorityCount },
          { icon: Info, color: 'muted-foreground', bg: 'bg-muted', label: 'Low Priority', value: lowPriorityCount },
        ].map((stat, i) => (
          <FadeUp key={i}>
            {isLoading ? <StatCardSkeleton /> : (
              <HoverCard>
                <div className="stat-card">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
                      whileHover={{ rotate: 10 }}
                    >
                      <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                    </motion.div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </div>
              </HoverCard>
            )}
          </FadeUp>
        ))}
      </StaggerContainer>

      {/* Alert List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-muted/30 border border-border rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                <ShimmerSkeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <ShimmerSkeleton className="h-5 w-48" />
                  <ShimmerSkeleton className="h-4 w-full max-w-md" />
                  <div className="flex gap-4 mt-2">
                    <ShimmerSkeleton className="h-3 w-24" />
                    <ShimmerSkeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : alerts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chart-container text-center py-12">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            </motion.div>
            <p className="text-muted-foreground">No alerts at this time. Everything looks normal!</p>
          </motion.div>
        ) : (
          alerts.map((alert, index) => {
            const Icon = getAlertIcon(alert.type);
            const styles = getAlertStyles(alert.type);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                whileHover={{ x: 4 }}
                className={`${styles.bg} ${styles.border} border rounded-xl p-5 cursor-default`}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center flex-shrink-0`}
                    whileHover={{ scale: 1.15 }}
                  >
                    <Icon className={`w-5 h-5 ${styles.icon}`} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getSeverityBadge(alert.severity)}`}>{alert.severity}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{alert.timestamp}</span>
                      <span className="px-2 py-0.5 bg-muted rounded text-xs">{alert.category}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Alerts;
