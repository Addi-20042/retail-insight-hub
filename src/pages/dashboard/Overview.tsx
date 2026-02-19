import React from 'react';
import { 
  TrendingUp, Users, ShoppingBag, AlertCircle, Database
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { QuickActions } from '@/components/QuickActions';
import { ActivityFeed } from '@/components/ActivityFeed';
import { EmptyState } from '@/components/EmptyState';
import { useSalesStats } from '@/hooks/useSupabaseData';
import { useAlerts } from '@/hooks/useApiData';
import { 
  StaggerContainer, FadeUp, PageHeader, StatCardSkeleton, ChartSkeleton, HoverCard, AnimatedNumber
} from '@/components/ui/animated-container';

const Overview: React.FC = () => {
  const { data: stats, isLoading, isError } = useSalesStats();
  const { data: alertsData } = useAlerts();

  const hasData = stats && stats.totalRows > 0;
  const alertCount = alertsData?.alerts?.length || 0;

  const statCards = [
    { label: 'Total Revenue', value: hasData ? stats.totalRevenue : 0, prefix: '₹', icon: TrendingUp, color: 'primary' },
    { label: 'Unique Products', value: hasData ? stats.uniqueProducts : 0, icon: Users, color: 'chart-secondary' },
    { label: 'Products Sold', value: hasData ? stats.totalProducts : 0, icon: ShoppingBag, color: 'success' },
    { label: 'Active Alerts', value: alertCount, icon: AlertCircle, color: 'warning' },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard Overview" description="Monitor your retail analytics at a glance" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center"
        >
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">Failed to load dashboard data</p>
          <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Overview" description="Monitor your retail analytics at a glance" />

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <FadeUp key={index}>
            {isLoading ? (
              <StatCardSkeleton />
            ) : (
              <HoverCard>
                <div className="stat-card group">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground mt-1">
                        <AnimatedNumber value={stat.value} prefix={stat.prefix || ''} />
                      </p>
                    </div>
                    <motion.div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center shrink-0`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}`} />
                    </motion.div>
                  </div>
                </div>
              </HoverCard>
            )}
          </FadeUp>
        ))}
      </StaggerContainer>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <QuickActions />
      </motion.div>

      {/* Charts & Activity Section */}
      <StaggerContainer className="grid grid-cols-1 xl:grid-cols-3 gap-6" staggerDelay={0.15}>
        {/* Revenue Chart */}
        <FadeUp className="xl:col-span-2 chart-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Monthly revenue from your sales data</p>
            </div>
          </div>
          {isLoading ? (
            <ChartSkeleton />
          ) : !hasData ? (
            <EmptyState
              icon={<Database className="w-8 h-8 text-muted-foreground" />}
              title="No Sales Data Yet"
              description="Upload your CSV sales data to see revenue trends and analytics here."
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                   <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                     formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                   />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(168, 76%, 42%)" strokeWidth={2.5} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </FadeUp>

        <FadeUp>
          <ActivityFeed />
        </FadeUp>
      </StaggerContainer>
    </div>
  );
};

export default Overview;
