import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const generateForecastData = (days: number) => {
  const data = [];
  const baseDate = new Date();
  const baseValue = 12000;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    const variance = Math.sin(i * 0.5) * 2000 + Math.random() * 1500;
    const trend = i * 50;
    const predicted = Math.round(baseValue + variance + trend);
    const confidence = Math.round(predicted * 0.1);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted,
      lower: predicted - confidence,
      upper: predicted + confidence,
    });
  }
  return data;
};

const SalesForecast: React.FC = () => {
  const [forecastDays, setForecastDays] = useState('7');
  const forecastData = generateForecastData(parseInt(forecastDays));

  const totalPredicted = forecastData.reduce((sum, d) => sum + d.predicted, 0);
  const avgDaily = Math.round(totalPredicted / forecastData.length);
  const trend = forecastData[forecastData.length - 1].predicted > forecastData[0].predicted;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Forecast</h1>
          <p className="text-muted-foreground mt-1">AI-powered demand prediction for your business</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <Select value={forecastDays} onValueChange={setForecastDays}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Next 3 Days</SelectItem>
              <SelectItem value="7">Next 7 Days</SelectItem>
              <SelectItem value="14">Next 14 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Predicted Sales</p>
          <p className="text-2xl font-bold text-foreground mt-1">${totalPredicted.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-2">For next {forecastDays} days</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Average Daily Sales</p>
          <p className="text-2xl font-bold text-foreground mt-1">${avgDaily.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-2">Predicted average</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Trend Direction</p>
              <p className="text-2xl font-bold text-foreground mt-1">{trend ? 'Upward' : 'Downward'}</p>
            </div>
            {trend ? (
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Forecast Chart</h3>
            <p className="text-sm text-muted-foreground">Predicted sales with confidence interval</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Predicted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/30" />
              <span className="text-muted-foreground">Confidence</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.05}/>
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
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`, 
                name === 'predicted' ? 'Predicted' : name === 'upper' ? 'Upper Bound' : 'Lower Bound'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="upper" 
              stroke="transparent" 
              fill="url(#colorConfidence)" 
            />
            <Area 
              type="monotone" 
              dataKey="lower" 
              stroke="transparent" 
              fill="hsl(var(--background))" 
            />
            <Area 
              type="monotone" 
              dataKey="predicted" 
              stroke="hsl(168, 76%, 42%)" 
              strokeWidth={2}
              fill="url(#colorForecast)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="chart-container overflow-x-auto">
        <h3 className="text-lg font-semibold text-foreground mb-4">Forecast Data</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Predicted Sales</th>
              <th>Lower Bound</th>
              <th>Upper Bound</th>
            </tr>
          </thead>
          <tbody>
            {forecastData.map((row, index) => (
              <tr key={index}>
                <td className="font-medium">{row.date}</td>
                <td className="text-primary font-semibold">${row.predicted.toLocaleString()}</td>
                <td className="text-muted-foreground">${row.lower.toLocaleString()}</td>
                <td className="text-muted-foreground">${row.upper.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesForecast;
