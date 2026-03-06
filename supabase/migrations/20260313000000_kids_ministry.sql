-- Church OS: Kids Ministry Registry
-- Specialized capture for children ministry operations.

-- 1. Kids Registry Table
CREATE TABLE IF NOT EXISTS public.kids_registry (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    child_name text NOT NULL,
    age int,
    parent_name text,
    allergies text,
    check_in_time timestamptz DEFAULT now(),
    checked_out_at timestamptz,
    supervised_by uuid REFERENCES auth.users(id), -- The ministry leader
    status text DEFAULT 'checked_in', -- checked_in, checked_out
    created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.kids_registry ENABLE ROW LEVEL SECURITY;

-- Policy: Children leaders and Admins can manage
CREATE POLICY "Children leaders manage registry" ON public.kids_registry
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.org_members 
            WHERE user_id = auth.uid() 
            AND (role IN ('admin', 'shepherd', 'owner') OR (role = 'ministry_lead' AND stage = 'department_head'))
        )
    );

NOTIFY pgrst, 'reload schema';
