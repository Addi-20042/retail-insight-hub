import React from 'react';
import { Users, TrendingUp, ShoppingBag, IndianRupee, AlertCircle, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSegmentation } from '@/hooks/useApiData';
import { useSalesData, useSalesStats } from '@/hooks/useSupabaseData';
import { EmptyState } from '@/components/EmptyState';
import { 
  StaggerContainer, FadeUp, PageHeader, StatCardSkeleton, ChartSkeleton, TableSkeleton, HoverCard, ShimmerSkeleton
} from '@/components/ui/animated-container';
import CategoryTreemap from '@/components/charts/CategoryTreemap';
import { exportSegmentsToPdf, captureChartAsImage } from '@/lib/exportPdf';
import { toast } from 'sonner';

const CustomerSegmentation: React.FC = () => {
  const { data, isLoading, isError, refetch } = useSegmentation();
  const { data: salesData } = useSalesData();
  const { data: salesStats } = useSalesStats();

  const hasData = salesData && salesData.length > 0;
  const segmentData = data?.segments || [];
  const productSegments = data?.products || [];
  const totalCustomers = data?.total_customers || 0;
  const totalRevenue = data?.total_revenue || 0;

  if (!hasData && !isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Customer Segmentation" description="K-Means clustering analysis of customer buying patterns" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chart-container">
          <EmptyState icon={<Users className="w-8 h-8 text-muted-foreground" />} title="No Data for Segmentation" description="Upload sales data with customer information to generate customer segments." />
        </motion.div>
      </div>
    );
  }

  const stats = [
    { icon: Users, color: 'primary', label: 'Total Customers', value: totalCustomers.toLocaleString() },
    { icon: IndianRupee, color: 'chart-secondary', label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}` },
    { icon: TrendingUp, color: 'success', label: 'Segments Found', value: segmentData.length },
    { icon: ShoppingBag, color: 'warning', label: 'Avg. Spend', value: `₹${totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers).toLocaleString('en-IN') : 0}` },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Customer Segmentation" description="K-Means clustering analysis of customer buying patterns">
        <Button variant="outline" size="icon" onClick={async () => {
          const chartImage = await captureChartAsImage('.recharts-wrapper');
          exportSegmentsToPdf(segmentData.map(s => ({
            name: s.name,
            count: s.count,
            avgSpend: `₹${s.avgSpend.toLocaleString('en-IN')}`,
            frequency: s.count > 10 ? 'High' : s.count > 5 ? 'Medium' : 'Low',
          })), chartImage);
          toast.success('PDF exported');
        }} title="Export to PDF">
          <Download className="w-4 h-4" />
        </Button>
      </PageHeader>

      {isError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-destructive font-medium">Failed to load segmentation data</p>
            <p className="text-sm text-muted-foreground">The analytics engine may be processing. Try refreshing.</p>
          </div>
        </motion.div>
      )}

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, i) => (
          <FadeUp key={i}>
            {isLoading ? <StatCardSkeleton /> : (
              <HoverCard>
                <div className="stat-card">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}
                      whileHover={{ rotate: 10 }}
                      transition={{ type: 'spring' }}
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

      <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6" staggerDelay={0.15}>
        <FadeUp className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Customer Distribution</h3>
          {isLoading ? <ChartSkeleton height="h-[300px]" /> : segmentData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No segment data</div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={segmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="count" nameKey="name">
                    {segmentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} formatter={(value: number) => [`${value} customers`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </FadeUp>

        <FadeUp className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                    <div className="flex gap-6 mt-3">
                      <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            segmentData.map((segment, i) => (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                whileHover={{ x: 4 }}
                className="bg-card rounded-xl p-4 border border-border/50 hover:shadow-md transition-shadow cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div className="w-3 h-12 rounded-full" style={{ backgroundColor: segment.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">{segment.name}</h4>
                      <span className="text-sm text-muted-foreground">Segment {segment.id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
                    <div className="flex flex-wrap gap-3 sm:gap-6 mt-3">
                      <div><p className="text-xs text-muted-foreground">Customers</p><p className="text-sm sm:text-base font-semibold text-foreground">{segment.count}</p></div>
                      <div><p className="text-xs text-muted-foreground">Avg. Spend</p><p className="text-sm sm:text-base font-semibold text-foreground">₹{Number(segment.avgSpend).toLocaleString('en-IN')}</p></div>
                      <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-sm sm:text-base font-semibold text-foreground">₹{segment.totalRevenue.toLocaleString('en-IN')}</p></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </FadeUp>
      </StaggerContainer>

      {/* Category Revenue Treemap */}
      {isLoading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="chart-container">
          <ShimmerSkeleton className="h-5 w-52 mb-2" />
          <ShimmerSkeleton className="h-3 w-72 mb-4" />
          <ShimmerSkeleton className="h-[300px] w-full rounded-lg" />
        </motion.div>
      ) : salesStats?.categoryBreakdown && salesStats.categoryBreakdown.length > 0 && (
        <FadeUp>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="chart-container"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Category Revenue Breakdown</h3>
              <p className="text-sm text-muted-foreground">Proportional view of revenue by product category</p>
            </div>
            <CategoryTreemap data={salesStats.categoryBreakdown} />
          </motion.div>
        </FadeUp>
      )}

      {/* Product Segments Table */}
      {isLoading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Product-Segment Analysis</h3>
          <TableSkeleton rows={5} cols={4} />
        </motion.div>
      ) : productSegments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="chart-container overflow-x-auto"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Product-Segment Analysis</h3>
          <table className="data-table">
            <thead><tr><th>Product Name</th><th>Total Quantity</th><th>Total Revenue</th><th>Primary Segment</th></tr></thead>
            <tbody>
              {productSegments.map((row, index) => (
                <motion.tr key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + index * 0.04 }}>
                  <td className="font-medium">{row.product}</td>
                  <td>{row.quantity.toLocaleString()}</td>
                  <td className="text-primary font-semibold">₹{row.revenue.toLocaleString('en-IN')}</td>
                  <td>
                    {segmentData[row.segment] && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${segmentData[row.segment].color}20`, color: segmentData[row.segment].color }}>
                        {segmentData[row.segment].name}
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default CustomerSegmentation;
