import React from 'react';
import { Users, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const segmentData = [
  { 
    id: 0, 
    name: 'Premium Buyers', 
    count: 234, 
    avgSpend: 458, 
    totalRevenue: 107172,
    color: 'hsl(168, 76%, 42%)',
    description: 'High-value customers with frequent large purchases'
  },
  { 
    id: 1, 
    name: 'Regular Customers', 
    count: 567, 
    avgSpend: 125, 
    totalRevenue: 70875,
    color: 'hsl(199, 89%, 48%)',
    description: 'Consistent buyers with moderate spending'
  },
  { 
    id: 2, 
    name: 'Occasional Shoppers', 
    count: 892, 
    avgSpend: 45, 
    totalRevenue: 40140,
    color: 'hsl(262, 83%, 58%)',
    description: 'Infrequent buyers with low average spend'
  },
  { 
    id: 3, 
    name: 'New Customers', 
    count: 345, 
    avgSpend: 78, 
    totalRevenue: 26910,
    color: 'hsl(38, 92%, 50%)',
    description: 'Recently acquired customers'
  },
];

const productSegments = [
  { product: 'Laptop Pro X1', quantity: 156, revenue: 155844, segment: 0 },
  { product: 'Wireless Earbuds', quantity: 892, revenue: 44600, segment: 1 },
  { product: 'Office Chair Deluxe', quantity: 234, revenue: 58266, segment: 0 },
  { product: 'Desk Organizer Set', quantity: 567, revenue: 14175, segment: 2 },
  { product: 'Smart Watch Series 5', quantity: 345, revenue: 103155, segment: 0 },
  { product: 'USB-C Hub', quantity: 678, revenue: 27120, segment: 1 },
  { product: 'Notebook Pack (12)', quantity: 1234, revenue: 12340, segment: 2 },
  { product: 'Monitor Stand Pro', quantity: 189, revenue: 17010, segment: 1 },
];

const CustomerSegmentation: React.FC = () => {
  const totalCustomers = segmentData.reduce((sum, s) => sum + s.count, 0);
  const totalRevenue = segmentData.reduce((sum, s) => sum + s.totalRevenue, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customer Segmentation</h1>
        <p className="text-muted-foreground mt-1">K-Means clustering analysis of customer buying patterns</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-xl font-bold text-foreground">{totalCustomers.toLocaleString()}</p>
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
              <p className="text-xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
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
              <p className="text-xl font-bold text-foreground">{segmentData.length}</p>
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
              <p className="text-xl font-bold text-foreground">${Math.round(totalRevenue / totalCustomers)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Segments Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Customer Distribution</h3>
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
        </div>

        {/* Segment Cards */}
        <div className="space-y-4">
          {segmentData.map((segment) => (
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
          ))}
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
            {productSegments.map((row, index) => (
              <tr key={index}>
                <td className="font-medium">{row.product}</td>
                <td>{row.quantity.toLocaleString()}</td>
                <td className="text-primary font-semibold">${row.revenue.toLocaleString()}</td>
                <td>
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${segmentData[row.segment].color}20`,
                      color: segmentData[row.segment].color
                    }}
                  >
                    {segmentData[row.segment].name}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerSegmentation;
