### Skill: create_feature_module
**Trigger:** "Create a new [feature name] module" or "Add a new feature called [name]"

**Steps:**
1. Create feature directory in `src/features/[feature-name]/`
2. Create component files: `[FeatureName].tsx`, `[FeatureName]Form.tsx`, `[FeatureName]List.tsx` as needed
3. Create service file in `src/lib/services/[feature-name]-service.ts` with Supabase queries
4. Create types in `src/types/[feature-name].ts` extending base types with `org_id`
5. Add route in `src/app/[feature-name]/page.tsx` if standalone page
6. Add navigation link to appropriate dashboard (member/shepherd/pastor)
7. Ensure all queries include org_id filtering. New features must support both denominations (tenants) and branches (sub-entities).
8. Add toast notifications for success/error states

**Success Criteria:** Feature renders, loads data from Supabase with RLS applied, follows existing styling patterns. Branch-level filtering is optional and handled separately.
- A user from Org A cannot see, modify, or delete data belonging to Org B.
- No "naked" select queries (queries without filters) exist in the service layer.

**Failure Handling:** If database schema missing, generate migration file in `supabase/migrations/` with `org_id` and RLS policies

## Additional Requirements (Updated)

### Auto-Save Integration
- Every form component must include `useAutoSave` hook
- Form type should follow pattern: `'feature_name_form'`
- Implement restore prompt using `RestorePrompt` component

### Session Management
- Use `useSessionHeartbeat` in layouts for pages requiring extended sessions
- Add `SessionExpiryWarning` to layouts for critical flows

### Database Integration
- All new tables must include `org_id` for multi-tenancy
- Use `organization_intelligence` for AI-related settings
- Store uploaded assets in appropriate storage bucket with RLS
