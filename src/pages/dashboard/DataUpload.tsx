import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, RefreshCw, Trash2, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUploadToSupabase, useAddSalesEntry, useUploadHistory } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
        date: manualEntry.date,
        product: manualEntry.product,
        quantity: parseInt(manualEntry.quantity) || 0,
        revenue: parseFloat(manualEntry.revenue) || 0,
        category: manualEntry.category || undefined,
      });
      toast.success('Entry added successfully');
      setManualEntry({ date: '', product: '', quantity: '', revenue: '', category: '' });
      setManualOpen(false);
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Sales Data</h1>
          <p className="text-muted-foreground mt-1">Upload CSV files or manually enter sales data</p>
        </div>
        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sales Entry</DialogTitle>
            </DialogHeader>
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
      </div>

      {/* Upload Area */}
      <div
        className={`chart-container border-2 border-dashed transition-all duration-200 ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="py-12 text-center">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-colors ${
            isDragging ? 'bg-primary/20' : 'bg-muted'
          }`}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
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
      </div>

      {/* Processing Status */}
      {uploadMutation.isPending && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          <div>
            <p className="font-medium text-foreground">Processing your data...</p>
            <p className="text-sm text-muted-foreground">Parsing CSV and storing records in the database.</p>
          </div>
        </div>
      )}

      {/* CSV Format Requirements */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-foreground mb-4">CSV Format Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-2">Required Columns</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {['date - Transaction date (YYYY-MM-DD)', 'product - Product name or ID', 'quantity - Quantity sold', 'revenue - Total revenue'].map(col => (
                <li key={col} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <code className="bg-muted px-1.5 py-0.5 rounded">{col.split(' - ')[0]}</code> - {col.split(' - ')[1]}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Optional Columns</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {['category - Product category', 'customer_id - Customer identifier', 'transaction_id - Transaction ID'].map(col => (
                <li key={col} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <code className="bg-muted px-1.5 py-0.5 rounded">{col.split(' - ')[0]}</code> - {col.split(' - ')[1]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Upload History */}
      {uploadHistory && uploadHistory.length > 0 && (
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Upload History</h3>
          <div className="space-y-3">
            {uploadHistory.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
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
                  <span className={`text-sm ${
                    upload.status === 'success' ? 'text-success' :
                    upload.status === 'processing' ? 'text-primary' : 'text-destructive'
                  }`}>
                    {upload.status === 'success' ? 'Completed' : upload.status === 'processing' ? 'Processing...' : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUpload;
