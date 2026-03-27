# Project Context

## Overview
- **Purpose**: A comprehensive, AI-driven spiritual infrastructure (Church OS) for Japan Kingdom Church (JKC), designed for tracking daily spiritual maturity, journaling, and providing pastoral leadership with AI-powered "Prophetic Intelligence."
- **Target users**: Church members (Bilingual congregation), Ministry Leaders, Pastors, and Church Administrators.

## Tech Stack
| Category | Technology | Version | Detail |
|----------|------------|---------|--------|
| Frontend | Next.js (App Router) | 16.1.6 | Static Export (`output: 'export'`) |
| Library | React | 19.2.3 | Client-side hydration focus |
| Database | Supabase (PostgreSQL) | Latest | RLS-enforced multi-tenancy |
| AI Engine | Vertex AI / Gemini | SDK ^0.24 | GCP Service Account / Client-side fetch |
| Comm / Mail | Brevo (Sendinblue) | API v3 | Strategic Newsletters & Victory Briefings |
| Analytics | Custom (Supabase) | `AnalyticsService` | Behavioral tracking & PIL Feed ingestion |
| UI Strategy | Stitch / Radix | Latest | Functional "stitching" of design tokens |
| State | TanStack React Query | 5.90.21 | Server-state caching |
| Styling | Tailwind CSS 4 | ^4.0.0 | Premium Glassmorphism & Animations |
| Hosting | GitHub Pages | - | Deployed at `kudzimusar.github.io/jkc-devotion-app/` |

## Architecture
- **Structure**: 
  - `src/app`: Routing and layout logic using the App Router.
  - `src/lib`: Core business logic, backend services (PIL Engine, AI Service, Bible API).
  - `src/components`: Reusable UI components (Feature-based and Common).
  - `src/hooks`: Data fetching and authentication logic hooks.
  - `supabase/`: Database schema, migrations, and RLS policies.
- **Data flow**: Client-side data fetching via React Query and Supabase standard clients. Administrative dashboards (Shepherd/Pastor HQ) often bypass RLS via `supabaseAdmin` or secure Server Action patterns (limited by static export) to provide aggregate analytics.
- **Key patterns**: Service-layer pattern in `src/lib`, feature-scoping via `org_id` for multi-tenancy, and "Prophetic Intelligence" aggregation for pastoral care.

## Multi-Tenant SaaS Architecture

Church OS is a **multi-tenant platform** where each denomination is a separate tenant:

| Concept | Database | Description | Example |
|---------|----------|-------------|---------|
| **Denomination (Tenant)** | `organizations` table, unique `org_id` | A church/denomination that subscribes to Church OS | JKC Church, Grace Fellowship, City Harvest |
| **Branch (Sub-Entity)** | `branch_id` or location field within same org | A campus or location under a denomination | JKC Tokyo, JKC Osaka (same org_id) |
| **Member** | `profiles` table with `org_id` | Individual person belonging to a denomination | John Doe (member of JKC) |
| **Pastor/Admin** | `profiles` with role = pastor/owner | Leader who oversees a denomination | Pastor Smith (oversees JKC) |

### Two Distinct Sign-Up Flows

**Flow 1: Church Sign-Up (SaaS Onboarding)**
- **Purpose:** A new denomination registers to use Church OS
- **Location:** `/onboarding` route
- **What happens:**
  - Creates new row in `organizations` table
  - Creates first user with role = 'owner' or 'pastor'
  - This denomination becomes a tenant with its own org_id
- **Example:** "Grace Fellowship" signs up to use Church OS
- **AI Provisioning (Prophetic Intelligence Layer):**
  - **Step 1 (DNA Collection):** Church shares "Theological DNA" (Tradition, Emphasis, Worship Style, Size).
  - **Step 2 (DNA Storage):** Saved to `organization_intelligence` table with status `pending`.
  - **Step 3 (AI Generation):** `provision-church-intelligence` Edge Function triggered via API.
  - **Step 4 (Gemini Insight):** AI generates "Growth Blueprint" based on DNA.
  - **Step 5 (Brevo Delivery):** Pastor receives "First Prophetic Insight" via email.
  - **Step 6 (Dashboard Activation):** `AIOnboardingStatus` widget updates to `completed`, revealing the blueprint in the Pastor HQ.

**Flow 2: Member Sign-Up**
- **Purpose:** An individual joins an existing denomination
- **Location:** `AuthModal` or `/login` with church selection
- **What happens:**
  - User selects existing organization
  - Creates profile with that org_id
  - Role = 'member' or 'guest'
- **Example:** New attendee joins JKC Church

### Isolation Rules

- Every database query MUST include `org_id` filtering
- RLS policies enforce `org_id = auth.jwt()->>'org_id'`
- Pastors/admins can only see data within their org_id
- Members can only see their own data within their org_id
- Branches (sub-entities) share the same org_id and are managed via branch_id

## AI-First Onboarding & Intelligence Provisioning

### Onboarding Flow Architecture

Church OS features a **standalone, AI-first onboarding wizard** decoupled from the public website:

| Step | Name | Purpose | Key Fields |
|------|------|---------|------------|
| 1 | Church Identity | Collect basic church information | Church name, contact email, subdomain, logo upload |
| 2 | Intelligence DNA | Capture theological profile for AI calibration | Tradition, Ministry Emphasis, Worship Style, Size, Language |
| 3 | Plan & Summary | Confirm and launch | Plan selection, summary review, AI badge |

### Theological DNA Fields

The following fields are stored in `organization_intelligence` table and used to calibrate the Prophetic Intelligence Layer:

| Field | Options | Purpose |
|-------|---------|---------|
| `theological_tradition` | Pentecostal, Reformed, Evangelical, Baptist, Anglican, Non-Denominational, Other | Denominational context for AI insights |
| `ministry_emphasis` | Evangelism-led, Discipleship-focused, Social-Justice, Scripture-intensive, Worship-led, Other | Strategic focus areas |
| `worship_style` | Modern/Contemporary, Traditional/Hymnal, Blended, Spontaneous/Spirit-led, Other | Cultural context for recommendations |
| `congregation_size` | <100, 100-500, 500-2000, 2000+ | Scale-appropriate insights |
| `primary_language` | English, Japanese, Bilingual, Korean, Portuguese, Spanish, Other | Multilingual support |

### Session Management & Data Persistence

To prevent data loss during onboarding and across all forms, Church OS implements:

| Feature | Purpose | Implementation |
|---------|---------|----------------|
| **Auto-Save** | Automatically saves form progress | `useAutoSave` hook with 1-second debounce, 7-day expiry |
| **Session Heartbeat** | Keeps session alive during activity | Refreshes session every 10 minutes on user activity |
| **Session Expiry Warning** | Warns users before session expires | Displays warning at 5 minutes remaining |
| **Magic Link Invitations** | Allows admins to invite new churches | 48-hour expiry links via `/api/onboarding/invite` |
| **Form Recovery** | Restores saved data after session loss | Restore prompt shows time since last save |

### Storage & Assets

| Bucket | Purpose | RLS Policy |
|--------|---------|------------|
| `church-logos` | Church branding images | Users can upload only to their org_id |

### AI Provisioning Pipeline

When a new church completes onboarding:

1. **Organization Created**: Row in `organizations` with logo URL
2. **Intelligence DNA Saved**: Row in `organization_intelligence` with all theological fields
3. **API Key Generated**: For MCP access
4. **Edge Function Triggered**: `provision-church-intelligence` called with DNA data
5. **AI Calibration**: Gemini Pro generates first "Growth Blueprint" insight
6. **Welcome Email**: Sent via Brevo with AI-generated insight
7. **Dashboard Widget**: Shows provisioning status in real-time

### Database Schema Additions

```sql
-- Organization intelligence table
CREATE TABLE organization_intelligence (
    org_id UUID PRIMARY KEY REFERENCES organizations(id),
    theological_tradition TEXT NOT NULL DEFAULT 'Non-Denominational',
    ministry_emphasis TEXT NOT NULL DEFAULT 'Discipleship-focused',
    worship_style TEXT NOT NULL DEFAULT 'Blended',
    congregation_size TEXT NOT NULL DEFAULT '100-500',
    primary_language TEXT NOT NULL DEFAULT 'Bilingual',
    ai_provisioning_status TEXT DEFAULT 'pending',
    welcome_insight_generated BOOLEAN DEFAULT false,
    ai_last_calibrated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Onboarding invitations tracking
CREATE TABLE onboarding_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    church_name TEXT,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'pending',
    completed_at TIMESTAMPTZ
);
```

### Design System: Ethereal Sanctuary

The onboarding experience uses a custom design system:

| Token | Value | Usage |
|-------|-------|-------|
| Primary Dark | `#0a0a0a` | Background |
| Glass Card | `bg-white/10 backdrop-blur-xl` | Form containers |
| Accent Cyan | `#06b6d4` | Primary buttons, focus states |
| Accent Gold | `#fbbf24` | Secondary accents, AI badge |
| Ghost Border | `border-white/20` | Subtle card borders |
| Ambient Aura | `shadow-[0_0_15px_rgba(6,182,212,0.15)]` | Hover effects |

### Fonts
- **Headlines**: Manrope (variable font, weight 500-700)
- **Body**: Inter (weight 400-500)


## Conventions
- **File naming**: Components use `PascalCase.tsx`, services/utils use `kebab-case.ts`.
- **Component structure**: Functional components with arrow functions or standard declarations, typically using `export default`.
- **Import order**: External libraries followed by internal absolute imports (e.g., `@/components`, `@/lib`).
- **Styling approach**: Tailwind CSS 4 utility classes for layout, Framer Motion for animations, and CSS variables in `globals.css` for the design system.
- **State management**: React Query handles server state (cache/fetching), while `useState`/`useEffect` handles local UI interactions.
- **API calls**: Direct Supabase wrapper calls defined in `src/lib` services.
- **Error handling**: `Sonner` toast notifications for user-facing errors, try/catch patterns in services.

## Common Commands
| Purpose | Command |
|---------|---------|
| Dev | `npm run dev` |
| Build | `npm run build` (Includes widget compilation) |
| Post-Build | `npm run postbuild` (Copies index to 404 for SPA routing) |
| Lint | `npm run lint` |
| Local MCP | `npx tsx src/mcp-server/index.ts` |
## Skills

| # | Skill | Trigger | Purpose | Status |
|---|-------|---------|---------|--------|
| 1 | `create_feature_module` | "Create a new [name] module" | Scaffold new features with auto-save and session management | ✅ Updated |
| 2 | `add_soap_journal` | "Add SOAP journal" | SOAP journal workflow with spiritual sentiment | ✅ Existing |
| 3 | `add_pi_widget` | "Add prophetic intelligence widget" | Prophetic Intelligence dashboard components | ✅ Existing |
| 4 | `add_rbac` | "Add role check to [component]" | Role-based access control implementation | ✅ Existing |
| 5 | `create_migration` | "Create migration for [table]" | Database migrations with RLS | ✅ Existing |
| 6 | `brevo_newsletter` | "Add newsletter signup" or "Send weekly briefing" | Email communications via Brevo | ✅ Existing |
| 7 | `vertex_ai_pil` | "Generate prophetic insight for [topic]" or "Run PIL analysis" | AI insight generation via Vertex AI | ✅ Existing |
| 8 | `analytics_tracking` | "Track user [action]" or "Add analytics to [feature]" | User behavior tracking via AnalyticsService | ✅ Existing |
| 9 | `provision_ai_intelligence` | "Provision AI for [church]" | Manual or automated AI growth blueprint lifecycle | ✅ New |
| 10 | `onboarding_insight_dashboard` | "Add AI onboarding widget" | Real-time AI provisioning status | ✅ New |
| 11 | `magic_link_invitation` | "Send church invitation" | Magic link onboarding for new churches | ✅ New |
| 12 | `auto_save_form` | "Add auto-save to form" | Persistent form data across ecosystem | ✅ New |
| 13 | `session_heartbeat` | "Add session keep-alive" | Prevent session expiry during long tasks | ✅ New |

## Known Constraints & Gotchas
- **Static Export limitations**: The app uses `output: 'export'`, meaning Server Actions and standard API routes are unavailable in production. Logic typically handled by Server Actions must be routed through Edge Functions or secure client-side handlers with strict RLS.
- **RLS Complexity**: Managing multi-tenant data isolation while allowing pastors aggregate view of "Prophetic Data" requires complex RLS policies and `org_id` scoping in every query.
- **Hydration & PWA**: Due to `next-pwa` and static export, hydration timing and 404 handling (handled in `postbuild`) are critical for functionality.

## Project-Specific Rules
- **Multi-tenancy**: Every database query MUST be scoped by `org_id`.
- **Aesthetics First**: Designs must be premium, using the established glassmorphic/vibrant theme defined in the operations manual.
- **SOAP Methodology**: Journaling features must strictly adhere to the Scripture, Observation, Application, Prayer protocol.
- **Admin Security**: Shepherd and Pastor dashboards must have role-based MFA checks.
