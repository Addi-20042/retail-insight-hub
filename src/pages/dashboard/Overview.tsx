import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, ShoppingBag, Database, Upload, BarChart3, ShoppingCart, Target
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { QuickActions } from '@/components/QuickActions';
import { ActivityFeed } from '@/components/ActivityFeed';
import { EmptyState } from '@/components/EmptyState';
import { useSalesStats } from '@/hooks/useSupabaseData';
import { 
  StaggerContainer, FadeUp, PageHeader, StatCardSkeleton, ChartSkeleton, HoverCard, AnimatedNumber, ShimmerSkeleton
} from '@/components/ui/animated-container';
import Sparkline from '@/components/charts/Sparkline';
import RevenueHeatmap from '@/components/charts/RevenueHeatmap';

const Overview: React.FC = () => {
  const { data: stats, isLoading, isError } = useSalesStats();
  const navigate = useNavigate();

  const hasData = stats && stats.totalRows > 0;

  // Prepare sparkline data from daily revenue
  const revenueSparkline = hasData ? (stats.dailyRevenue || []).map(d => ({ value: d.revenue })) : [];
  const quantitySparkline = hasData ? (stats.dailyQuantity || []).map(d => ({ value: d.value })) : [];

  const statCards = [
    { label: 'Total Revenue', value: hasData ? stats.totalRevenue : 0, prefix: '₹', icon: TrendingUp, color: 'primary', sparkline: revenueSparkline, sparkColor: 'hsl(168, 76%, 42%)' },
    { label: 'Unique Products', value: hasData ? stats.uniqueProducts : 0, icon: Users, color: 'chart-secondary', sparkline: quantitySparkline, sparkColor: 'hsl(221, 83%, 53%)' },
    { label: 'Products Sold', value: hasData ? stats.totalProducts : 0, icon: ShoppingBag, color: 'success', sparkline: quantitySparkline, sparkColor: 'hsl(142, 71%, 45%)' },
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
          <Database className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive font-medium">Failed to load dashboard data</p>
          <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <PageHeader title="Dashboard Overview" description="Monitor your retail analytics at a glance" />

      {/* Stats Grid with Sparklines */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <FadeUp key={index}>
            {isLoading ? (
              <StatCardSkeleton />
            ) : (
              <HoverCard>
                <div className="stat-card group min-h-[100px]">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 break-words leading-tight">
                        <AnimatedNumber value={stat.value} prefix={stat.prefix || ''} />
                      </p>
                    </div>
                    <motion.div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center shrink-0`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}`} />
                    </motion.div>
                  </div>
                  {/* Sparkline */}
                  {stat.sparkline.length > 2 && (
                    <div className="mt-2 -mx-1">
                      <Sparkline data={stat.sparkline} color={stat.sparkColor} height={28} />
                    </div>
                  )}
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
        transition={{ delay: 0.1, duration: 0.25 }}
      >
        <QuickActions />
      </motion.div>

      {/* Charts & Activity Section */}
      <StaggerContainer className="grid grid-cols-1 xl:grid-cols-3 gap-6" staggerDelay={0.05}>
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
            <div className="py-8 text-center space-y-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"
              >
                <Upload className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Get Started with RetailMind</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Upload your sales CSV to unlock forecasts, customer segments, basket analysis, and more.
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard/upload')} className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Sales Data
              </Button>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/50 mt-4">
                {[
                  { icon: BarChart3, label: 'Sales Forecasting' },
                  { icon: Users, label: 'Customer Segments' },
                  { icon: ShoppingCart, label: 'Basket Analysis' },
                  { icon: Target, label: 'Goals & Tracking' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex flex-col items-center gap-1.5 py-2"
                  >
                    <feature.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} width={45} />
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

      {/* Revenue Heatmap Calendar */}
      {hasData && stats.dailyRevenue && stats.dailyRevenue.length > 0 && (
        <FadeUp>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="chart-container"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Revenue Heatmap</h3>
              <p className="text-sm text-muted-foreground">Daily revenue intensity over the last 12 weeks</p>
            </div>
            <RevenueHeatmap data={stats.dailyRevenue} />
          </motion.div>
        </FadeUp>
      )}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="chart-container">
          <div className="mb-4">
            <ShimmerSkeleton className="h-5 w-40 mb-2" />
            <ShimmerSkeleton className="h-3 w-64" />
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 12 }).map((_, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, di) => (
                  <div key={di} className="w-3 h-3 rounded-[2px] bg-muted animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Overview;
