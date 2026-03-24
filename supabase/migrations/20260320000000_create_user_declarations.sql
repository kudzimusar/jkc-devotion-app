-- Create user_declarations table
CREATE TABLE IF NOT EXISTS public.user_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    org_id UUID REFERENCES public.organizations(id),
    devotion_id TEXT NOT NULL,
    declaration_text TEXT NOT NULL,
    confirmed_at TIMESTAMPTZ DEFAULT now(),
    user_name TEXT, -- For guests
    user_type TEXT DEFAULT 'member'
);

-- Enable RLS
ALTER TABLE public.user_declarations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (including guests)
CREATE POLICY "Allow public insert for declarations" 
ON public.user_declarations FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users with shepherd/admin roles to view all
CREATE POLICY "Allow staff to view all declarations" 
ON public.user_declarations FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND role IN ('admin', 'shepherd', 'super_admin', 'owner', 'pastor')
    )
);

-- Allow users to view their own declarations
CREATE POLICY "Allow users to view own declarations" 
ON public.user_declarations FOR SELECT 
TO authenticated
USING (user_id = auth.uid());
