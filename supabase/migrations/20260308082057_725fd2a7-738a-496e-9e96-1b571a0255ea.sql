
-- Allow users to delete their own goals
CREATE POLICY "Users can delete their own goals"
ON public.goals
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Seed default achievements if empty
INSERT INTO public.achievements (name, description, icon, category, points, requirement_type, requirement_value)
SELECT * FROM (VALUES
  ('First Login', 'Complete your first login to the platform', 'sparkles', 'onboarding', 10, 'count', 1),
  ('Data Pioneer', 'Upload your first dataset', 'upload', 'data', 25, 'count', 1),
  ('Forecast Master', 'Generate 10 sales forecasts', 'trending-up', 'analytics', 50, 'count', 10),
  ('Segment Explorer', 'Analyze customer segments 5 times', 'users', 'analytics', 40, 'count', 5),
  ('Basket Analyst', 'Run 3 market basket analyses', 'shopping-cart', 'analytics', 30, 'count', 3),
  ('Report Builder', 'Export 5 PDF reports', 'file-text', 'reporting', 25, 'count', 5),
  ('Goal Setter', 'Create your first goal', 'target', 'goals', 15, 'count', 1),
  ('Goal Crusher', 'Complete 5 goals', 'trophy', 'goals', 75, 'count', 5),
  ('Power User', 'Use the app for 7 consecutive days', 'zap', 'engagement', 100, 'count', 7)
) AS v(name, description, icon, category, points, requirement_type, requirement_value)
WHERE NOT EXISTS (SELECT 1 FROM public.achievements LIMIT 1);
