### Skill: Multi-Tenant Scoping
**Trigger:** *"Ensure this is multi-tenant scoped"* or *"Add org_id checks."*

**Steps:**
1.  **Schema Check**: Verify that the target table in `supabase/` has an `org_id` column.
2.  **Filter Injection**: In all Supabase `from()` queries, append `.eq('org_id', org_id)`.
3.  **RLS Verification**: Locate the corresponding table in `supabase/migrations` and ensure an RLS policy exists for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` that filters by `auth.jwt() ->> 'org_id'`.
4.  **Auth Context**: Ensure the active `org_id` is retrieved from the `useAuth()` or `useUser()` hook and passed into the service layer.

**Success Criteria:** 
- 100% of queries include org_id for tenant isolation. Branch-level filtering is optional and handled separately.
- A user from Org A cannot see, modify, or delete data belonging to Org B.
- No "naked" select queries (queries without filters) exist in the service layer.

**Failure Handling:** 
- If `org_id` is missing from the table, halt work and request a database migration to add the column.
- If the RLS policy is missing or incorrectly defined, prioritize fixing the policy before writing any frontend code.
