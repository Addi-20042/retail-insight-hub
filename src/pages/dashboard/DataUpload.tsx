import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadedFile {
  name: string;
  size: string;
  status: 'processing' | 'success' | 'error';
  timestamp: Date;
}

const DataUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const csvFiles = files.filter(f => f.name.endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      alert('Please upload CSV files only');
      return;
    }

    setIsProcessing(true);

    csvFiles.forEach(file => {
      const newFile: UploadedFile = {
        name: file.name,
        size: formatFileSize(file.size),
        status: 'processing',
        timestamp: new Date()
      };

      setUploadedFiles(prev => [newFile, ...prev]);

      // Simulate processing
      setTimeout(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.name === file.name && f.status === 'processing'
              ? { ...f, status: 'success' as const }
              : f
          )
        );
        setIsProcessing(false);
      }, 2000 + Math.random() * 1000);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-primary animate-spin" />;
      case 'success':
        return <Check className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Sales Data</h1>
        <p className="text-muted-foreground mt-1">Upload your CSV files to retrain ML models and update analytics</p>
      </div>

      {/* Upload Area */}
      <div
        className={`chart-container border-2 border-dashed transition-all duration-200 ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
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
          <p className="text-muted-foreground mt-2">
            or click to browse from your computer
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Select CSV Files
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Accepted format: .csv (comma-separated values)
          </p>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          <div>
            <p className="font-medium text-foreground">Processing your data...</p>
            <p className="text-sm text-muted-foreground">ML models are being retrained. This may take a few moments.</p>
          </div>
        </div>
      )}

      {/* File Requirements */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-foreground mb-4">CSV Format Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-2">Required Columns</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <code className="bg-muted px-1.5 py-0.5 rounded">date</code> - Transaction date (YYYY-MM-DD)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <code className="bg-muted px-1.5 py-0.5 rounded">product</code> - Product name or ID
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <code className="bg-muted px-1.5 py-0.5 rounded">quantity</code> - Quantity sold
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <code className="bg-muted px-1.5 py-0.5 rounded">revenue</code> - Total revenue
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Optional Columns</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <code className="bg-muted px-1.5 py-0.5 rounded">category</code> - Product category
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <code className="bg-muted px-1.5 py-0.5 rounded">customer_id</code> - Customer identifier
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <code className="bg-muted px-1.5 py-0.5 rounded">transaction_id</code> - Transaction ID
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Uploaded Files</h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.size} • {file.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusIcon(file.status)}
                  <span className={`text-sm ${
                    file.status === 'success' ? 'text-success' :
                    file.status === 'error' ? 'text-destructive' :
                    'text-primary'
                  }`}>
                    {file.status === 'success' ? 'Models Updated' :
                     file.status === 'error' ? 'Failed' :
                     'Processing...'}
                  </span>
                  {file.status !== 'processing' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.name)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
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
