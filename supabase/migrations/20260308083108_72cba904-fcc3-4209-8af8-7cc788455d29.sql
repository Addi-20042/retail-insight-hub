
-- Allow users to update their own sales data (needed for inline editing)
CREATE POLICY "Users can update their own sales data"
ON public.sales_data
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
