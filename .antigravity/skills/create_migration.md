### Skill: create_migration
**Trigger:** "Create migration for [table name]" or "Add database table for [feature]"

**Steps:**
1. Generate timestamped migration file in `supabase/migrations/[timestamp]_[description].sql`
2. Include `CREATE TABLE` statement with `org_id TEXT NOT NULL REFERENCES organizations(id)`
3. Add `user_id UUID NOT NULL REFERENCES auth.users(id)` for user-owned data
4. Add appropriate indexes on `org_id` and foreign keys
5. Create RLS policies:
   - Enable RLS: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;`
   - User read own: `CREATE POLICY "Users can read own data" ON [table] FOR SELECT USING (auth.uid() = user_id);`
   - User insert own: `CREATE POLICY "Users can insert own data" ON [table] FOR INSERT WITH CHECK (auth.uid() = user_id);`
   - Organization read for pastors: `CREATE POLICY "Pastors can read org data" ON [table] FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('pastor', 'shepherd') AND profiles.org_id = [table].org_id));`
6. Add comment documenting table purpose and RLS strategy

**Success Criteria:** Migration runs without errors, RLS prevents cross-org and unauthorized access

**Failure Handling:** If migration conflicts with existing schema, suggest rollback strategy and ask for confirmation
