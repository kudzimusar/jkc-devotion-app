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

### Public Scoping (Unauthenticated Guest Context)

For public-facing components where a session does not yet exist (e.g., Guest Attendance, Connect Card):

1.  **Resolution**: Use `resolvePublicOrgId()` from `@/lib/org-resolver`. This function uses hostname mapping and logic-specific fallbacks to find the correct `org_id`.
2.  **Implementation**:
    ```typescript
    import { resolvePublicOrgId } from '@/lib/org-resolver';
    
    const orgId = await resolvePublicOrgId();
    const { data } = await supabase.from('events').select('*').eq('org_id', orgId);
    ```
3.  **Submission Pattern**: When saving data from an unauthenticated user (e.g., `public_inquiries`), pass the resolved `org_id` explicitly. Ensure the table has an RLS policy allowing `insert` for `anon`.

### Analytics Queries (Cross‑Tenant)

For admin dashboards that need aggregated data across organizations:

1. Use the service role client (or dedicated admin API) to query the target tables.
2. Always anonymize before presenting: mask PII by default (e.g. `em***@example.com`).
3. Log the query in `admin_audit_logs` with `action = 'cross_tenant_analytics'`.

**Failure Handling:** 
- If `org_id` is missing from the table, halt work and request a database migration to add the column.
- If the RLS policy is missing or incorrectly defined, prioritize fixing the policy before writing any frontend code.
