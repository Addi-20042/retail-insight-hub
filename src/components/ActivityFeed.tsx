import React from 'react';
import { 
  Activity, 
  Upload, 
  Download, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Settings,
  LogIn,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'upload' | 'export' | 'forecast' | 'segment' | 'alert' | 'settings' | 'login';
  message: string;
  timestamp: Date;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'upload': return Upload;
    case 'export': return Download;
    case 'forecast': return TrendingUp;
    case 'segment': return Users;
    case 'alert': return AlertTriangle;
    case 'settings': return Settings;
    case 'login': return LogIn;
    default: return Activity;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'upload': return 'text-chart-secondary bg-chart-secondary/10';
    case 'export': return 'text-success bg-success/10';
    case 'forecast': return 'text-primary bg-primary/10';
    case 'segment': return 'text-chart-accent bg-chart-accent/10';
    case 'alert': return 'text-warning bg-warning/10';
    case 'settings': return 'text-muted-foreground bg-muted';
    case 'login': return 'text-success bg-success/10';
    default: return 'text-muted-foreground bg-muted';
  }
};

// Sample activity data
const sampleActivities: ActivityItem[] = [
  { id: '1', type: 'login', message: 'Signed in successfully', timestamp: new Date() },
  { id: '2', type: 'forecast', message: 'Generated 7-day sales forecast', timestamp: new Date(Date.now() - 3600000) },
  { id: '3', type: 'export', message: 'Exported alerts report to PDF', timestamp: new Date(Date.now() - 7200000) },
  { id: '4', type: 'segment', message: 'Analyzed 2,847 customer segments', timestamp: new Date(Date.now() - 14400000) },
  { id: '5', type: 'upload', message: 'Uploaded sales_data_q4.csv (12,453 rows)', timestamp: new Date(Date.now() - 28800000) },
  { id: '6', type: 'alert', message: 'Reviewed 3 high-priority alerts', timestamp: new Date(Date.now() - 43200000) },
  { id: '7', type: 'settings', message: 'Updated notification preferences', timestamp: new Date(Date.now() - 86400000) },
];

export const ActivityFeed: React.FC = () => {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="px-6 pb-4 space-y-3">
            {sampleActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass.split(' ')[1]}`}>
                    <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
