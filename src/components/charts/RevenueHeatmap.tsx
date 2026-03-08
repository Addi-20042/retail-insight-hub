import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DayData {
  date: string;
  revenue: number;
}

interface RevenueHeatmapProps {
  data: DayData[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getIntensityClass = (value: number, max: number): string => {
  if (max === 0 || value === 0) return 'bg-muted/40';
  const ratio = value / max;
  if (ratio > 0.75) return 'bg-primary/80';
  if (ratio > 0.5) return 'bg-primary/55';
  if (ratio > 0.25) return 'bg-primary/35';
  return 'bg-primary/15';
};

const RevenueHeatmap: React.FC<RevenueHeatmapProps> = ({ data }) => {
  const { weeks, maxRevenue } = useMemo(() => {
    if (!data.length) return { weeks: [], maxRevenue: 0 };

    // Take last 12 weeks of data
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const recentData = sorted.slice(-84); // 12 weeks * 7 days

    const dayMap = new Map<string, number>();
    recentData.forEach(d => dayMap.set(d.date, d.revenue));

    let max = 0;
    recentData.forEach(d => { if (d.revenue > max) max = d.revenue; });

    // Group into weeks
    if (recentData.length === 0) return { weeks: [], maxRevenue: 0 };

    const startDate = new Date(recentData[0].date);
    const endDate = new Date(recentData[recentData.length - 1].date);
    
    const weeks: { date: string; revenue: number; dayOfWeek: number }[][] = [];
    let currentWeek: { date: string; revenue: number; dayOfWeek: number }[] = [];

    const cursor = new Date(startDate);
    // Align to Monday
    const dayOffset = (cursor.getDay() + 6) % 7;
    cursor.setDate(cursor.getDate() - dayOffset);

    while (cursor <= endDate || currentWeek.length > 0) {
      const dateStr = cursor.toISOString().split('T')[0];
      const dayOfWeek = (cursor.getDay() + 6) % 7; // Mon=0
      
      currentWeek.push({
        date: dateStr,
        revenue: dayMap.get(dateStr) || 0,
        dayOfWeek,
      });

      if (dayOfWeek === 6 || cursor >= endDate) {
        weeks.push(currentWeek);
        currentWeek = [];
        if (cursor >= endDate) break;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return { weeks: weeks.slice(-12), maxRevenue: max };
  }, [data]);

  if (weeks.length === 0) return null;

  return (
    <div>
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1.5 pt-0">
          {DAYS.map((d, i) => (
            <span key={d} className="text-[9px] text-muted-foreground h-3 flex items-center leading-none">
              {i % 2 === 0 ? d : ''}
            </span>
          ))}
        </div>
        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {Array.from({ length: 7 }).map((_, di) => {
              const cell = week.find(c => c.dayOfWeek === di);
              if (!cell) return <div key={di} className="w-3 h-3 rounded-[2px]" />;
              return (
                <Tooltip key={di}>
                  <TooltipTrigger asChild>
                    <motion.div
                      className={`w-3 h-3 rounded-[2px] cursor-default transition-colors ${getIntensityClass(cell.revenue, maxRevenue)}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: wi * 0.03 + di * 0.01, duration: 0.2 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">₹{cell.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-muted-foreground">{new Date(cell.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[2px] bg-muted/40" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/15" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/35" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/55" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/80" />
        <span>More</span>
      </div>
    </div>
  );
};

export default RevenueHeatmap;
