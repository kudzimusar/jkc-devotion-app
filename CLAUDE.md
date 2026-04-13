# Church OS — Claude Context File
# Read this before doing anything. Do not explore the codebase unless asked.

## What this project is
**Church OS**: An enterprise-grade, multi-tenant church management SaaS designed for the global church ecosystem. This platform is owned and built by **Shadreck Kudzanai Musarurwa**, CEO of **Church OS PVT LTD**.
Static export to GitHub Pages. Next.js + Supabase + Gemini AI.

## Critical architecture rules
- Static export = NO Server Actions in production, NO supabaseAdmin on client
- Mission Control / admin pages: use supabaseAdmin (server-side only)
- Member app / client components: use regular supabase client with RLS
- Edge Functions use GEMINI_API_KEY (never NEXT_PUBLIC_GEMINI_API_KEY)
- prophetic_insights and ai_ministry_insights are separate tables — never union them
- generateStaticParams required in every dynamic route layout

## JKC org ID
fa547adf-f820-412f-9458-d6bade11517d

## Documentation Integrity Rule (RELIGIOUS)
- **Living Document Policy**: Every new feature, strategic improvement, or architectural change MUST be documented in `PROJECT_CONTEXT.md` before the task is marked as complete.
- **Purpose**: This file is the source of truth for marketing documentation, investor appraisal, and architectural alignment. Failure to document = Task Incomplete.
- **Skills & Rules**: Also update the skills table and hardcoded rules in `PROJECT_CONTEXT.md` to reflect new capabilities.

## What is currently working (confirmed production)
- ChurchGPT live at /jkc-devotion-app/churchgpt/ (gemini-2.5-flash via Edge Function)
- Stripe checkout Edge Function deployed (supports SaaS Billing and Member Giving)
- Gemini sermon transcription & AI-worker (transcripts, summaries, key points)
- Watch Library with retention analytics (trackEvent every 30s)
- Spiritual Response System (Salvation, Prayer, Testimony, Membership)
- Member Journey & Milestone Sync (Master `profiles` synchronization)
- Junior Church (Guardian-child links & check-in flow)
- 12-Model PIL Engine (health sweeps, disengagement risk, geo-expansion)
- 5-Step Premium Onboarding (Theological DNA capture)
- COCE Engine (Brevo-integrated campaign dispatch)

## Open issues (priority order)
1. ChurchGPT identity hardening — must not capitulate when user dislikes Christianity
2. Chat persistence after page refresh
3. pastoral_notes 400 error (wrong foreign key hint in shepherd-view.tsx)
4. weekly-sweep Edge Function not deployed (cron: 0 21 * * 0)
5. super-admin dashboard RLS — verify super_admin bypass policies exist on all tables

## Key tables
- organizations (org_id is the tenant key everywhere)
- prophetic_insights (AI output — never touch ai_ministry_insights together)
- public_inquiries (public contact form submissions)
- communication_campaigns → dispatched via coce-dispatch Edge Function
- company_analytics (nightly aggregated metrics for super-admin)
- admin_ai_insights (unresolved platform alerts)

## How to work on this codebase
- One file, one fix per prompt. Never explore broadly.
- Always show the diff before applying.
- Never use supabaseAdmin in any "use client" component.
- Test with npm run build after every change.
- Shadreck handles terminal/implementation. Kudzie reviews and approves.
