import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface CategoryData {
  name: string;
  revenue: number;
  quantity: number;
}

interface CategoryTreemapProps {
  data: CategoryData[];
}

const COLORS = [
  'hsl(168, 76%, 42%)',
  'hsl(221, 83%, 53%)',
  'hsl(48, 96%, 53%)',
  'hsl(280, 67%, 55%)',
  'hsl(350, 89%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(199, 89%, 48%)',
  'hsl(25, 95%, 53%)',
];

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, index, revenue } = props;

  if (width < 30 || height < 20) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={COLORS[index % COLORS.length]}
        fillOpacity={0.85}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        className="transition-opacity hover:opacity-100"
        style={{ opacity: 0.85 }}
      />
      {width > 50 && height > 35 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 6}
            textAnchor="middle"
            fill="white"
            fontSize={width > 100 ? 12 : 10}
            fontWeight={600}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize={width > 100 ? 11 : 9}
          >
            ₹{revenue?.toLocaleString('en-IN')}
          </text>
        </>
      )}
    </g>
  );
};

const CategoryTreemap: React.FC<CategoryTreemapProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const treemapData = data.map((item, i) => ({
    name: item.name,
    size: item.revenue,
    revenue: item.revenue,
    quantity: item.quantity,
    index: i,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={250}>
        <Treemap
          data={treemapData}
          dataKey="size"
          aspectRatio={4 / 3}
          content={<CustomTreemapContent />}
        >
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number, name: string, props: any) => {
              return [`₹${value.toLocaleString('en-IN')}`, 'Revenue'];
            }}
            labelFormatter={(label) => label}
          />
        </Treemap>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default CategoryTreemap;
