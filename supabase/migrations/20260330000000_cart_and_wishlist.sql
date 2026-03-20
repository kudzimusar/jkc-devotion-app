-- 1. Merchandise Cart Items
CREATE TABLE IF NOT EXISTS public.merchandise_cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES merchandise(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 2. Merchandise Wishlist
CREATE TABLE IF NOT EXISTS public.merchandise_wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES merchandise(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 3. Enable RLS
ALTER TABLE public.merchandise_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise_wishlist ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Cart Items
CREATE POLICY "Users can manage their own cart items" ON public.merchandise_cart_items
    FOR ALL USING (auth.uid() = user_id);

-- 5. Policies for Wishlist
CREATE POLICY "Users can manage their own wishlist" ON public.merchandise_wishlist
    FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_merchandise_cart_items_updated_at
    BEFORE UPDATE ON public.merchandise_cart_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
