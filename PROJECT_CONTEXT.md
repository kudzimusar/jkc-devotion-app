# Project Context

## Overview
- **Purpose**: A comprehensive, AI-driven spiritual infrastructure (Church OS) for Japan Kingdom Church (JKC), designed for tracking daily spiritual maturity, journaling, and providing pastoral leadership with AI-powered "Prophetic Intelligence."
- **Target users**: Church members (Bilingual congregation), Ministry Leaders, Pastors, and Church Administrators.
- **SaaS Status**: ~75% SaaS-ready as of commit `b9383430` (March 2026). Multi-tenancy hardening complete. Intelligence pipeline operational. Hosting migration pending.

## Tech Stack
| Category | Technology | Version | Detail |
|----------|------------|---------|--------|
| Frontend | Next.js (App Router) | 16.1.6 | Static Export (`output: 'export'`) |
| Library | React | 19.2.3 | Client-side hydration focus |
| Database | Supabase (PostgreSQL) | Latest | RLS-enforced multi-tenancy |
| AI Engine | Gemini 2.5 Flash | SDK ^0.24 | via `NEXT_PUBLIC_GEMINI_API_KEY` (client) / `GEMINI_API_KEY` (Edge Functions only) |
| Comm / Mail | Brevo (Sendinblue) | API v3 | Strategic Newsletters & Victory Briefings |
| Analytics | Custom (Supabase) | `AnalyticsService` | Behavioral tracking & PIL Feed ingestion |
| UI Strategy | Stitch / Radix | Latest | Functional "stitching" of design tokens |
| State | TanStack React Query | 5.90.21 | Server-state caching |
| Styling | Tailwind CSS 4 | ^4.0.0 | Premium Glassmorphism & Animations |
| Hosting | GitHub Pages | - | Deployed at `kudzimusar.github.io/jkc-devotion-app/` |

> **AI Model Rule**: The ONLY active model string is `models/gemini-2.5-flash`. ALL `gemini-1.5-flash`, `gemini-1.5-pro`, or `gemini-3.1-pro` strings are **deprecated and forbidden**. Edge Functions use `GEMINI_API_KEY` (server-side). Client-side AI uses `NEXT_PUBLIC_GEMINI_API_KEY`. Never swap these. Always use the latest 2.5 architecture.

## Architecture
- **Structure**: 
  - `src/app`: Routing and layout logic using the App Router.
  - `src/lib`: Core business logic, backend services (PIL Engine, AI Service, Bible API, **org-resolver**).
  - `src/components`: Reusable UI components (Feature-based and Common).
  - `src/hooks`: Data fetching and authentication logic hooks.
  - `supabase/`: Database schema, migrations, RLS policies, and Edge Functions.
- **Data flow**: Client-side data fetching via React Query and Supabase standard clients. Administrative dashboards (Shepherd/Pastor HQ) use `supabaseAdmin` for aggregate analytics. Static export constraint means no Server Actions in production.
- **Key patterns**: Service-layer pattern in `src/lib`, feature-scoping via `org_id` for multi-tenancy, and "Prophetic Intelligence" aggregation for pastoral care.

---

## Multi-Tenant Architecture — HARDENED (March 2026)

Church OS is a **fully multi-tenant platform** as of commit `b9383430`. All hardcoded `org_id` literals have been removed from production logic.

### The Canonical Org Resolution Pattern

**All org_id resolution MUST go through `src/lib/org-resolver.ts`.** This is the single source of truth. Never hardcode org_id literals in any file other than `org-resolver.ts`.

```typescript
// For public pages (WatchClient, SermonSection, ConnectSection, etc.)
import { resolvePublicOrgId } from '@/lib/org-resolver';
const orgId = await resolvePublicOrgId(); // Maps hostname → org_id

// For admin/dashboard pages
import { resolveAdminOrgId } from '@/lib/org-resolver';
const { orgId, role } = await resolveAdminOrgId(); // Maps session → org_id

// On logout — MUST be called to prevent session bleeding
import { clearOrgCache } from '@/lib/org-resolver';
clearOrgCache();
```

### org-resolver.ts Behaviour
- **Layer 1**: In-memory module-level memoization (fastest, resets on page navigation)
- **Layer 2**: `sessionStorage` cache with 10-minute TTL
- **Layer 3**: Supabase `organizations` table lookup
- **Dev/GitHub Pages fallback**: Uses `JKC_ORG_ID` constant when `hostname` is `localhost`, `127.0.0.1`, or contains `github.io`
- **Production**: Resolves by `eq('domain', hostname)`
- **`clearOrgCache()`**: Resets all three layers. Called in `AdminAuth.logoutAdmin()`.

### JKC_ORG_ID Constant
The JKC org UUID is exported from `org-resolver.ts` as `JKC_ORG_ID` and re-exported from `constants.ts`. It must only appear in these two files as a constant definition. Anywhere else is a bug.

```typescript
import { JKC_ORG_ID } from '@/lib/org-resolver';
// or
import { JKC_ORG_ID } from '@/lib/constants';
```

### Tenant Concepts
| Concept | Database | Description | Example |
|---------|----------|-------------|---------|
| **Denomination (Tenant)** | `organizations` table, unique `org_id` | A church that subscribes to Church OS | JKC Church, Grace Fellowship |
| **Branch (Sub-Entity)** | `branch_id` within same org | A campus under a denomination | JKC Tokyo, JKC Osaka |
| **Member** | `profiles` table with `org_id` | Individual person | John Doe (JKC member) |
| **Pastor/Admin** | `org_members` with role = pastor/owner | Leader overseeing a denomination | Pastor Smith (JKC) |

### Isolation Rules
- Every database query MUST include `.eq('org_id', orgId)` filtering
- RLS policies enforce tenant isolation at the database level
- Pastors/admins can only see data within their `org_id`
- Members can only see their own data within their `org_id`
- `supabaseAdmin` bypasses RLS — only use in Mission Control / Shepherd routes, never on member-facing pages

---

## Intelligence Pipeline Architecture — OPERATIONAL (March 2026)

### Two Separate AI Insight Tables — NEVER Union These
| Table | Writer | Reader | Purpose |
|-------|--------|--------|---------|
| `prophetic_insights` | PIL Engine (`pil-engine.ts`), weekly sweep | Shepherd Dashboard, Pastor HQ, AI Assistant | Global org-level predictive insights |
| `ai_ministry_insights` | Intelligence route (`/api/intelligence/run/route.ts`) fan-out | Ministry Dashboard (`MinistryDashboardClient.tsx`) | Ministry-scoped insights for leaders |

These tables have different schemas and different audiences. They must never be unioned or confused.

### Intelligence Flow (End-to-End)
```
pg_cron: 0 12 * * 0 (Sunday 12:00 UTC = 21:00 JST)
    → weekly-sweep Edge Function (supabase/functions/weekly-sweep/index.ts)
        → Step 1: run_weekly_ministry_sweep (SQL RPC) → church_health_metrics
        → Step 2: /api/intelligence/run (POST)
            → PIL Engine → prophetic_insights (global, org-scoped)
            → Fan-out → ai_ministry_insights (per active ministry, is_approved: false)
```

### Approval Gate
`ai_ministry_insights` rows are inserted with `is_approved: false`. A pastor must approve them in the **Shepherd Dashboard → Ministry Insight Approvals card** before ministry leaders can see them. Approval stamps `approved_by` (user UUID) and `approved_at` (timestamp).

### Weekly Sweep Edge Function
- **File**: `supabase/functions/weekly-sweep/index.ts`
- **Org resolution**: `Deno.env.get('DEFAULT_ORG_ID')` with JKC UUID fallback
- **Cron job name**: `weekly-ministry-sweep`
- **Schedule**: `0 12 * * 0` (UTC)
- **Auth**: Uses real service role key stored in pg_cron command (verified March 2026)

### PIL Engine Rules
- Uses standard `supabase` client (not `supabaseAdmin`) — respects RLS
- `orgId` is always passed as a parameter — never resolved internally
- Writes to `prophetic_insights` only — never to `ai_ministry_insights` directly
- 12 predictive models: disengagement, geo, crisis, retention, isolation, spiritual_climate, pastoral_load, stewardship, evangelism, sermon_impact, burnout, AI-generated insights

---

## Admin Auth & Session Management

### Role Hierarchy
```typescript
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
    super_admin: 100,
    pastor: 100,
    owner: 95,
    shepherd: 80,
    admin: 70,
    ministry_lead: 60,
    ministry_leader: 60,
    member: 10,
};
```

### Session Rules
- Admin sessions cached in `sessionStorage` with 60-minute TTL (`church_os_admin_session`)
- Multi-org users: active org stored in `sessionStorage` as `church_os_active_org`
- **`clearOrgCache()` must be called on every logout** to prevent session bleeding between users on the same browser tab
- `resolveAdminOrgId()` handles multi-org users safely — no `.maybeSingle()` on `org_members`

### Mission Control vs Member App
| Context | Client | RLS |
|---------|--------|-----|
| Mission Control / Shepherd routes | `supabaseAdmin` (service role) | Bypassed |
| Member app / public routes | `supabase` (anon key) | Enforced |
| PIL Engine | `supabase` (anon key) | Enforced |
| Edge Functions | `SUPABASE_SERVICE_ROLE_KEY` | Bypassed |

---

## Activity Logging

### Two Loggers — Use the Right One
| File | Function | Context | org_id Source |
|------|----------|---------|---------------|
| `src/lib/activity-logger.ts` | `logActivity()` | Client-side, member app | Resolved from `org_members` table via session |
| `src/app/actions/log-activity.ts` | `logActivityServer()` | Server actions / admin | Resolved from `org_members` table via `userId` param |

Both loggers dynamically resolve `org_id` — never hardcoded. The `logActivity()` function uses a three-tier fallback: `metadata.org_id` → `user_metadata.org_id` → `profiles` table lookup.

---

## Key Fixed Issues (March 2026 Audit)

### pastoral_notes Query
The correct foreign key hint for joining `profiles` is `member_user_id`, not `member_id`:
```typescript
// CORRECT
.select('*, profiles!member_user_id(name)')

// WRONG — causes 400 error
.select('*, profiles!member_id(name)')
```
A unique constraint exists on `(member_user_id, category, is_resolved)` to prevent duplicate active counseling notes.

### devotions Table
All 31 rows backfilled with `org_id = JKC_ORG_ID`. Phase 1 data integrity complete.

---

## Static Export Constraints

The app uses `output: 'export'` (GitHub Pages). This means:
- **No Server Actions in production** — route through Edge Functions instead
- **No standard API routes at runtime** — `/api/*` routes only work in dev
- **`supabaseAdmin` cannot be used in client components** — service role key would be exposed
- **`generateStaticParams` required** in every dynamic route layout
- **Edge Functions** are the correct pattern for server-side logic in production

---

## SaaS Evolution: Platform vs Tenant Layer

### Platform Layer (Infrastructure)
Brand-neutral tools provided to all churches:
- `/login` and `/onboarding` — neutral entry points
- Mission Control (Shepherd) — admin backend
- Pastor HQ — prophetic intelligence
- Member Profile Card — digital identity

### Tenant Layer (The Church Website)
The `(public)` route group. Dynamic skeleton pulling Name, Logo, Colors from `organizations` table. All public data (Sermons, Events, Testimonies) scoped to `org_id` derived from domain via `resolvePublicOrgId()`.

### Two Sign-Up Flows

**Flow 1: Church Sign-Up (SaaS Onboarding)**
- Location: `/onboarding`
- Creates row in `organizations` + first user as `owner`/`pastor`
- Triggers `provision-church-intelligence` Edge Function
- AI generates Growth Blueprint → delivered via Brevo email

**Flow 2: Member Sign-Up**
- Location: `AuthModal` or `/login`
- User selects existing organization
- Creates profile with that `org_id`, role = `member`/`guest`

---

## AI-First Onboarding & Intelligence Provisioning

### Onboarding Steps
| Step | Name | Key Fields |
|------|------|------------|
| 1 | Church Identity | Name, contact email, subdomain, logo |
| 2 | Intelligence DNA | Tradition, Emphasis, Worship Style, Size, Language |
| 3 | Plan & Summary | Plan selection, AI badge |

### Theological DNA Fields (stored in `organization_intelligence`)
| Field | Options |
|-------|---------|
| `theological_tradition` | Pentecostal, Reformed, Evangelical, Baptist, Anglican, Non-Denominational, Other |
| `ministry_emphasis` | Evangelism-led, Discipleship-focused, Social-Justice, Scripture-intensive, Worship-led, Other |
| `worship_style` | Modern/Contemporary, Traditional/Hymnal, Blended, Spontaneous/Spirit-led, Other |
| `congregation_size` | <100, 100-500, 500-2000, 2000+ |
| `primary_language` | English, Japanese, Bilingual, Korean, Portuguese, Spanish, Other |

### AI Provisioning Pipeline
1. Organization created in `organizations`
2. DNA saved to `organization_intelligence`
3. API key generated for MCP access
4. `provision-church-intelligence` Edge Function triggered
5. Gemini generates first Growth Blueprint insight
6. Welcome email via Brevo
7. Dashboard widget shows provisioning status

---

## Dashboards

| Dashboard | Access | Core Purpose | Data Source |
|-----------|--------|--------------|-------------|
| **Member Hub** | Members | Spiritual growth & **ChurchGPT** | `soap_entries`, `member_stats` |
| **Mission Control** | Pastors/Leaders | Congregation health & **Assistant Bot** | `prophetic_insights`, `ai_ministry_insights` |
| **Ministry Dashboard** | Ministry Leaders | Departmental **Growth Blueprints** | `ai_ministry_insights` (approved only) |
| **Pastor HQ** | Pastors | Strategic **Prophetic Intelligence** | `vw_*` views, `prophetic_insights` |
| **Super Admin Console** | Church OS Team | Global **ROI & PIL Orchestration** | `company_analytics`, `admin_ai_insights` |

### Shepherd Dashboard Intelligence Cards
- **Prophetic Insights**: From `prophetic_insights`, unacknowledged, sorted by risk
- **Ministry Insight Approvals** *(NEW)*: From `ai_ministry_insights` where `is_approved = false`. One-tap approval stamps `approved_by` and `approved_at`, making insight visible to ministry leaders

---

## pg_cron Jobs (Active)

| Job Name | Schedule | Command |
|----------|----------|---------|
| `aggregate-sermons-5min` | `*/5 * * * *` | `SELECT public.aggregate_all_sermon_stats()` |
| `job-worker-1min` | `* * * * *` | `SELECT public.process_pending_jobs()` |
| `weekly-ministry-sweep` | `0 12 * * 0` | POST to `weekly-sweep` Edge Function with service role key |

---

## Edge Functions (Deployed)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `weekly-sweep` | pg_cron Sunday 12:00 UTC | Health score SQL sweep + AI intelligence sweep |
| `ai-worker` | job-worker-1min | Processes pending AI jobs from `job_queue` |
| `ai-insight-metrics` | Manual/scheduled | Aggregates insight metrics |
| `daily-analytics-aggregator` | Midnight daily | Platform KPIs (MRR, churn, user growth) |
| `ai-decision-engine` | Daily | Admin console AI insights refresh |
| `onboarding-invite` | Manual | Magic link church invitations |
| `onboarding-register` | On signup | Church registration completion |
| `provision-church-intelligence` | Post-onboarding | AI Growth Blueprint generation |
| `send-system-alert` | On trigger | System notifications |
| `dispatch-broadcasts` | Scheduled | Newsletter/broadcast delivery |
| `visitor-connector` | On new visitor | Visitor follow-up automation |
| `process-escalations` | On escalation | Routes escalations to correct department |
| `process-reminders` | Scheduled | User reminder delivery |

---

## Known Constraints & Gotchas

- **Static Export**: No Server Actions or standard API routes in production. Use Edge Functions for server-side logic.
- **`supabaseAdmin` scope**: Only in Mission Control/Shepherd routes. Never in member-facing components.
- **`org_id` on every query**: Every database query must be scoped by `org_id` — enforced by RLS and by convention.
- **AI table separation**: `prophetic_insights` and `ai_ministry_insights` must never be unioned. Different schemas, different audiences.
- **Gemini model string**: Always `gemini-2.5-flash`. The string `gemini-1.5-pro` or `gemini-3.1-pro` are wrong.
- **Edge Function env vars**: Use `GEMINI_API_KEY` (not `NEXT_PUBLIC_GEMINI_API_KEY`) in Edge Functions.
- **`generateStaticParams`**: Required in every dynamic route layout for static export.
- **Hydration & PWA**: `postbuild` copies index to 404 for SPA routing — do not remove.
- **pastoral_notes FK**: Join hint is `profiles!member_user_id`, not `profiles!member_id`.
- **Memoized org resolver**: Module-level variables in `org-resolver.ts` reset on page navigation in static export. `clearOrgCache()` must be called on logout.

---

## Kingdom Connect Hub (KCC) intake flow
The Kingdom Connect Hub is the primary intake engine for guests and non-members. It is designed for frictionless, unauthenticated conversion with AI-powered classification.

### intake flow
1.  **Submission**: User submits a form via `KingdomConnectModal` (global) or `/connect` (standalone).
2.  **Inquiry Creation**: A row is inserted into `public_inquiries` with `status = 'new'`.
3.  **Child Data**: Specific data is inserted into child tables (`event_registrations`, `prayer_requests`, `volunteer_applications`, etc.) with a foreign key to `public_inquiries.id` (`inquiry_id`).
4.  **AI classification**: The `visitor-connector` Edge Function is triggered by a database webhook. It classifies the inquiry by topic and urgency, updating `public_inquiries.status = 'analyzed'`.
5.  **Ministry Routing**: Leadership views these in the Shepherd Dashboard for follow-up.

### intake constraints
- **Permissions**: Child tables must have RLS `INSERT` policies allowed for `anon` users.
- **Email handling**: Always use `email: data.email || null`. Brevo fails silently if sent an empty string. `null` is the required signal for anonymous or unprovided email.
- **Multi-tenancy**: Must always resolve `org_id` using `resolvePublicOrgId()` to ensure unauthenticated submissions land in the correct church context.

---

## Project-Specific Rules

- **org_id is mandatory**: Every database query MUST be scoped by `org_id`. Use `org-resolver.ts`. Never hardcode.
- **Aesthetics First**: Premium glassmorphic/vibrant theme. Navy `#1b3a6b`, Gold `#f5a623`, Amber `#e8940a`, Cream `#fef8ec`.
- **SOAP Methodology**: Journaling must adhere to Scripture, Observation, Application, Prayer protocol.
- **Admin Security**: Shepherd and Pastor dashboards must have role-based checks. MFA for strategic layer.
- **Surgical changes only**: Single-file edits with verification after each change. Multi-file sweeps cause cascading regressions (documented history on public website).
- **Screenshot verification**: Desktop Chrome at minimum 1280px after any UI change to public routes.
- **Inline styles for dark components**: Use inline styles on dark-island public components rather than CSS class overrides to prevent light-mode CSS conflicts.
- **Commit at stable checkpoints**: Always `npx tsc --noEmit` before committing. Zero errors required.

---

## Common Commands

| Purpose | Command |
|---------|---------|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Post-Build | `npm run postbuild` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
| Local MCP | `npx tsx src/mcp-server/index.ts` |
| Deploy Edge Function | `supabase functions deploy [name] --project-ref dapxrorkcvpzzkggopsa` |
| Set Supabase secret | `supabase secrets set KEY=value` |
| Check hardcoded GUIDs | `grep -rn "fa547adf-f820-412f-9458-d6bade11517d" src/ --include="*.ts" --include="*.tsx" \| grep -v "org-resolver.ts"` |

---

## Skills

| # | Skill | Trigger | Purpose | Status |
|---|-------|---------|---------|--------|
| 1 | `create_feature_module` | "Create a new [name] module" | Scaffold new features with auto-save and session management | ✅ Updated |
| 2 | `add_soap_journal` | "Add SOAP journal" | SOAP journal workflow with spiritual sentiment | ✅ Existing |
| 3 | `add_pi_widget` | "Add prophetic intelligence widget" | Prophetic Intelligence dashboard components | ✅ Existing |
| 4 | `add_rbac` | "Add role check to [component]" | Role-based access control implementation | ✅ Existing |
| 5 | `create_migration` | "Create migration for [table]" | Database migrations with RLS | ✅ Existing |
| 6 | `brevo_newsletter` | "Add newsletter signup" or "Send weekly briefing" | Email communications via Brevo | ✅ Existing |
| 7 | `vertex_ai_pil` | "Generate prophetic insight for [topic]" or "Run PIL analysis" | AI insight generation via Gemini | ✅ Existing |
| 8 | `analytics_tracking` | "Track user [action]" or "Add analytics to [feature]" | User behavior tracking via AnalyticsService | ✅ Existing |
| 9 | `provision_ai_intelligence` | "Provision AI for [church]" | Manual or automated AI growth blueprint lifecycle | ✅ Existing |
| 10 | `onboarding_insight_dashboard` | "Add AI onboarding widget" | Real-time AI provisioning status | ✅ Existing |
| 11 | `magic_link_invitation` | "Send church invitation" | Magic link onboarding for new churches | ✅ Existing |
| 12 | `auto_save_form` | "Add auto-save to form" | Persistent form data across ecosystem | ✅ Existing |
| 13 | `session_heartbeat" | "Add session keep-alive" | Prevent session expiry during long tasks | ✅ Existing |
| 14 | `resolve_org_context` | "Add org context to [component]" | Wire `resolvePublicOrgId()` or `resolveAdminOrgId()` into a component | ✅ New |
| 15 | `ministry_insight_approval` | "Add insight approval UI" | Shepherd Dashboard approval gate for AI ministry insights | ✅ New |

---

## Phase 2 Roadmap (Next)

These items are approved for planning but not yet implemented:

| Item | Priority | Description |
|------|----------|-------------|
| **Hosting migration** | High | Move off GitHub Pages to unlock Server Actions and server-side `supabaseAdmin` on member app. Deferred due to cost. |
| **JWT claim drift hardening** | High | RLS must validate live `org_members`, not just JWT claims. JWT can drift if membership changes mid-session. |
| **`queryWithOrgScope` wrapper for MCP** | High | MCP server needs a wrapper that injects `org_id` into every query, replacing the current API key lookup pattern. |
| **Event idempotency** | Medium | Add `event_id` UUID to `system_event_outbox` to prevent duplicate processing. |
| **AI pipeline rate limiting** | Medium | Per-org rate limiting on Gemini calls to prevent quota exhaustion by a single tenant. |
| **Org context switching (server-validated)** | Medium | Multi-org admin switching must be server-validated, not just sessionStorage-based. |
| **File upload server-side org_id validation** | Medium | Storage uploads need server-side `org_id` check — currently client-validated only. |
| **Blockchain audit layer** | Low | Ethereum L2 (Base/Arbitrum) for immutable Merkle root audit logs. All timestamps must be UTC. |
