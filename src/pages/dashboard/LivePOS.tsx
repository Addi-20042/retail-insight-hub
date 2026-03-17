import React, { useEffect, useRef, useState } from 'react';
import {
  ScanLine,
  Package,
  ShoppingCart,
  RefreshCw,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Boxes,
  Wallet,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/animated-container';
import {
  useActivePosTransaction,
  usePosTransactionItems,
  useProducts,
} from '@/hooks/useSupabaseData';
import {
  useCancelPosTransaction,
  useCompletePosTransaction,
  useScanPosBarcode,
  useSeedDemoProducts,
  useStartPosTransaction,
} from '@/hooks/useApiData';
import { toast } from 'sonner';

const formatCurrency = (value: number) => `Rs.${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const LivePOS: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [customerId, setCustomerId] = useState('');
  const [cashierName, setCashierName] = useState('Counter 1');
  const [deviceId, setDeviceId] = useState('WEB-POS-01');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: activeTransaction, isLoading: transactionLoading } = useActivePosTransaction();
  const { data: items, isLoading: itemsLoading } = usePosTransactionItems(activeTransaction?.id);

  const startTransaction = useStartPosTransaction();
  const scanBarcode = useScanPosBarcode();
  const completeTransaction = useCompletePosTransaction();
  const cancelTransaction = useCancelPosTransaction();
  const seedDemoProducts = useSeedDemoProducts();

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [activeTransaction?.id]);

  const handleStartTransaction = async () => {
    try {
      const result = await startTransaction.mutateAsync({
        customer_id: customerId || undefined,
        cashier_name: cashierName || undefined,
        device_id: deviceId || undefined,
      });

      if (!result.ok) {
        throw new Error(result.error || 'Unable to start transaction');
      }

      setStatusMessage({ type: 'info', text: `Ready on ${result.transaction?.transaction_number}` });
      barcodeInputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start transaction');
    }
  };

  const handleScan = async (nextBarcode?: string) => {
    const barcodeValue = (nextBarcode ?? barcode).trim();
    if (!barcodeValue) {
      setStatusMessage({ type: 'error', text: 'Scan or type a barcode first.' });
      barcodeInputRef.current?.focus();
      return;
    }

    try {
      const result = await scanBarcode.mutateAsync({
        barcode: barcodeValue,
        quantity: Number(quantity) > 0 ? Number(quantity) : 1,
        transaction_id: activeTransaction?.id ?? null,
        customer_id: customerId || undefined,
        cashier_name: cashierName || undefined,
        device_id: deviceId || undefined,
        scan_id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      });

      if (!result.ok) {
        setStatusMessage({ type: 'error', text: result.error || 'Scan failed.' });
        toast.error(result.error || 'Scan failed');
        return;
      }

      setBarcode('');
      setQuantity('1');
      setStatusMessage({
        type: 'success',
        text: result.duplicate
          ? 'Duplicate scan ignored.'
          : `${result.product?.name || barcodeValue} added. Remaining stock: ${result.product?.remaining_stock ?? '--'}`,
      });
      barcodeInputRef.current?.focus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      setStatusMessage({ type: 'error', text: message });
      toast.error(message);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!activeTransaction?.id) return;

    try {
      const result = await completeTransaction.mutateAsync(activeTransaction.id);
      if (!result.ok) {
        throw new Error(result.error || 'Unable to complete transaction');
      }

      setStatusMessage({ type: 'success', text: `${result.transaction?.transaction_number} completed successfully.` });
      setBarcode('');
      setCustomerId('');
      barcodeInputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to complete transaction');
    }
  };

  const handleCancelTransaction = async () => {
    if (!activeTransaction?.id) return;

    try {
      const result = await cancelTransaction.mutateAsync(activeTransaction.id);
      if (!result.ok) {
        throw new Error(result.error || 'Unable to cancel transaction');
      }

      setStatusMessage({ type: 'info', text: `${result.transaction?.transaction_number} cancelled and stock restored.` });
      setBarcode('');
      barcodeInputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel transaction');
    }
  };

  const handleSeedDemoProducts = async () => {
    try {
      const result = await seedDemoProducts.mutateAsync();
      if (!result.ok) {
        throw new Error(result.error || 'Unable to seed demo products');
      }
      setStatusMessage({ type: 'success', text: `Seeded ${result.seeded || 5} demo products.` });
      barcodeInputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to seed demo products');
    }
  };

  const currentItems = items || [];
  const currentProducts = products || [];
  const lowStockProducts = currentProducts.filter((product) => product.stock_quantity <= product.reorder_level);
  const totalAmount = activeTransaction?.total_amount ?? currentItems.reduce((sum, item) => sum + Number(item.line_total), 0);
  const totalItems = activeTransaction?.item_count ?? currentItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Live POS" description="Scan products, update inventory instantly, and keep analytics live.">
        <Button
          variant="outline"
          onClick={handleSeedDemoProducts}
          disabled={seedDemoProducts.isPending}
          className="gap-2"
        >
          {seedDemoProducts.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Boxes className="w-4 h-4" />}
          Seed Demo Products
        </Button>
        <Button
          variant="outline"
          onClick={handleStartTransaction}
          disabled={startTransaction.isPending}
          className="gap-2"
        >
          {startTransaction.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
          Start Transaction
        </Button>
      </PageHeader>

      {statusMessage && (
        <div className={`rounded-xl border p-4 ${
          statusMessage.type === 'success'
            ? 'border-success/30 bg-success/10'
            : statusMessage.type === 'error'
              ? 'border-destructive/30 bg-destructive/10'
              : 'border-primary/30 bg-primary/10'
        }`}>
          <p className="font-medium text-foreground">{statusMessage.text}</p>
        </div>
      )}

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">No scanner needed for realtime testing</h3>
            <p className="text-sm text-muted-foreground">
              Click <span className="font-medium text-foreground">Seed Demo Products</span>, then
              <span className="font-medium text-foreground"> Start Transaction</span>, and use
              the <span className="font-medium text-foreground">Simulate Scan</span> buttons or
              type a demo barcode manually and press Enter.
            </p>
            <p className="text-sm text-muted-foreground">
              Realtime is working if the Active Cart, stock counts, Low Stock Watch, and notification bell
              update immediately after each scan.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="chart-container space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Scanner Console</h3>
              <p className="text-sm text-muted-foreground">
                Works with manual typing or a USB keyboard-wedge scanner that submits with Enter.
              </p>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {activeTransaction ? activeTransaction.transaction_number : 'No open transaction'}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground">Barcode</label>
              <Input
                ref={barcodeInputRef}
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleScan();
                  }
                }}
                placeholder="Scan or type barcode"
                className="h-12 text-lg tracking-wide"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Quantity</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="h-12"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Customer ID</label>
              <Input value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cashier</label>
              <Input value={cashierName} onChange={(event) => setCashierName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Device ID</label>
              <Input value={deviceId} onChange={(event) => setDeviceId(event.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleScan()} disabled={scanBarcode.isPending} className="gap-2">
              {scanBarcode.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              Scan Product
            </Button>
            <Button
              variant="outline"
              onClick={handleCompleteTransaction}
              disabled={!activeTransaction || currentItems.length === 0 || completeTransaction.isPending}
              className="gap-2"
            >
              {completeTransaction.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Complete Transaction
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelTransaction}
              disabled={!activeTransaction || cancelTransaction.isPending}
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {cancelTransaction.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancel Transaction
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Items</p>
                  <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-success/10 p-2 text-success">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Total</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-warning/10 p-2 text-warning">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock SKUs</p>
                  <p className="text-2xl font-bold text-foreground">{lowStockProducts.length}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="chart-container space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Active Cart</h3>
              <p className="text-sm text-muted-foreground">Latest scanned items update here in realtime.</p>
            </div>
            {(transactionLoading || itemsLoading) && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          {currentItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <ScanLine className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No items scanned yet</p>
              <p className="text-sm text-muted-foreground">Start a transaction and scan a barcode to populate the cart.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.barcode} | {new Date(item.scanned_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatCurrency(Number(item.line_total))}</p>
                      <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="chart-container space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Demo Products</h3>
              <p className="text-sm text-muted-foreground">Use these to test manual entry or scanner hardware.</p>
            </div>
            {productsLoading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          {currentProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <Boxes className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No products in your POS catalog</p>
              <p className="text-sm text-muted-foreground">
                Seed the demo catalog to start testing realtime scans immediately. You do not need a hardware scanner.
              </p>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={handleSeedDemoProducts}
                disabled={seedDemoProducts.isPending}
              >
                {seedDemoProducts.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Boxes className="w-4 h-4" />}
                Seed Demo Products
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.barcode} | {product.category || 'Uncategorized'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Stock {product.stock_quantity} | Reorder at {product.reorder_level}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.stock_quantity <= product.reorder_level
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                      }`}>
                        {formatCurrency(Number(product.unit_price))}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => handleScan(product.barcode)}>
                        Simulate Scan
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="chart-container space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Low Stock Watch</h3>
            <p className="text-sm text-muted-foreground">These products should trigger warnings as the scanner reduces inventory.</p>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">Inventory looks healthy</p>
              <p className="text-sm text-muted-foreground">
                To test low-stock alerts without a scanner, seed demo products, start a transaction, and keep clicking
                {' '}<span className="font-medium text-foreground">Simulate Scan</span>{' '}
                on the same item until it reaches the reorder level.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.barcode} | reorder at {product.reorder_level}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warning">{product.stock_quantity} left</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => handleScan(product.barcode)}>
                        Test Warning
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LivePOS;
