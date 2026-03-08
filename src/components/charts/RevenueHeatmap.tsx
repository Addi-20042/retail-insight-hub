import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Flame, Calendar } from 'lucide-react';

interface DayData {
  date: string;
  revenue: number;
}

interface RevenueHeatmapProps {
  data: DayData[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getIntensityStyle = (value: number, max: number): { bg: string; glow: boolean } => {
  if (max === 0 || value === 0) return { bg: 'bg-muted/30 dark:bg-muted/20', glow: false };
  const ratio = value / max;
  if (ratio > 0.85) return { bg: 'bg-emerald-500 dark:bg-emerald-400', glow: true };
  if (ratio > 0.65) return { bg: 'bg-emerald-400/80 dark:bg-emerald-500/70', glow: false };
  if (ratio > 0.45) return { bg: 'bg-emerald-300/70 dark:bg-emerald-600/50', glow: false };
  if (ratio > 0.25) return { bg: 'bg-emerald-200/80 dark:bg-emerald-700/40', glow: false };
  return { bg: 'bg-emerald-100/70 dark:bg-emerald-800/30', glow: false };
};

const RevenueHeatmap: React.FC<RevenueHeatmapProps> = ({ data }) => {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  const { weeks, maxRevenue, monthLabels, stats } = useMemo(() => {
    if (!data.length) return { weeks: [], maxRevenue: 0, monthLabels: [], stats: null };

    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const recentData = sorted.slice(-91); // ~13 weeks

    const dayMap = new Map<string, number>();
    recentData.forEach(d => dayMap.set(d.date, d.revenue));

    let max = 0;
    recentData.forEach(d => { if (d.revenue > max) max = d.revenue; });

    if (recentData.length === 0) return { weeks: [], maxRevenue: 0, monthLabels: [], stats: null };

    const startDate = new Date(recentData[0].date);
    const endDate = new Date(recentData[recentData.length - 1].date);

    const weeks: { date: string; revenue: number; dayOfWeek: number }[][] = [];
    let currentWeek: { date: string; revenue: number; dayOfWeek: number }[] = [];

    const cursor = new Date(startDate);
    const dayOffset = (cursor.getDay() + 6) % 7;
    cursor.setDate(cursor.getDate() - dayOffset);

    while (cursor <= endDate || currentWeek.length > 0) {
      const dateStr = cursor.toISOString().split('T')[0];
      const dayOfWeek = (cursor.getDay() + 6) % 7;

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

    const finalWeeks = weeks.slice(-13);

    // Month labels
    const labels: { text: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    finalWeeks.forEach((week, wi) => {
      const firstDay = week[0];
      if (firstDay) {
        const m = new Date(firstDay.date).getMonth();
        if (m !== lastMonth) {
          labels.push({ text: MONTHS[m], weekIndex: wi });
          lastMonth = m;
        }
      }
    });

    // Compute stats
    const allRevenues = recentData.map(d => d.revenue).filter(r => r > 0);
    const totalRevenue = allRevenues.reduce((a, b) => a + b, 0);
    const activeDays = allRevenues.length;
    const avgRevenue = activeDays > 0 ? totalRevenue / activeDays : 0;

    // Best day
    let bestDay = recentData[0];
    recentData.forEach(d => { if (d.revenue > bestDay.revenue) bestDay = d; });

    // Current streak
    let streak = 0;
    for (let i = recentData.length - 1; i >= 0; i--) {
      if (recentData[i].revenue > 0) streak++;
      else break;
    }

    // Week-over-week trend: compare last 7 days with data vs prior 7 days with data
    const daysWithRevenue = recentData.filter(d => d.revenue > 0);
    const recentHalf = daysWithRevenue.slice(-7);
    const priorHalf = daysWithRevenue.slice(-14, -7);
    const thisWeekRev = recentHalf.reduce((s, d) => s + d.revenue, 0);
    const prevWeekRev = priorHalf.reduce((s, d) => s + d.revenue, 0);
    const wowChange = prevWeekRev > 0 ? ((thisWeekRev - prevWeekRev) / prevWeekRev) * 100 : 0;

    return {
      weeks: finalWeeks,
      maxRevenue: max,
      monthLabels: labels,
      stats: {
        totalRevenue,
        avgRevenue,
        bestDay,
        streak,
        activeDays,
        wowChange,
      },
    };
  }, [data]);

  if (weeks.length === 0) return null;

  // Weekly total for the hovered week
  const hoveredWeekTotal = hoveredWeek !== null
    ? weeks[hoveredWeek]?.reduce((s, d) => s + d.revenue, 0) ?? 0
    : 0;

  return (
    <div className="space-y-4">
      {/* Mini stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/30">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">Streak</p>
              <p className="text-sm font-bold text-foreground leading-tight">{stats.streak} days</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/30">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">Active Days</p>
              <p className="text-sm font-bold text-foreground leading-tight">{stats.activeDays}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/30">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">Daily Avg</p>
              <p className="text-sm font-bold text-foreground leading-tight">₹{Math.round(stats.avgRevenue).toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/30">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${stats.wowChange >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
              {stats.wowChange >= 0
                ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                : <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              }
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">WoW</p>
              <p className={`text-sm font-bold leading-tight ${stats.wowChange >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {stats.wowChange >= 0 ? '+' : ''}{stats.wowChange.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Month labels */}
      <div className="flex gap-0.5 overflow-hidden">
        <div className="w-[26px] shrink-0" />
        <div className="flex gap-0.5 relative flex-1 min-w-0">
          {monthLabels.map((ml, i) => (
            <span
              key={i}
              className="text-[10px] font-medium text-muted-foreground absolute"
              style={{ left: `${ml.weekIndex * (14 + 2)}px` }}
            >
              {ml.text}
            </span>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-0.5 overflow-x-auto no-scrollbar pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 shrink-0">
          {DAYS.map((d, i) => (
            <span key={d} className="text-[10px] text-muted-foreground h-[14px] flex items-center leading-none w-[22px]">
              {i % 2 === 0 ? d : ''}
            </span>
          ))}
        </div>
        {/* Grid */}
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="flex flex-col gap-0.5"
            onMouseEnter={() => setHoveredWeek(wi)}
            onMouseLeave={() => setHoveredWeek(null)}
          >
            {Array.from({ length: 7 }).map((_, di) => {
              const cell = week.find(c => c.dayOfWeek === di);
              if (!cell) return <div key={di} className="w-[14px] h-[14px] rounded-[3px]" />;
              const { bg, glow } = getIntensityStyle(cell.revenue, maxRevenue);
              const isHovered = hoveredWeek === wi;
              return (
                <Tooltip key={di}>
                  <TooltipTrigger asChild>
                    <motion.div
                      className={`w-[14px] h-[14px] rounded-[3px] cursor-default transition-all duration-150 ${bg} ${glow ? 'shadow-[0_0_6px_rgba(16,185,129,0.4)]' : ''} ${isHovered ? 'ring-1 ring-foreground/20' : ''}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: wi * 0.025 + di * 0.008, duration: 0.15 }}
                      whileHover={{ scale: 1.4, zIndex: 10 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs p-3 space-y-1">
                    <p className="font-semibold text-sm">₹{cell.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-muted-foreground">
                      {new Date(cell.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    {maxRevenue > 0 && cell.revenue > 0 && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.round((cell.revenue / maxRevenue) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{Math.round((cell.revenue / maxRevenue) * 100)}%</span>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hovered week summary */}
      <AnimatePresence>
        {hoveredWeek !== null && hoveredWeekTotal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-muted-foreground"
          >
            Week total: <span className="font-semibold text-foreground">₹{hoveredWeekTotal.toLocaleString('en-IN')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend + Best day */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="w-[14px] h-[14px] rounded-[3px] bg-muted/30 dark:bg-muted/20" />
          <div className="w-[14px] h-[14px] rounded-[3px] bg-emerald-100/70 dark:bg-emerald-800/30" />
          <div className="w-[14px] h-[14px] rounded-[3px] bg-emerald-200/80 dark:bg-emerald-700/40" />
          <div className="w-[14px] h-[14px] rounded-[3px] bg-emerald-300/70 dark:bg-emerald-600/50" />
          <div className="w-[14px] h-[14px] rounded-[3px] bg-emerald-400/80 dark:bg-emerald-500/70" />
          <div className="w-[14px] h-[14px] rounded-[3px] bg-emerald-500 dark:bg-emerald-400" />
          <span>More</span>
        </div>
        {stats && stats.bestDay.revenue > 0 && (
          <div className="text-[10px] text-muted-foreground">
            🏆 Best: <span className="font-semibold text-foreground">₹{stats.bestDay.revenue.toLocaleString('en-IN')}</span>
            <span className="ml-1">
              ({new Date(stats.bestDay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueHeatmap;
