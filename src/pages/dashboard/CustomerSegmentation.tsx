import React from 'react';
import { Users, TrendingUp, ShoppingBag, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { useSegmentation } from '@/hooks/useApiData';
import { useSalesData } from '@/hooks/useSupabaseData';
import { EmptyState } from '@/components/EmptyState';

const CustomerSegmentation: React.FC = () => {
  const { data, isLoading, isError, refetch } = useSegmentation();
  const { data: salesData } = useSalesData();

  const hasData = salesData && salesData.length > 0;
  const segmentData = data?.segments || [];
  const productSegments = data?.products || [];
  const totalCustomers = data?.total_customers || 0;
  const totalRevenue = data?.total_revenue || 0;

  if (!hasData && !isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Segmentation</h1>
          <p className="text-muted-foreground mt-1">K-Means clustering analysis of customer buying patterns</p>
        </div>
        <div className="chart-container">
          <EmptyState
            icon={<Users className="w-8 h-8 text-muted-foreground" />}
            title="No Data for Segmentation"
            description="Upload sales data with customer information to generate customer segments using K-Means clustering."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Segmentation</h1>
          <p className="text-muted-foreground mt-1">K-Means clustering analysis of customer buying patterns</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-destructive font-medium">Failed to load segmentation data</p>
            <p className="text-sm text-muted-foreground">Make sure the Flask backend is running.</p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Users, color: 'primary', label: 'Total Customers', value: totalCustomers.toLocaleString() },
          { icon: DollarSign, color: 'chart-secondary', label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}` },
          { icon: TrendingUp, color: 'success', label: 'Segments Found', value: segmentData.length },
          { icon: ShoppingBag, color: 'warning', label: 'Avg. Spend', value: `$${totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0}` },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{isLoading ? '...' : stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Segments Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Customer Distribution</h3>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center"><RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" /></div>
          ) : segmentData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No segment data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={segmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="count" nameKey="name">
                  {segmentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value} customers`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full"><RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" /></div>
          ) : segmentData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">No segments available</div>
          ) : (
            segmentData.map((segment) => (
              <div key={segment.id} className="bg-card rounded-xl p-4 border border-border/50 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-12 rounded-full" style={{ backgroundColor: segment.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">{segment.name}</h4>
                      <span className="text-sm text-muted-foreground">Segment {segment.id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
                    <div className="flex gap-6 mt-3">
                      <div><p className="text-xs text-muted-foreground">Customers</p><p className="font-semibold text-foreground">{segment.count}</p></div>
                      <div><p className="text-xs text-muted-foreground">Avg. Spend</p><p className="font-semibold text-foreground">${segment.avgSpend}</p></div>
                      <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="font-semibold text-foreground">${segment.totalRevenue.toLocaleString()}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Product Segments Table */}
      {productSegments.length > 0 && (
        <div className="chart-container overflow-x-auto">
          <h3 className="text-lg font-semibold text-foreground mb-4">Product-Segment Analysis</h3>
          <table className="data-table">
            <thead><tr><th>Product Name</th><th>Total Quantity</th><th>Total Revenue</th><th>Primary Segment</th></tr></thead>
            <tbody>
              {productSegments.map((row, index) => (
                <tr key={index}>
                  <td className="font-medium">{row.product}</td>
                  <td>{row.quantity.toLocaleString()}</td>
                  <td className="text-primary font-semibold">${row.revenue.toLocaleString()}</td>
                  <td>
                    {segmentData[row.segment] && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${segmentData[row.segment].color}20`, color: segmentData[row.segment].color }}>
                        {segmentData[row.segment].name}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerSegmentation;
