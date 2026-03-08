import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, ArrowRight, Sparkles, AlertCircle, TrendingUp, BarChart3, Filter, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBasketRules } from '@/hooks/useApiData';
import { useSalesData } from '@/hooks/useSupabaseData';
import { EmptyState } from '@/components/EmptyState';
import { 
  StaggerContainer, FadeUp, PageHeader, StatCardSkeleton, HoverCard
} from '@/components/ui/animated-container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { exportBasketToPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';

const MarketBasket: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'lift' | 'confidence' | 'support'>('lift');
  const { data, isLoading, isError } = useBasketRules();
  const { data: salesData } = useSalesData();

  const hasData = salesData && salesData.length > 0;
  const allRules = data?.rules || [];

  // Filter rules by search term
  const filteredRules = useMemo(() => {
    let rules = [...allRules];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      rules = rules.filter(
        r => r.productA.toLowerCase().includes(term) || r.productB.toLowerCase().includes(term)
      );
    }
    rules.sort((a, b) => b[sortBy] - a[sortBy]);
    return rules;
  }, [allRules, searchTerm, sortBy]);

  // Stats from all rules (not filtered)
  const avgConfidence = allRules.length > 0
    ? allRules.reduce((s, r) => s + r.confidence, 0) / allRules.length
    : 0;
  const avgLift = allRules.length > 0
    ? allRules.reduce((s, r) => s + r.lift, 0) / allRules.length
    : 0;

  const getConfidenceColor = (c: number) =>
    c >= 0.8 ? 'text-success' : c >= 0.6 ? 'text-warning' : 'text-muted-foreground';

  const getLiftBadge = (lift: number) => {
    if (lift >= 3) return { label: 'Strong', variant: 'default' as const };
    if (lift >= 1.5) return { label: 'Moderate', variant: 'secondary' as const };
    return { label: 'Weak', variant: 'outline' as const };
  };

  // Check if data has transaction_id or customer_id
  const hasTransactionIds = salesData?.some(row => row.transaction_id && row.transaction_id.trim() !== '') ?? false;
  const hasCustomerIds = salesData?.some(row => row.customer_id && row.customer_id.trim() !== '') ?? false;
  const lacksGroupingData = hasData && !hasTransactionIds && !hasCustomerIds;

  if (!hasData) {
    return (
      <div className="space-y-8">
        <PageHeader title="Market Basket Analysis" description="Discover products frequently purchased together" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chart-container">
          <EmptyState icon={<ShoppingCart className="w-8 h-8 text-muted-foreground" />} title="No Data for Basket Analysis" description="Upload sales data with transaction details to discover product associations." />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 max-w-full">
      <PageHeader title="Market Basket Analysis" description="Discover products frequently purchased together using Association Rule Mining">
        <Button variant="outline" size="icon" onClick={() => { exportBasketToPdf(allRules); toast.success('PDF exported'); }} title="Export to PDF">
          <Download className="w-4 h-4" />
        </Button>
      </PageHeader>

      {/* Warning: missing transaction grouping data */}
      {lacksGroupingData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-foreground font-medium text-sm">Limited Analysis Accuracy</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your data doesn't include <code className="bg-muted px-1 py-0.5 rounded text-xs font-semibold">transaction_id</code> or <code className="bg-muted px-1 py-0.5 rounded text-xs font-semibold">customer_id</code> columns. 
              Without these, the system cannot determine which products were purchased together. 
              Re-upload your CSV with these columns for accurate results.
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {isLoading ? (
          <><FadeUp><StatCardSkeleton /></FadeUp><FadeUp><StatCardSkeleton /></FadeUp><FadeUp><StatCardSkeleton /></FadeUp></>
        ) : (
          <>
            <FadeUp>
              <HoverCard>
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Associations Found</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{allRules.length}</p>
                </div>
              </HoverCard>
            </FadeUp>
            <FadeUp>
              <HoverCard>
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Avg. Confidence</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{(avgConfidence * 100).toFixed(1)}%</p>
                </div>
              </HoverCard>
            </FadeUp>
            <FadeUp>
              <HoverCard>
                <div className="stat-card">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Avg. Lift</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{avgLift.toFixed(2)}x</p>
                </div>
              </HoverCard>
            </FadeUp>
          </>
        )}
      </StaggerContainer>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="chart-container"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-[180px] h-12">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lift">Sort by Lift</SelectItem>
              <SelectItem value="confidence">Sort by Confidence</SelectItem>
              <SelectItem value="support">Sort by Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {searchTerm && (
          <p className="text-sm text-muted-foreground mt-3">
            Showing {filteredRules.length} of {allRules.length} associations matching "<span className="font-medium text-foreground">{searchTerm}</span>"
          </p>
        )}
      </motion.div>

      {/* Error State */}
      {isError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-destructive font-medium">Failed to load basket analysis data</p>
            <p className="text-sm text-muted-foreground">The analytics engine may be processing. Try refreshing.</p>
          </div>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border/50 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-24 bg-muted rounded-lg" />
                  <div className="w-5 h-5 bg-muted rounded" />
                  <div className="h-9 w-24 bg-muted rounded-lg" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1"><div className="h-3 w-12 bg-muted rounded" /><div className="h-4 w-10 bg-muted rounded mt-1" /></div>
                  <div className="space-y-1"><div className="h-3 w-16 bg-muted rounded" /><div className="h-4 w-10 bg-muted rounded mt-1" /></div>
                  <div className="space-y-1"><div className="h-3 w-8 bg-muted rounded" /><div className="h-4 w-10 bg-muted rounded mt-1" /></div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredRules.length > 0 ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRules.map((rule, index) => {
                const badge = getLiftBadge(rule.lift);
                return (
                  <FadeUp key={`${rule.productA}-${rule.productB}-${index}`}>
                    <HoverCard className="bg-card rounded-xl p-4 sm:p-5 border border-border/50">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                        <motion.div whileHover={{ scale: 1.05 }} className="px-2 sm:px-3 py-1.5 sm:py-2 bg-primary/10 rounded-lg text-primary font-medium text-xs sm:text-sm max-w-[40%] truncate">
                          {rule.productA}
                        </motion.div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        <motion.div whileHover={{ scale: 1.05 }} className="px-2 sm:px-3 py-1.5 sm:py-2 bg-chart-secondary/10 rounded-lg text-chart-secondary font-medium text-xs sm:text-sm max-w-[40%] truncate">
                          {rule.productB}
                        </motion.div>
                        <Badge variant={badge.variant} className="ml-auto text-[10px] sm:text-xs">
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Support</p>
                          <p className="font-semibold text-foreground">{(rule.support * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Confidence</p>
                          <p className={`text-sm font-semibold ${getConfidenceColor(rule.confidence)}`}>{(rule.confidence * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Lift</p>
                          <p className="text-sm font-semibold text-foreground">{rule.lift.toFixed(2)}x</p>
                        </div>
                      </div>
                    </HoverCard>
                  </FadeUp>
                );
              })}
            </StaggerContainer>
          </motion.div>
        ) : allRules.length > 0 && searchTerm ? (
          <motion.div key="no-match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chart-container text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No associations found matching "<span className="font-medium text-foreground">{searchTerm}</span>". Try a different product name.</p>
            <Button variant="ghost" className="mt-4" onClick={() => setSearchTerm('')}>Clear Search</Button>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chart-container text-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No product associations could be computed. Ensure your data includes <code className="bg-muted px-1 py-0.5 rounded text-xs font-semibold">transaction_id</code> columns so the system can group purchases into baskets.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketBasket;
