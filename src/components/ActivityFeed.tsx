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
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useActivityLog } from '@/hooks/useSupabaseData';
import { Skeleton } from '@/components/ui/skeleton';

const getActivityIcon = (type: string) => {
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

const getActivityColor = (type: string) => {
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

export const ActivityFeed: React.FC = () => {
  const { data: activities, isLoading } = useActivityLog();

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
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : !activities || activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Database className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground">Upload data or perform actions to see activity here</p>
              </div>
            ) : (
              activities.map((activity) => {
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
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
