-- Add is_saved column to merchandise_cart_items to support "Save for later" feature
ALTER TABLE public.merchandise_cart_items ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT FALSE;

-- Ensure RLS is updated if needed (usually it covers all columns by default)
COMMENT ON COLUMN public.merchandise_cart_items.is_saved IS 'Flag to indicate if an item is saved for later (not in active cart)';
