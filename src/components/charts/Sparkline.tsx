import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: { value: number }[];
  color?: string;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color = 'hsl(168, 76%, 42%)', height = 32 }) => {
  if (!data || data.length < 2) return null;

  // Take last 14 points max for a clean sparkline
  const sliced = data.slice(-14);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={sliced} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
          dot={false}
          isAnimationActive={true}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default Sparkline;
