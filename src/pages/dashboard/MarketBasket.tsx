import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Download,
  Filter,
  Search,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBasketRules } from "@/hooks/useApiData";
import { useSalesData } from "@/hooks/useSupabaseData";
import { EmptyState } from "@/components/EmptyState";
import { FadeUp, HoverCard, PageHeader, StaggerContainer, StatCardSkeleton } from "@/components/ui/animated-container";
import { exportBasketToPdf } from "@/lib/exportPdf";
import { toast } from "sonner";

const MarketBasket: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"lift" | "confidence" | "support">("lift");
  const { data, isLoading, isError } = useBasketRules();
  const { data: salesData } = useSalesData();

  const hasData = !!salesData && salesData.length > 0;
  const allRules = data?.rules || [];

  const filteredRules = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const rules = term
      ? allRules.filter(
          (rule) => rule.productA.toLowerCase().includes(term) || rule.productB.toLowerCase().includes(term)
        )
      : [...allRules];

    return rules.sort((a, b) => b[sortBy] - a[sortBy]);
  }, [allRules, searchTerm, sortBy]);

  const avgConfidence =
    allRules.length > 0 ? allRules.reduce((sum, rule) => sum + rule.confidence, 0) / allRules.length : 0;
  const avgLift = allRules.length > 0 ? allRules.reduce((sum, rule) => sum + rule.lift, 0) / allRules.length : 0;

  const hasTransactionIds = salesData?.some((row) => row.transaction_id && row.transaction_id.trim() !== "") ?? false;
  const hasCustomerIds = salesData?.some((row) => row.customer_id && row.customer_id.trim() !== "") ?? false;
  const lacksGroupingData = hasData && !hasTransactionIds && !hasCustomerIds;

  const getConfidenceColor = (confidence: number) =>
    confidence >= 0.8 ? "text-success" : confidence >= 0.6 ? "text-warning" : "text-muted-foreground";

  const getLiftBadge = (lift: number) => {
    if (lift >= 3) return { label: "Strong", variant: "default" as const };
    if (lift >= 1.5) return { label: "Moderate", variant: "secondary" as const };
    return { label: "Weak", variant: "outline" as const };
  };

  if (!hasData) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Market Basket Analysis"
          description="Discover products frequently purchased together"
        />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="chart-container">
          <EmptyState
            icon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
            title="No Data for Basket Analysis"
            description="Upload sales data with transaction details or scan multiple products in Live POS to discover product associations."
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 sm:space-y-8">
      <PageHeader
        title="Market Basket Analysis"
        description="Discover products frequently purchased together using Association Rule Mining"
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            exportBasketToPdf(allRules);
            toast.success("PDF exported");
          }}
          title="Export to PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
      </PageHeader>

      {lacksGroupingData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-foreground">Limited Analysis Accuracy</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your data does not include <code className="rounded bg-muted px-1 py-0.5 text-xs font-semibold">transaction_id</code> or{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs font-semibold">customer_id</code> columns.
              Re-upload your CSV with those fields for more accurate results.
            </p>
          </div>
        </motion.div>
      )}

      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {isLoading ? (
          <>
            <FadeUp><StatCardSkeleton /></FadeUp>
            <FadeUp><StatCardSkeleton /></FadeUp>
            <FadeUp><StatCardSkeleton /></FadeUp>
          </>
        ) : (
          <>
            <FadeUp>
              <HoverCard>
                <div className="stat-card">
                  <div className="mb-1 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Associations Found</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{allRules.length}</p>
                </div>
              </HoverCard>
            </FadeUp>
            <FadeUp>
              <HoverCard>
                <div className="stat-card">
                  <div className="mb-1 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Avg. Confidence</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{(avgConfidence * 100).toFixed(1)}%</p>
                </div>
              </HoverCard>
            </FadeUp>
            <FadeUp>
              <HoverCard>
                <div className="stat-card">
                  <div className="mb-1 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Avg. Lift</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{avgLift.toFixed(2)}x</p>
                </div>
              </HoverCard>
            </FadeUp>
          </>
        )}
      </StaggerContainer>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="chart-container"
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter by product name..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-12 pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="h-12 w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
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
          <p className="mt-3 text-sm text-muted-foreground">
            Showing {filteredRules.length} of {allRules.length} associations matching{" "}
            <span className="font-medium text-foreground">{searchTerm}</span>
          </p>
        )}
      </motion.div>

      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Failed to load basket analysis data</p>
            <p className="text-sm text-muted-foreground">The analytics engine may still be processing. Try refreshing.</p>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-xl border border-border/50 bg-card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-9 w-24 rounded-lg bg-muted" />
                  <div className="h-5 w-5 rounded bg-muted" />
                  <div className="h-9 w-24 rounded-lg bg-muted" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="h-3 w-12 rounded bg-muted" />
                    <div className="mt-1 h-4 w-10 rounded bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-16 rounded bg-muted" />
                    <div className="mt-1 h-4 w-10 rounded bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-8 rounded bg-muted" />
                    <div className="mt-1 h-4 w-10 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredRules.length > 0 ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredRules.map((rule, index) => {
                const badge = getLiftBadge(rule.lift);
                return (
                  <FadeUp key={`${rule.productA}-${rule.productB}-${index}`}>
                    <HoverCard className="rounded-xl border border-border/50 bg-card p-4 sm:p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4 sm:gap-3">
                        <motion.div whileHover={{ scale: 1.05 }} className="max-w-[40%] truncate rounded-lg bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary sm:px-3 sm:py-2 sm:text-sm">
                          {rule.productA}
                        </motion.div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <motion.div whileHover={{ scale: 1.05 }} className="max-w-[40%] truncate rounded-lg bg-chart-secondary/10 px-2 py-1.5 text-xs font-medium text-chart-secondary sm:px-3 sm:py-2 sm:text-sm">
                          {rule.productB}
                        </motion.div>
                        <Badge variant={badge.variant} className="ml-auto text-[10px] sm:text-xs">
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground sm:text-xs">Support</p>
                          <p className="font-semibold text-foreground">{(rule.support * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground sm:text-xs">Confidence</p>
                          <p className={`text-sm font-semibold ${getConfidenceColor(rule.confidence)}`}>
                            {(rule.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground sm:text-xs">Lift</p>
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
          <motion.div key="no-match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chart-container py-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              No associations found matching <span className="font-medium text-foreground">{searchTerm}</span>. Try a different product name.
            </p>
            <Button variant="ghost" className="mt-4" onClick={() => setSearchTerm("")}>
              Clear Search
            </Button>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chart-container py-12 text-center">
            <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              No product associations could be computed yet. Scan multiple items into the same POS transaction or upload grouped transaction data to generate basket insights.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketBasket;
