-- Create public_inquiries table for contact form
CREATE TABLE IF NOT EXISTS public_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public_inquiries ENABLE ROW LEVEL SECURITY;

-- Policies
-- Note: Using DO block or DROP POLICY to ensure clean application
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "anyone_can_submit" ON public_inquiries;
    DROP POLICY IF EXISTS "admin_read_inquiries" ON public_inquiries;
END $$;

CREATE POLICY "anyone_can_submit" ON public_inquiries 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_inquiries" ON public_inquiries 
  FOR SELECT USING (auth.role() = 'service_role');
