import React, { useState } from 'react';
import { Search, ShoppingCart, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBasketSearch } from '@/hooks/useApiData';

const MarketBasket: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const { data, isLoading, isError, refetch } = useBasketSearch(searchQuery, hasSearched);

  const searchResults = data?.rules || [];
  const avgConfidence = data?.avg_confidence || 0;
  const avgLift = data?.avg_lift || 0;

  const handleSearch = () => {
    setSearchQuery(searchTerm);
    setHasSearched(true);
    if (hasSearched) {
      refetch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Market Basket Analysis</h1>
        <p className="text-muted-foreground mt-1">Discover products frequently purchased together using Association Rule Mining</p>
      </div>

      {/* Search Section */}
      <div className="chart-container">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for a product (e.g., Laptop, Camera)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 h-12"
            />
          </div>
          <Button onClick={handleSearch} size="lg" className="gap-2" disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Find Associations
          </Button>
        </div>

        {!hasSearched && (
          <div className="mt-8 text-center py-12">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Search for Product Associations</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a product name to discover which items are frequently purchased together. 
              Leave empty and click search to see all association rules.
            </p>
          </div>
        )}
      </div>

      {isError && hasSearched && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          Failed to load basket analysis data. Using cached or mock data.
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="space-y-6 animate-slide-in">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Rules Found</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '...' : searchResults.length}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Avg. Confidence</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '...' : `${(avgConfidence * 100).toFixed(1)}%`}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Avg. Lift</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? '...' : `${avgLift.toFixed(2)}x`}
              </p>
            </div>
          </div>

          {/* Association Cards */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((rule, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-xl p-5 border border-border/50 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-2 bg-primary/10 rounded-lg text-primary font-medium">
                      {rule.productA}
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    <div className="px-3 py-2 bg-chart-secondary/10 rounded-lg text-chart-secondary font-medium">
                      {rule.productB}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Support</p>
                      <p className="font-semibold text-foreground">{(rule.support * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className={`font-semibold ${getConfidenceColor(rule.confidence)}`}>
                        {(rule.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lift</p>
                      <p className="font-semibold text-foreground">{rule.lift.toFixed(2)}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="chart-container text-center py-12">
              <p className="text-muted-foreground">No associations found for "{searchQuery}"</p>
            </div>
          )}

          {/* Data Table */}
          {!isLoading && searchResults.length > 0 && (
            <div className="chart-container overflow-x-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4">Association Rules Table</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product A</th>
                    <th>Product B</th>
                    <th>Support</th>
                    <th>Confidence</th>
                    <th>Lift</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((rule, index) => (
                    <tr key={index}>
                      <td className="font-medium">{rule.productA}</td>
                      <td className="font-medium">{rule.productB}</td>
                      <td>{(rule.support * 100).toFixed(1)}%</td>
                      <td className={getConfidenceColor(rule.confidence)}>
                        {(rule.confidence * 100).toFixed(1)}%
                      </td>
                      <td>{rule.lift.toFixed(2)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketBasket;
