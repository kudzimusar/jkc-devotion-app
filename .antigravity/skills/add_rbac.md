### Skill: add_rbac
**Trigger:** "Add role check to [page/component]" or "Secure [feature] with role-based access"

**Steps:**
1. Identify required role (member, shepherd, pastor, admin)
2. Check if page uses server-side protection (not possible with static export—use client-side redirects)
3. Add role check in `useEffect` or use custom hook `useRequireRole()`
4. Redirect unauthorized users to appropriate dashboard or login page
5. For API calls, ensure service layer validates role via Supabase RLS or client-side check
6. Add MFA requirement for pastor/admin routes if applicable
7. Update navigation to conditionally show links based on role
8. Add error boundary for permission denied states

**Clarification:** Roles (owner, pastor, member) are scoped to org_id. A user can have different roles in different organizations.

**Success Criteria:** Users cannot access features above their role; UI reflects permissions correctly

**Failure Handling:** If role not present in session, redirect to login or request role assignment
