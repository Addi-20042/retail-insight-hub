
-- Sales data table - stores all uploaded sales records
CREATE TABLE public.sales_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  customer_id TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Upload history table
CREATE TABLE public.upload_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  rows_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activity log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_data
CREATE POLICY "Users can view their own sales data" ON public.sales_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sales data" ON public.sales_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sales data" ON public.sales_data FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for upload_history
CREATE POLICY "Users can view their own uploads" ON public.upload_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own uploads" ON public.upload_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own uploads" ON public.upload_history FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for activity_log
CREATE POLICY "Users can view their own activity" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_sales_data_user_date ON public.sales_data (user_id, date);
CREATE INDEX idx_sales_data_user_product ON public.sales_data (user_id, product);
CREATE INDEX idx_activity_log_user_created ON public.activity_log (user_id, created_at DESC);
CREATE INDEX idx_upload_history_user ON public.upload_history (user_id, created_at DESC);
