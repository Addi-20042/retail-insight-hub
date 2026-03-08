import React, { useState } from 'react';
import { Search, ShoppingCart, ArrowRight, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBasketSearch } from '@/hooks/useApiData';
import { useSalesData } from '@/hooks/useSupabaseData';
import { EmptyState } from '@/components/EmptyState';
import { 
  StaggerContainer, FadeUp, PageHeader, StatCardSkeleton, HoverCard
} from '@/components/ui/animated-container';

const MarketBasket: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { data, isLoading, isError, refetch } = useBasketSearch(searchQuery, hasSearched);
  const { data: salesData } = useSalesData();

  const hasData = salesData && salesData.length > 0;
  const searchResults = data?.rules || [];
  const avgConfidence = data?.avg_confidence || 0;
  const avgLift = data?.avg_lift || 0;

  const handleSearch = () => { setSearchQuery(searchTerm); setHasSearched(true); if (hasSearched) refetch(); };
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };
  const getConfidenceColor = (c: number) => c >= 0.8 ? 'text-success' : c >= 0.6 ? 'text-warning' : 'text-muted-foreground';

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
    <div className="space-y-8">
      <PageHeader title="Market Basket Analysis" description="Discover products frequently purchased together using Association Rule Mining" />

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="chart-container"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="text" placeholder="Search for a product..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="pl-10 h-12" />
          </div>
          <Button onClick={handleSearch} size="lg" className="gap-2" disabled={isLoading}>
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Find Associations
          </Button>
        </div>
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center py-12"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-lg font-medium text-foreground mb-2">Search for Product Associations</h3>
            <p className="text-muted-foreground max-w-md mx-auto">Enter a product name to discover which items are frequently purchased together.</p>
          </motion.div>
        )}
      </motion.div>

      {isError && hasSearched && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-destructive font-medium">Failed to load basket analysis data</p>
            <p className="text-sm text-muted-foreground">The analytics engine may be processing. Try refreshing.</p>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {hasSearched && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoading ? (
                <><FadeUp><StatCardSkeleton /></FadeUp><FadeUp><StatCardSkeleton /></FadeUp><FadeUp><StatCardSkeleton /></FadeUp></>
              ) : (
                <>
                  <FadeUp><HoverCard><div className="stat-card"><p className="text-sm text-muted-foreground">Rules Found</p><p className="text-2xl font-bold text-foreground">{searchResults.length}</p></div></HoverCard></FadeUp>
                  <FadeUp><HoverCard><div className="stat-card"><p className="text-sm text-muted-foreground">Avg. Confidence</p><p className="text-2xl font-bold text-foreground">{(avgConfidence * 100).toFixed(1)}%</p></div></HoverCard></FadeUp>
                  <FadeUp><HoverCard><div className="stat-card"><p className="text-sm text-muted-foreground">Avg. Lift</p><p className="text-2xl font-bold text-foreground">{avgLift.toFixed(2)}x</p></div></HoverCard></FadeUp>
                </>
              )}
            </StaggerContainer>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
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
              </div>
            ) : searchResults.length > 0 ? (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((rule, index) => (
                  <FadeUp key={index}>
                    <HoverCard className="bg-card rounded-xl p-5 border border-border/50">
                      <div className="flex items-center gap-3 mb-4">
                        <motion.div whileHover={{ scale: 1.05 }} className="px-3 py-2 bg-primary/10 rounded-lg text-primary font-medium">{rule.productA}</motion.div>
                        <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} className="px-3 py-2 bg-chart-secondary/10 rounded-lg text-chart-secondary font-medium">{rule.productB}</motion.div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><p className="text-xs text-muted-foreground">Support</p><p className="font-semibold text-foreground">{(rule.support * 100).toFixed(1)}%</p></div>
                        <div><p className="text-xs text-muted-foreground">Confidence</p><p className={`font-semibold ${getConfidenceColor(rule.confidence)}`}>{(rule.confidence * 100).toFixed(1)}%</p></div>
                        <div><p className="text-xs text-muted-foreground">Lift</p><p className="font-semibold text-foreground">{rule.lift.toFixed(2)}x</p></div>
                      </div>
                    </HoverCard>
                  </FadeUp>
                ))}
              </StaggerContainer>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chart-container text-center py-12">
                <p className="text-muted-foreground">No associations found for "{searchQuery}". Try a different product or ensure your data includes transaction_id columns.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketBasket;
