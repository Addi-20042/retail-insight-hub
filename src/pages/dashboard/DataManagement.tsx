import React, { useState, useMemo } from 'react';
import {
  Database, Search, Trash2, Download, Filter, ChevronUp, ChevronDown,
  AlertCircle, RefreshCw, X, Calendar, Package, IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSalesData } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import {
  StaggerContainer, FadeUp, PageHeader, ShimmerSkeleton, HoverCard, AnimatedNumber
} from '@/components/ui/animated-container';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type SortKey = 'date' | 'product' | 'quantity' | 'revenue' | 'category';
type SortDir = 'asc' | 'desc';

const ROWS_PER_PAGE = 20;

const TableRowSkeleton = () => (
  <tr>
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="py-3 px-4 border-b border-border/50">
        <ShimmerSkeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

const DataManagement: React.FC = () => {
  const { data: salesData, isLoading, isError, refetch } = useSalesData();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const categories = useMemo(() => {
    if (!salesData) return [];
    const cats = new Set(salesData.map(r => r.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [salesData]);

  const filtered = useMemo(() => {
    if (!salesData) return [];
    let rows = [...salesData];

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.product.toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.transaction_id || '').toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      rows = rows.filter(r => r.category === categoryFilter);
    }

    rows.sort((a, b) => {
      let av: string | number = a[sortKey] ?? '';
      let bv: string | number = b[sortKey] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [salesData, search, categoryFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const totalRevenue = useMemo(() => filtered.reduce((s, r) => s + Number(r.revenue), 0), [filtered]);
  const totalQty = useMemo(() => filtered.reduce((s, r) => s + r.quantity, 0), [filtered]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="inline-flex flex-col ml-1 opacity-50">
      {sortKey === col
        ? sortDir === 'asc'
          ? <ChevronUp className="w-3 h-3 text-primary" />
          : <ChevronDown className="w-3 h-3 text-primary" />
        : <ChevronUp className="w-3 h-3" />}
    </span>
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('sales_data').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      toast.error('Failed to delete record');
    } else {
      toast.success('Record deleted');
      queryClient.invalidateQueries({ queryKey: ['sales_data'] });
      queryClient.invalidateQueries({ queryKey: ['sales_stats'] });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedRows);
    const { error } = await supabase.from('sales_data').delete().in('id', ids);
    setBulkDeleting(false);
    if (error) {
      toast.error('Failed to delete records');
    } else {
      toast.success(`Deleted ${ids.length} records`);
      setSelectedRows(new Set());
      queryClient.invalidateQueries({ queryKey: ['sales_data'] });
      queryClient.invalidateQueries({ queryKey: ['sales_stats'] });
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === paginated.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginated.map(r => r.id)));
    }
  };

  const exportCSV = () => {
    const headers = ['date', 'product', 'category', 'quantity', 'revenue', 'transaction_id', 'customer_id'];
    const rows = filtered.map(r =>
      [r.date, r.product, r.category || '', r.quantity, r.revenue, r.transaction_id || '', r.customer_id || ''].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sales_data.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const statCards = [
    { icon: Database, label: 'Filtered Records', value: filtered.length, color: 'primary' },
    { icon: IndianRupee, label: 'Total Revenue', value: totalRevenue, prefix: '₹', color: 'success' },
    { icon: Package, label: 'Total Quantity', value: totalQty, color: 'chart-secondary' },
    { icon: Filter, label: 'Categories', value: categories.length, color: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Data Management" description="View, filter, search and manage your sales records">
        <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </PageHeader>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <FadeUp key={i}>
            <HoverCard>
              <div className="stat-card group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      <AnimatedNumber value={isLoading ? 0 : s.value} prefix={s.prefix} />
                    </p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg bg-${s.color}/10 flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 text-${s.color}`} />
                  </div>
                </div>
              </div>
            </HoverCard>
          </FadeUp>
        ))}
      </StaggerContainer>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="chart-container"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search product, category, transaction ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedRows.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2 shrink-0" disabled={bulkDeleting}>
                  {bulkDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete {selectedRows.size} selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedRows.size} records?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. These sales records will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {(search || categoryFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <span>{filtered.length} results</span>
            <button
              onClick={() => { setSearch(''); setCategoryFilter('all'); setPage(1); }}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Error */}
      {isError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive font-medium">Failed to load data. Try refreshing.</p>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="chart-container overflow-x-auto"
      >
        {!isLoading && (!salesData || salesData.length === 0) ? (
          <EmptyState
            icon={<Database className="w-8 h-8 text-muted-foreground" />}
            title="No Sales Data"
            description="Upload a CSV file to see your sales records here."
          />
        ) : (
          <>
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="py-3 px-4 border-b border-border w-10">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selectedRows.size === paginated.length}
                      onChange={toggleAll}
                      className="accent-primary"
                    />
                  </th>
                  {[
                    { key: 'date' as SortKey, label: 'Date', icon: Calendar },
                    { key: 'product' as SortKey, label: 'Product', icon: Package },
                    { key: 'category' as SortKey, label: 'Category' },
                    { key: 'quantity' as SortKey, label: 'Qty' },
                    { key: 'revenue' as SortKey, label: 'Revenue', icon: IndianRupee },
                  ].map(col => (
                    <th
                      key={col.key}
                      className="py-3 px-4 border-b border-border text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label} <SortIcon col={col.key} />
                      </span>
                    </th>
                  ))}
                  <th className="py-3 px-4 border-b border-border text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)
                  : paginated.map((row, idx) => (
                    <AnimatePresence key={row.id}>
                      <motion.tr
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ delay: idx * 0.015, duration: 0.25 }}
                        className={`hover:bg-muted/40 transition-colors ${selectedRows.has(row.id) ? 'bg-primary/5' : ''}`}
                      >
                        <td className="py-3 px-4 border-b border-border/50">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            className="accent-primary"
                          />
                        </td>
                        <td className="py-3 px-4 border-b border-border/50 font-mono text-xs text-muted-foreground">{row.date}</td>
                        <td className="py-3 px-4 border-b border-border/50 font-medium text-foreground">{row.product}</td>
                        <td className="py-3 px-4 border-b border-border/50">
                          {row.category ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {row.category}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 border-b border-border/50 text-foreground">{row.quantity.toLocaleString()}</td>
                        <td className="py-3 px-4 border-b border-border/50 font-semibold text-primary">
                          ₹{Number(row.revenue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 border-b border-border/50">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingId === row.id}
                              >
                                {deletingId === row.id
                                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete <strong>{row.product}</strong> on {row.date}? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(row.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </motion.tr>
                    </AnimatePresence>
                  ))}
              </tbody>
            </table>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default DataManagement;
