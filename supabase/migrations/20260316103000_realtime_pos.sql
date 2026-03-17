-- Realtime POS / barcode scanning support

ALTER TABLE public.sales_data
  ADD COLUMN IF NOT EXISTS product_id UUID,
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS transaction_status TEXT NOT NULL DEFAULT 'completed';

CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode TEXT NOT NULL,
  sku TEXT,
  name TEXT NOT NULL,
  category TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT products_unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0),
  CONSTRAINT products_reorder_level_non_negative CHECK (reorder_level >= 0),
  CONSTRAINT products_user_barcode_unique UNIQUE (user_id, barcode),
  CONSTRAINT products_user_sku_unique UNIQUE NULLS NOT DISTINCT (user_id, sku)
);

CREATE TABLE IF NOT EXISTS public.pos_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_number TEXT NOT NULL,
  customer_id TEXT,
  cashier_name TEXT,
  device_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  item_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT pos_transactions_status_valid CHECK (status IN ('open', 'completed', 'cancelled')),
  CONSTRAINT pos_transactions_item_count_non_negative CHECK (item_count >= 0),
  CONSTRAINT pos_transactions_total_amount_non_negative CHECK (total_amount >= 0),
  CONSTRAINT pos_transactions_number_unique UNIQUE (transaction_number)
);

CREATE TABLE IF NOT EXISTS public.pos_transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES public.pos_transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  scan_id TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT pos_transaction_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT pos_transaction_items_unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT pos_transaction_items_line_total_non_negative CHECK (line_total >= 0)
);

ALTER TABLE public.sales_data
  ADD CONSTRAINT sales_data_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own pos transactions"
  ON public.pos_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pos transactions"
  ON public.pos_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pos transactions"
  ON public.pos_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pos transactions"
  ON public.pos_transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own pos items"
  ON public.pos_transaction_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pos items"
  ON public.pos_transaction_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pos items"
  ON public.pos_transaction_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pos items"
  ON public.pos_transaction_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_products_user_barcode
  ON public.products (user_id, barcode);

CREATE INDEX IF NOT EXISTS idx_products_user_active
  ON public.products (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_products_user_category
  ON public.products (user_id, category);

CREATE INDEX IF NOT EXISTS idx_pos_transactions_user_created
  ON public.pos_transactions (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_transactions_one_open
  ON public.pos_transactions (user_id)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_transaction
  ON public.pos_transaction_items (transaction_id, scanned_at DESC);

CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_user_created
  ON public.pos_transaction_items (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_transaction_items_scan_unique
  ON public.pos_transaction_items (user_id, scan_id)
  WHERE scan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_data_user_status
  ON public.sales_data (user_id, transaction_status);

CREATE INDEX IF NOT EXISTS idx_sales_data_user_source
  ON public.sales_data (user_id, source);

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pos_transactions_updated_at ON public.pos_transactions;
CREATE TRIGGER update_pos_transactions_updated_at
BEFORE UPDATE ON public.pos_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sales_data'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_data';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'activity_log'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'products'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.products';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pos_transactions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pos_transaction_items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_transaction_items';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.create_pos_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_category TEXT DEFAULT 'POS',
  p_action_url TEXT DEFAULT '/dashboard/live-pos'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, category, action_url)
  VALUES (p_user_id, p_type, p_title, p_message, p_category, p_action_url);
END;
$$;

CREATE OR REPLACE FUNCTION public.start_pos_transaction(
  p_customer_id TEXT DEFAULT NULL,
  p_cashier_name TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  v_transaction public.pos_transactions%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT *
  INTO v_transaction
  FROM public.pos_transactions
  WHERE user_id = current_user_id
    AND status = 'open'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_transaction.id IS NULL THEN
    INSERT INTO public.pos_transactions (
      user_id,
      transaction_number,
      customer_id,
      cashier_name,
      device_id
    )
    VALUES (
      current_user_id,
      'POS-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || upper(substring(replace(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 6)),
      p_customer_id,
      p_cashier_name,
      p_device_id
    )
    RETURNING *
    INTO v_transaction;

    INSERT INTO public.activity_log (user_id, type, message)
    VALUES (current_user_id, 'transaction', 'Started POS transaction ' || v_transaction.transaction_number);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'transaction', to_jsonb(v_transaction)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_pos_scan(
  p_barcode TEXT,
  p_quantity INTEGER DEFAULT 1,
  p_transaction_id UUID DEFAULT NULL,
  p_customer_id TEXT DEFAULT NULL,
  p_cashier_name TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL,
  p_scan_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  v_product public.products%ROWTYPE;
  v_transaction public.pos_transactions%ROWTYPE;
  v_item public.pos_transaction_items%ROWTYPE;
  v_existing_item public.pos_transaction_items%ROWTYPE;
  v_total NUMERIC := 0;
  v_item_count INTEGER := 0;
  v_remaining_stock INTEGER := 0;
  v_requested_qty INTEGER := GREATEST(COALESCE(p_quantity, 1), 1);
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  IF p_barcode IS NULL OR btrim(p_barcode) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Barcode is required');
  END IF;

  IF p_scan_id IS NOT NULL THEN
    SELECT *
    INTO v_existing_item
    FROM public.pos_transaction_items
    WHERE user_id = current_user_id
      AND scan_id = p_scan_id
    LIMIT 1;

    IF v_existing_item.id IS NOT NULL THEN
      SELECT *
      INTO v_transaction
      FROM public.pos_transactions
      WHERE id = v_existing_item.transaction_id
      LIMIT 1;

      RETURN jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'transaction', to_jsonb(v_transaction),
        'item', to_jsonb(v_existing_item),
        'message', 'Scan already processed'
      );
    END IF;
  END IF;

  SELECT *
  INTO v_product
  FROM public.products
  WHERE user_id = current_user_id
    AND barcode = p_barcode
    AND is_active = true
  FOR UPDATE;

  IF v_product.id IS NULL THEN
    PERFORM public.create_pos_notification(
      current_user_id,
      'warning',
      'Unknown barcode',
      'No active product found for barcode ' || p_barcode
    );

    INSERT INTO public.activity_log (user_id, type, message)
    VALUES (current_user_id, 'scan_error', 'Unknown barcode scanned: ' || p_barcode);

    RETURN jsonb_build_object('ok', false, 'error', 'Unknown barcode', 'barcode', p_barcode);
  END IF;

  IF v_product.stock_quantity < v_requested_qty THEN
    PERFORM public.create_pos_notification(
      current_user_id,
      'warning',
      'Insufficient stock',
      v_product.name || ' has only ' || v_product.stock_quantity || ' unit(s) left'
    );

    INSERT INTO public.activity_log (user_id, type, message)
    VALUES (current_user_id, 'inventory', 'Insufficient stock for ' || v_product.name);

    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Out of stock',
      'available_stock', v_product.stock_quantity,
      'product', to_jsonb(v_product)
    );
  END IF;

  IF p_transaction_id IS NOT NULL THEN
    SELECT *
    INTO v_transaction
    FROM public.pos_transactions
    WHERE id = p_transaction_id
      AND user_id = current_user_id
      AND status = 'open'
    FOR UPDATE;
  ELSE
    SELECT *
    INTO v_transaction
    FROM public.pos_transactions
    WHERE user_id = current_user_id
      AND status = 'open'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF v_transaction.id IS NULL THEN
    INSERT INTO public.pos_transactions (
      user_id,
      transaction_number,
      customer_id,
      cashier_name,
      device_id
    )
    VALUES (
      current_user_id,
      'POS-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || upper(substring(replace(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 6)),
      p_customer_id,
      p_cashier_name,
      p_device_id
    )
    RETURNING *
    INTO v_transaction;
  ELSE
    UPDATE public.pos_transactions
    SET customer_id = COALESCE(p_customer_id, customer_id),
        cashier_name = COALESCE(p_cashier_name, cashier_name),
        device_id = COALESCE(p_device_id, device_id)
    WHERE id = v_transaction.id
    RETURNING *
    INTO v_transaction;
  END IF;

  INSERT INTO public.pos_transaction_items (
    user_id,
    transaction_id,
    product_id,
    barcode,
    product_name,
    quantity,
    unit_price,
    line_total,
    scan_id
  )
  VALUES (
    current_user_id,
    v_transaction.id,
    v_product.id,
    v_product.barcode,
    v_product.name,
    v_requested_qty,
    v_product.unit_price,
    v_product.unit_price * v_requested_qty,
    p_scan_id
  )
  RETURNING *
  INTO v_item;

  UPDATE public.products
  SET stock_quantity = stock_quantity - v_requested_qty
  WHERE id = v_product.id
  RETURNING stock_quantity
  INTO v_remaining_stock;

  INSERT INTO public.sales_data (
    user_id,
    product_id,
    date,
    product,
    quantity,
    revenue,
    category,
    customer_id,
    transaction_id,
    barcode,
    source,
    device_id,
    transaction_status
  )
  VALUES (
    current_user_id,
    v_product.id,
    CURRENT_DATE,
    v_product.name,
    v_requested_qty,
    v_product.unit_price * v_requested_qty,
    v_product.category,
    COALESCE(p_customer_id, v_transaction.customer_id),
    v_transaction.id::TEXT,
    v_product.barcode,
    'pos_scan',
    COALESCE(p_device_id, v_transaction.device_id),
    'open'
  );

  SELECT
    COALESCE(SUM(line_total), 0),
    COALESCE(SUM(quantity), 0)
  INTO v_total, v_item_count
  FROM public.pos_transaction_items
  WHERE transaction_id = v_transaction.id;

  UPDATE public.pos_transactions
  SET total_amount = v_total,
      item_count = v_item_count
  WHERE id = v_transaction.id
  RETURNING *
  INTO v_transaction;

  INSERT INTO public.activity_log (user_id, type, message)
  VALUES (
    current_user_id,
    'scan',
    'Scanned ' || v_product.name || ' x' || v_requested_qty || ' into ' || v_transaction.transaction_number
  );

  PERFORM public.create_pos_notification(
    current_user_id,
    'success',
    'Product scanned',
    v_product.name || ' added to ' || v_transaction.transaction_number || ' (' || v_requested_qty || ' unit(s))'
  );

  IF v_remaining_stock <= v_product.reorder_level AND v_product.stock_quantity > v_product.reorder_level THEN
    PERFORM public.create_pos_notification(
      current_user_id,
      'warning',
      'Low stock threshold reached',
      v_product.name || ' is down to ' || v_remaining_stock || ' unit(s)'
    );
  END IF;

  IF v_remaining_stock = 0 THEN
    PERFORM public.create_pos_notification(
      current_user_id,
      'warning',
      'Out of stock',
      v_product.name || ' is now out of stock'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'transaction', to_jsonb(v_transaction),
    'item', to_jsonb(v_item),
    'product', jsonb_build_object(
      'id', v_product.id,
      'name', v_product.name,
      'barcode', v_product.barcode,
      'remaining_stock', v_remaining_stock
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_pos_transaction(
  p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  v_transaction public.pos_transactions%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  UPDATE public.pos_transactions
  SET status = 'completed',
      completed_at = now()
  WHERE id = p_transaction_id
    AND user_id = current_user_id
    AND status = 'open'
  RETURNING *
  INTO v_transaction;

  IF v_transaction.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Open transaction not found');
  END IF;

  UPDATE public.sales_data
  SET transaction_status = 'completed'
  WHERE user_id = current_user_id
    AND transaction_id = p_transaction_id::TEXT
    AND source = 'pos_scan';

  INSERT INTO public.activity_log (user_id, type, message)
  VALUES (
    current_user_id,
    'transaction',
    'Completed POS transaction ' || v_transaction.transaction_number || ' for ' || v_transaction.total_amount
  );

  PERFORM public.create_pos_notification(
    current_user_id,
    'success',
    'Transaction completed',
    v_transaction.transaction_number || ' completed with ' || v_transaction.item_count || ' item(s)'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'transaction', to_jsonb(v_transaction)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_pos_transaction(
  p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  v_transaction public.pos_transactions%ROWTYPE;
  v_restored_items INTEGER := 0;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT *
  INTO v_transaction
  FROM public.pos_transactions
  WHERE id = p_transaction_id
    AND user_id = current_user_id
    AND status = 'open'
  FOR UPDATE;

  IF v_transaction.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Open transaction not found');
  END IF;

  WITH restored AS (
    SELECT product_id, SUM(quantity) AS qty
    FROM public.pos_transaction_items
    WHERE transaction_id = p_transaction_id
    GROUP BY product_id
  )
  UPDATE public.products p
  SET stock_quantity = p.stock_quantity + restored.qty
  FROM restored
  WHERE p.id = restored.product_id;

  SELECT COALESCE(SUM(quantity), 0)
  INTO v_restored_items
  FROM public.pos_transaction_items
  WHERE transaction_id = p_transaction_id;

  DELETE FROM public.sales_data
  WHERE user_id = current_user_id
    AND transaction_id = p_transaction_id::TEXT
    AND source = 'pos_scan';

  UPDATE public.pos_transactions
  SET status = 'cancelled',
      completed_at = now(),
      total_amount = 0,
      item_count = 0
  WHERE id = p_transaction_id
  RETURNING *
  INTO v_transaction;

  INSERT INTO public.activity_log (user_id, type, message)
  VALUES (
    current_user_id,
    'transaction',
    'Cancelled POS transaction ' || v_transaction.transaction_number
  );

  PERFORM public.create_pos_notification(
    current_user_id,
    'info',
    'Transaction cancelled',
    v_transaction.transaction_number || ' was cancelled and stock was restored'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'transaction', to_jsonb(v_transaction),
    'restored_items', v_restored_items
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_demo_products()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  INSERT INTO public.products (
    user_id,
    barcode,
    sku,
    name,
    category,
    unit_price,
    stock_quantity,
    reorder_level
  )
  VALUES
    (current_user_id, '8901030895489', 'DMART-RICE-001', 'Basmati Rice 5kg', 'Groceries', 549, 32, 8),
    (current_user_id, '8906008100012', 'DMART-OIL-002', 'Sunflower Oil 1L', 'Groceries', 189, 24, 6),
    (current_user_id, '8901719123456', 'DMART-BIS-003', 'Digestive Biscuits', 'Snacks', 45, 60, 12),
    (current_user_id, '8901491102233', 'DMART-SOAP-004', 'Bath Soap Pack', 'Personal Care', 129, 18, 5),
    (current_user_id, '8902080007654', 'DMART-MILK-005', 'Toned Milk 1L', 'Dairy', 62, 20, 6)
  ON CONFLICT (user_id, barcode)
  DO UPDATE SET
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit_price = EXCLUDED.unit_price,
    stock_quantity = GREATEST(public.products.stock_quantity, EXCLUDED.stock_quantity),
    reorder_level = EXCLUDED.reorder_level,
    is_active = true,
    updated_at = now();

  PERFORM public.create_pos_notification(
    current_user_id,
    'success',
    'Demo products ready',
    'Demo barcodes were added to your POS catalog'
  );

  RETURN jsonb_build_object('ok', true, 'seeded', 5);
END;
$$;
