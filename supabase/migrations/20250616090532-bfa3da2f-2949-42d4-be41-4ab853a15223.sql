
-- Create RLS policy for INSERT on items table
CREATE POLICY "Users can insert their own items" 
  ON public.items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Also create a SELECT policy if it doesn't exist
CREATE POLICY "Users can view all items" 
  ON public.items 
  FOR SELECT 
  USING (true);

-- Enable RLS on items table if not already enabled
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
