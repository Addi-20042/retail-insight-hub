import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { QuickActions } from '@/components/QuickActions';
import { ActivityFeed } from '@/components/ActivityFeed';

const stats = [
  { 
    label: 'Total Revenue', 
    value: '$124,592', 
    change: '+12.5%', 
    trend: 'up',
    icon: TrendingUp,
    color: 'primary'
  },
  { 
    label: 'Active Customers', 
    value: '2,847', 
    change: '+8.2%', 
    trend: 'up',
    icon: Users,
    color: 'chart-secondary'
  },
  { 
    label: 'Products Sold', 
    value: '12,453', 
    change: '+23.1%', 
    trend: 'up',
    icon: ShoppingBag,
    color: 'success'
  },
  { 
    label: 'Active Alerts', 
    value: '3', 
    change: '-2', 
    trend: 'down',
    icon: AlertCircle,
    color: 'warning'
  },
];

const revenueData = [
  { date: 'Jan', revenue: 65000, forecast: 68000 },
  { date: 'Feb', revenue: 72000, forecast: 74000 },
  { date: 'Mar', revenue: 68000, forecast: 71000 },
  { date: 'Apr', revenue: 85000, forecast: 82000 },
  { date: 'May', revenue: 92000, forecast: 89000 },
  { date: 'Jun', revenue: 88000, forecast: 91000 },
  { date: 'Jul', revenue: 102000, forecast: 98000 },
  { date: 'Aug', revenue: 110000, forecast: 108000 },
  { date: 'Sep', revenue: 118000, forecast: 115000 },
  { date: 'Oct', revenue: 124592, forecast: 122000 },
];

const recentAlerts = [
  { id: 1, type: 'spike', message: 'Electronics category sales up 45% this week', severity: 'success' },
  { id: 2, type: 'drop', message: 'Furniture sales dropped 15% compared to last month', severity: 'warning' },
  { id: 3, type: 'pattern', message: 'New buying pattern detected in Groceries', severity: 'info' },
];

const Overview: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Monitor your retail analytics at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card animate-slide-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}`} />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center gap-1">
              {stat.trend === 'up' ? (
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
              )}
              <span className={stat.trend === 'up' ? 'text-success text-xs sm:text-sm font-medium' : 'text-destructive text-xs sm:text-sm font-medium'}>
                {stat.change}
              </span>
              <span className="text-muted-foreground text-xs sm:text-sm ml-1 hidden sm:inline">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 chart-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Actual vs Forecast</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-secondary" />
                <span className="text-muted-foreground">Forecast</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(168, 76%, 42%)" 
                strokeWidth={2}
                fill="url(#colorRevenue)" 
              />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="hsl(199, 89%, 48%)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Feed */}
        <ActivityFeed />
      </div>

      {/* Recent Alerts */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Alerts</h3>
          <a 
            href="/dashboard/alerts" 
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recentAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-lg border ${
                alert.severity === 'success' ? 'bg-success/5 border-success/20' :
                alert.severity === 'warning' ? 'bg-warning/5 border-warning/20' :
                'bg-chart-secondary/5 border-chart-secondary/20'
              }`}
            >
              <p className="text-sm text-foreground">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;
