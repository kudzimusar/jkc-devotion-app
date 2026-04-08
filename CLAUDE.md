# Church OS — Claude Context File
# Read this before doing anything. Do not explore the codebase unless asked.

## What this project is
Multi-tenant church management SaaS. Primary client: Japan Kingdom Church Tokyo (JKC).
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

## What is currently working (confirmed production)
- ChurchGPT live at /jkc-devotion-app/churchgpt/ (gemini-2.5-flash via Edge Function)
- Stripe checkout Edge Function deployed (needs STRIPE_SECRET_KEY secret set)
- Gemini sermon transcription in ai-worker Edge Function
- Settings brand save writes to organizations table
- Pastor HQ finance chart pulls from vw_financial_momentum

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
