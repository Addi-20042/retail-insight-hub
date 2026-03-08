import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, RefreshCw, CheckCircle, Plus, Eye, X, FileWarning } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useUploadToSupabase, useAddSalesEntry, useUploadHistory } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader, StaggerContainer, FadeUp, ShimmerSkeleton } from '@/components/ui/animated-container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { manualEntrySchema } from '@/lib/validations';
import { formatNumber } from '@/lib/formatters';

const MAX_FILE_SIZE_MB = 512;

const DataUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({ date: '', product: '', quantity: '', revenue: '', category: '', transaction_id: '', customer_id: '' });
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][]; fileName: string } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});
  
  const uploadMutation = useUploadToSupabase();
  const addEntryMutation = useAddSalesEntry();
  const { data: uploadHistory, isLoading: historyLoading } = useUploadHistory();

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) previewFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) previewFile(files[0]);
  };

  const previewFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload CSV files only');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        toast.error('CSV file must have headers and at least one data row');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1, 6).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      setPreviewData({ headers, rows, fileName: file.name });
      setPendingFile(file);
    };
    reader.readAsText(file);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 15, 90));
    }, 300);

    try {
      const result = await uploadMutation.mutateAsync(pendingFile);
      clearInterval(interval);
      setUploadProgress(100);
      toast.success(`${pendingFile.name} processed! ${result.rows_processed} rows added.`);
      setTimeout(() => {
        setPreviewData(null);
        setPendingFile(null);
        setUploadProgress(0);
      }, 1000);
    } catch (error: any) {
      clearInterval(interval);
      setUploadProgress(0);
      toast.error(`Failed: ${error.message || 'Unknown error'}`);
    }
  };

  const cancelPreview = () => {
    setPreviewData(null);
    setPendingFile(null);
    setUploadProgress(0);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualErrors({});

    const result = manualEntrySchema.safeParse(manualEntry);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setManualErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }

    try {
      await addEntryMutation.mutateAsync({
        date: result.data.date,
        product: result.data.product,
        quantity: result.data.quantity,
        revenue: result.data.revenue,
        category: result.data.category || undefined,
        transaction_id: manualEntry.transaction_id || undefined,
        customer_id: manualEntry.customer_id || undefined,
      });
      toast.success('Entry added successfully');
      setManualEntry({ date: '', product: '', quantity: '', revenue: '', category: '', transaction_id: '', customer_id: '' });
      setManualOpen(false);
    } catch (error: any) { toast.error(`Failed: ${error.message}`); }
  };

  const totalUploads = uploadHistory?.length ?? 0;
  const totalRowsUploaded = useMemo(() => (uploadHistory || []).reduce((s, u) => s + (u.rows_count || 0), 0), [uploadHistory]);

  return (
    <div className="space-y-6">
      <PageHeader title="Upload Sales Data" description="Upload CSV files or manually enter sales data">
        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2"><Plus className="w-4 h-4" />Manual Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Sales Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={manualEntry.date} onChange={e => setManualEntry(p => ({ ...p, date: e.target.value }))} required />
                {manualErrors.date && <p className="text-xs text-destructive">{manualErrors.date}</p>}
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Input value={manualEntry.product} onChange={e => setManualEntry(p => ({ ...p, product: e.target.value }))} required placeholder="Product name" maxLength={200} />
                {manualErrors.product && <p className="text-xs text-destructive">{manualErrors.product}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={manualEntry.quantity} onChange={e => setManualEntry(p => ({ ...p, quantity: e.target.value }))} required min={1} />
                  {manualErrors.quantity && <p className="text-xs text-destructive">{manualErrors.quantity}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Revenue (₹)</Label>
                  <Input type="number" step="0.01" value={manualEntry.revenue} onChange={e => setManualEntry(p => ({ ...p, revenue: e.target.value }))} required min={0} />
                  {manualErrors.revenue && <p className="text-xs text-destructive">{manualErrors.revenue}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category (optional)</Label>
                <Input value={manualEntry.category} onChange={e => setManualEntry(p => ({ ...p, category: e.target.value }))} placeholder="e.g., Electronics" maxLength={100} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transaction ID (optional)</Label>
                  <Input value={manualEntry.transaction_id} onChange={e => setManualEntry(p => ({ ...p, transaction_id: e.target.value }))} placeholder="e.g., TXN-001" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Customer ID (optional)</Label>
                  <Input value={manualEntry.customer_id} onChange={e => setManualEntry(p => ({ ...p, customer_id: e.target.value }))} placeholder="e.g., CUST-001" maxLength={100} />
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">💡 Tip for Market Basket Analysis</p>
                <p>Add Transaction ID and Customer ID to enable product association discovery. Items with the same Transaction ID are treated as purchased together.</p>
              </div>
              <Button type="submit" className="w-full" disabled={addEntryMutation.isPending}>
                {addEntryMutation.isPending ? 'Adding...' : 'Add Entry'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Upload Stats */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Uploads', value: totalUploads, loading: historyLoading },
          { label: 'Total Rows', value: formatNumber(totalRowsUploaded), loading: historyLoading },
          { label: 'Max File Size', value: `${MAX_FILE_SIZE_MB}MB`, loading: false, hideOnMobile: true },
        ].map((s, i) => (
          <FadeUp key={i}>
            <Card className={`glass-card ${s.hideOnMobile ? 'hidden sm:block' : ''}`}>
              <CardContent className="pt-4 pb-3">
                {s.loading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 w-20 bg-muted rounded" />
                    <div className="h-7 w-16 bg-muted rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </FadeUp>
        ))}
      </StaggerContainer>

      {/* Upload Area */}
      {!previewData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`chart-container border-2 border-dashed transition-all duration-300 ${
            isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="py-12 text-center">
            <motion.div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}
              animate={isDragging ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground mt-4">
              {isDragging ? 'Drop your files here' : 'Drag and drop your CSV files'}
            </h3>
            <p className="text-muted-foreground mt-2">or click to browse from your computer</p>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Select CSV File
            </Button>
            <p className="text-xs text-muted-foreground mt-4">Accepted: .csv • Max {MAX_FILE_SIZE_MB}MB</p>
          </div>
        </motion.div>
      ) : (
        /* Preview Area */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="chart-container space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Preview: {previewData.fileName}</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingFile && `${(pendingFile.size / 1024).toFixed(1)} KB`} • Showing first {previewData.rows.length} rows
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={cancelPreview}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Column validation */}
          <div className="flex flex-wrap gap-2">
            {['date', 'product', 'quantity', 'revenue'].map(req => {
              const found = previewData.headers.some(h => h.toLowerCase().includes(req));
              return (
                <Badge key={req} variant={found ? 'default' : 'destructive'} className="gap-1">
                  {found ? <CheckCircle className="w-3 h-3" /> : <FileWarning className="w-3 h-3" />}
                  {req}
                </Badge>
              );
            })}
            {['transaction_id', 'customer_id'].map(col => {
              const found = previewData.headers.some(h => h.toLowerCase().replace(/\s+/g, '_').includes(col));
              return (
                <Badge key={col} variant={found ? 'secondary' : 'outline'} className={`gap-1 ${!found ? 'border-warning/50 text-warning' : ''}`}>
                  {found ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {col}
                </Badge>
              );
            })}
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {previewData.headers.map((h, i) => (
                    <th key={i} className="py-2 px-3 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.map((row, i) => (
                  <tr key={i} className="border-t border-border/50">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2 px-3 text-foreground whitespace-nowrap">{cell || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Progress bar */}
          {uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {uploadProgress < 100 ? 'Processing...' : 'Complete!'}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={confirmUpload} disabled={uploadMutation.isPending} className="flex-1 gap-2">
              {uploadMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadMutation.isPending ? 'Uploading...' : 'Confirm & Upload'}
            </Button>
            <Button variant="outline" onClick={cancelPreview} disabled={uploadMutation.isPending}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* CSV Format Requirements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="chart-container"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">CSV Format Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-2">Required Columns</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {['date - Transaction date (YYYY-MM-DD)', 'product - Product name or ID', 'quantity - Quantity sold', 'revenue - Total revenue'].map((col) => (
                <li key={col} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{col.split(' - ')[0]}</code>
                  <span className="hidden sm:inline">- {col.split(' - ')[1]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Recommended Columns</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                { col: 'transaction_id', desc: 'Groups products bought together (required for Market Basket Analysis)', highlight: true },
                { col: 'customer_id', desc: 'Customer identifier (enables segmentation & basket fallback)', highlight: true },
                { col: 'category', desc: 'Product category (enables category breakdowns)', highlight: false },
              ].map((item) => (
                <li key={item.col} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.highlight ? 'bg-warning' : 'bg-muted-foreground'}`} />
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{item.col}</code>
                  <span className="hidden sm:inline">- {item.desc}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded-lg text-xs text-warning">
              ⚠️ Without <code className="font-semibold">transaction_id</code>, Market Basket Analysis cannot determine which products are bought together.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upload History */}
      {historyLoading ? (
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Upload History</h3>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <ShimmerSkeleton className="w-8 h-8 rounded" />
                  <div className="space-y-1.5">
                    <ShimmerSkeleton className="h-4 w-40" />
                    <ShimmerSkeleton className="h-3 w-28" />
                  </div>
                </div>
                <ShimmerSkeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : uploadHistory && uploadHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="chart-container"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Upload History</h3>
          <div className="space-y-3">
            {uploadHistory.map((upload, i) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors gap-2"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">{upload.filename}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(upload.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(upload.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {upload.rows_count.toLocaleString('en-IN')} rows
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {upload.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                  ) : upload.status === 'processing' ? (
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                  )}
                  <Badge variant={upload.status === 'success' ? 'default' : upload.status === 'processing' ? 'secondary' : 'destructive'} className="text-xs">
                    {upload.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DataUpload;
