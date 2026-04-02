-- 1. Create a helper function to check admin roles without infinite recursion
-- Use SECURITY DEFINER to bypass RLS during the check
CREATE OR REPLACE FUNCTION check_is_admin(requested_roles TEXT[] DEFAULT ARRAY['super_admin'])
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role = ANY(requested_roles)
    ) INTO is_admin;
    RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage plans" ON company_plans;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON organization_subscriptions;
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Admins can view company analytics" ON company_analytics;
DROP POLICY IF EXISTS "Admins can view org features" ON organization_features;
DROP POLICY IF EXISTS "Admins can manage roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can manage AI insights" ON admin_ai_insights;
DROP POLICY IF EXISTS "Super Admins can manage AI Insight Analytics" ON ai_insight_analytics;
DROP POLICY IF EXISTS "Super Admins can manage broadcasts" ON platform_broadcasts;
DROP POLICY IF EXISTS "Super Admins can manage broadcast receipts" ON broadcast_receipts;
DROP POLICY IF EXISTS "Super Admins can manage organizations" ON organizations;

-- 3. Re-create policies using the non-recursive helper function

CREATE POLICY "Admins can manage plans" ON company_plans
    FOR ALL USING (check_is_admin(ARRAY['super_admin']));

CREATE POLICY "Admins can manage subscriptions" ON organization_subscriptions
    FOR ALL USING (check_is_admin(ARRAY['super_admin', 'billing_admin']));

CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
    FOR SELECT USING (check_is_admin(ARRAY['super_admin']));

CREATE POLICY "Admins can view company analytics" ON company_analytics
    FOR SELECT USING (check_is_admin(ARRAY['super_admin', 'analytics_viewer']));

CREATE POLICY "Admins can view org features" ON organization_features
    FOR SELECT USING (check_is_admin(ARRAY['super_admin', 'support_admin', 'analytics_viewer']));

-- THE ROOT CAUSE FIX: Policy for admin_roles table itself
CREATE POLICY "Admins can manage roles" ON admin_roles
    FOR ALL USING (check_is_admin(ARRAY['super_admin']));

CREATE POLICY "Admins can manage AI insights" ON admin_ai_insights
    FOR ALL USING (check_is_admin(ARRAY['super_admin', 'support_admin']));

CREATE POLICY "Super Admins can manage AI Insight Analytics" ON ai_insight_analytics
    FOR ALL USING (check_is_admin(ARRAY['super_admin']));

CREATE POLICY "Super Admins can manage broadcasts" ON platform_broadcasts
    FOR ALL USING (check_is_admin(ARRAY['super_admin']));

CREATE POLICY "Super Admins can manage broadcast receipts" ON broadcast_receipts
    FOR ALL USING (check_is_admin(ARRAY['super_admin']));

CREATE POLICY "Super Admins can manage organizations" ON organizations
    FOR ALL USING (check_is_admin(ARRAY['super_admin']));
