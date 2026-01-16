import React from 'react';
import { Users, TrendingUp, ShoppingBag, DollarSign, RefreshCw } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useSegmentation } from '@/hooks/useApiData';

const CustomerSegmentation: React.FC = () => {
  const { data, isLoading, isError, refetch } = useSegmentation();

  const segmentData = data?.segments || [];
  const productSegments = data?.products || [];
  const totalCustomers = data?.total_customers || 0;
  const totalRevenue = data?.total_revenue || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Segmentation</h1>
          <p className="text-muted-foreground mt-1">K-Means clustering analysis of customer buying patterns</p>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          Failed to load segmentation data. Using cached or mock data.
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-xl font-bold text-foreground">
                {isLoading ? '...' : totalCustomers.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-secondary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-chart-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold text-foreground">
                {isLoading ? '...' : `$${totalRevenue.toLocaleString()}`}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Segments Found</p>
              <p className="text-xl font-bold text-foreground">
                {isLoading ? '...' : segmentData.length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Spend</p>
              <p className="text-xl font-bold text-foreground">
                {isLoading ? '...' : `$${totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Segments Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Customer Distribution</h3>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} customers`, '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Segment Cards */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
          ) : (
            segmentData.map((segment) => (
              <div 
                key={segment.id} 
                className="bg-card rounded-xl p-4 border border-border/50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">{segment.name}</h4>
                      <span className="text-sm text-muted-foreground">Segment {segment.id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
                    <div className="flex gap-6 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Customers</p>
                        <p className="font-semibold text-foreground">{segment.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg. Spend</p>
                        <p className="font-semibold text-foreground">${segment.avgSpend}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                        <p className="font-semibold text-foreground">${segment.totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Product Segments Table */}
      <div className="chart-container overflow-x-auto">
        <h3 className="text-lg font-semibold text-foreground mb-4">Product-Segment Analysis</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Total Quantity</th>
              <th>Total Revenue</th>
              <th>Primary Segment</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">Loading segmentation data...</td>
              </tr>
            ) : (
              productSegments.map((row, index) => (
                <tr key={index}>
                  <td className="font-medium">{row.product}</td>
                  <td>{row.quantity.toLocaleString()}</td>
                  <td className="text-primary font-semibold">${row.revenue.toLocaleString()}</td>
                  <td>
                    {segmentData[row.segment] && (
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${segmentData[row.segment].color}20`,
                          color: segmentData[row.segment].color
                        }}
                      >
                        {segmentData[row.segment].name}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerSegmentation;
