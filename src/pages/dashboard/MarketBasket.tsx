import React, { useState } from 'react';
import { Search, ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const associationRules = [
  { productA: 'Laptop', productB: 'Laptop Bag', support: 0.42, confidence: 0.78, lift: 2.3 },
  { productA: 'Smartphone', productB: 'Screen Protector', support: 0.38, confidence: 0.85, lift: 2.8 },
  { productA: 'Coffee Maker', productB: 'Coffee Beans', support: 0.35, confidence: 0.72, lift: 2.1 },
  { productA: 'Camera', productB: 'Memory Card', support: 0.31, confidence: 0.89, lift: 3.2 },
  { productA: 'Running Shoes', productB: 'Sports Socks', support: 0.28, confidence: 0.65, lift: 1.9 },
  { productA: 'Tablet', productB: 'Tablet Case', support: 0.33, confidence: 0.81, lift: 2.5 },
  { productA: 'Headphones', productB: 'Headphone Stand', support: 0.22, confidence: 0.58, lift: 1.7 },
  { productA: 'Gaming Console', productB: 'Extra Controller', support: 0.29, confidence: 0.74, lift: 2.4 },
  { productA: 'Printer', productB: 'Ink Cartridge', support: 0.45, confidence: 0.92, lift: 3.5 },
  { productA: 'Yoga Mat', productB: 'Yoga Blocks', support: 0.19, confidence: 0.54, lift: 1.6 },
];

const MarketBasket: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<typeof associationRules>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults(associationRules);
    } else {
      const filtered = associationRules.filter(
        rule => 
          rule.productA.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rule.productB.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
    }
    setHasSearched(true);
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
        <p className="text-muted-foreground mt-1">Discover products frequently purchased together</p>
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
          <Button onClick={handleSearch} size="lg" className="gap-2">
            <Sparkles className="w-4 h-4" />
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

      {/* Results */}
      {hasSearched && (
        <div className="space-y-6 animate-slide-in">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Rules Found</p>
              <p className="text-2xl font-bold text-foreground">{searchResults.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Avg. Confidence</p>
              <p className="text-2xl font-bold text-foreground">
                {searchResults.length > 0 
                  ? (searchResults.reduce((sum, r) => sum + r.confidence, 0) / searchResults.length * 100).toFixed(1) 
                  : 0}%
              </p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Avg. Lift</p>
              <p className="text-2xl font-bold text-foreground">
                {searchResults.length > 0 
                  ? (searchResults.reduce((sum, r) => sum + r.lift, 0) / searchResults.length).toFixed(2)
                  : 0}x
              </p>
            </div>
          </div>

          {/* Association Cards */}
          {searchResults.length > 0 ? (
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
              <p className="text-muted-foreground">No associations found for "{searchTerm}"</p>
            </div>
          )}

          {/* Data Table */}
          {searchResults.length > 0 && (
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
