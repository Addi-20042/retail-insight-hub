import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, RefreshCw, CheckCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUploadToSupabase, useAddSalesEntry, useUploadHistory } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader, StaggerContainer, FadeUp, ShimmerSkeleton } from '@/components/ui/animated-container';

const DataUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState({ date: '', product: '', quantity: '', revenue: '', category: '' });
  
  const uploadMutation = useUploadToSupabase();
  const addEntryMutation = useAddSalesEntry();
  const { data: uploadHistory, isLoading: historyLoading } = useUploadHistory();

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files ? Array.from(e.target.files) : []);
  };

  const processFiles = async (files: File[]) => {
    const csvFiles = files.filter(f => f.name.endsWith('.csv'));
    if (csvFiles.length === 0) { toast.error('Please upload CSV files only'); return; }
    for (const file of csvFiles) {
      try {
        const result = await uploadMutation.mutateAsync(file);
        toast.success(`${file.name} processed! ${result.rows_processed} rows added.`);
      } catch (error: any) {
        toast.error(`Failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEntryMutation.mutateAsync({
        date: manualEntry.date, product: manualEntry.product,
        quantity: parseInt(manualEntry.quantity) || 0, revenue: parseFloat(manualEntry.revenue) || 0,
        category: manualEntry.category || undefined,
      });
      toast.success('Entry added successfully');
      setManualEntry({ date: '', product: '', quantity: '', revenue: '', category: '' });
      setManualOpen(false);
    } catch (error: any) { toast.error(`Failed: ${error.message}`); }
  };

  return (
    <div className="space-y-8">
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
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Input value={manualEntry.product} onChange={e => setManualEntry(p => ({ ...p, product: e.target.value }))} required placeholder="Product name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={manualEntry.quantity} onChange={e => setManualEntry(p => ({ ...p, quantity: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Revenue ($)</Label>
                  <Input type="number" step="0.01" value={manualEntry.revenue} onChange={e => setManualEntry(p => ({ ...p, revenue: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category (optional)</Label>
                <Input value={manualEntry.category} onChange={e => setManualEntry(p => ({ ...p, category: e.target.value }))} placeholder="e.g., Electronics" />
              </div>
              <Button type="submit" className="w-full" disabled={addEntryMutation.isPending}>
                {addEntryMutation.isPending ? 'Adding...' : 'Add Entry'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Upload Area */}
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
          <input ref={fileInputRef} type="file" accept=".csv" multiple onChange={handleFileSelect} className="hidden" />
          <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            Select CSV Files
          </Button>
          <p className="text-xs text-muted-foreground mt-4">Accepted format: .csv (comma-separated values)</p>
        </div>
      </motion.div>

      {/* Processing Status */}
      <AnimatePresence>
        {uploadMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <RefreshCw className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <p className="font-medium text-foreground">Processing your data...</p>
              <p className="text-sm text-muted-foreground">Parsing CSV and storing records in the database.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {['date - Transaction date (YYYY-MM-DD)', 'product - Product name or ID', 'quantity - Quantity sold', 'revenue - Total revenue'].map((col, i) => (
                <motion.li key={col} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <code className="bg-muted px-1.5 py-0.5 rounded">{col.split(' - ')[0]}</code> - {col.split(' - ')[1]}
                </motion.li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Optional Columns</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {['category - Product category', 'customer_id - Customer identifier', 'transaction_id - Transaction ID'].map((col, i) => (
                <motion.li key={col} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <code className="bg-muted px-1.5 py-0.5 rounded">{col.split(' - ')[0]}</code> - {col.split(' - ')[1]}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Upload History */}
      {historyLoading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="chart-container">
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
        </motion.div>
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
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{upload.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(upload.created_at).toLocaleString()} • {upload.rows_count.toLocaleString()} rows
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {upload.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : upload.status === 'processing' ? (
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className={`text-sm ${upload.status === 'success' ? 'text-success' : upload.status === 'processing' ? 'text-primary' : 'text-destructive'}`}>
                    {upload.status === 'success' ? 'Completed' : upload.status === 'processing' ? 'Processing...' : 'Failed'}
                  </span>
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
