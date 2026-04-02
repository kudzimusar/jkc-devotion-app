# Shepherd Dashboard & AI Assistant Stabilization Plan

## Phase 1: Infrastructure & Data Pipelines (COMPLETED ✅)
- [x] **Weekly Intelligence Sweep**: Deploy and schedule `weekly-intelligence-sweep` Edge Function via `pg_cron`.
- [x] **Data Integrity**: Verify `org_id` backfill for all `devotions` and `prophetic_insights`.
- [x] **Dashboard Sync**: Transition `ShepherdView` from mock data to live Supabase pipelines.
- [x] **Latency Tracking**: Implement performance monitoring for dashboard data loading.

## Phase 2: AI Service Hardening & Guest Access (COMPLETED ✅)
- [x] **Memoized Org Resolution**: Prevent redundant DB lookups for guests/admins in `org-resolver.ts`.
- [x] **Request Timeouts**: Implement `AbortController` or `Promise.race` in `AIService` to prevent 15s+ hangs.
- [x] **Diagnostic Logging**: Add `[AI] [GUEST]` labels to logs for production troubleshooting.
- [x] **Safe Context Injection**: Ensure `getContextForPersona` returns safe concierge defaults for non-auth users.

## Phase 3: UI/UX & Final Polish (IN PROGRESS ⏳)
- [x] **Metric Card Refactor**: Map all remaining indicators (Families, Alerts, Themes) to live data.
- [ ] **Accessibility Audit**: Verify ARIA labels for AI Assistant and Dashboard components.
- [ ] **Mobile Optimization**: Refine Shepherd Dashboard grid layouts for tablet view.
- [ ] **Final Security Review**: Perform cross-org data leak test via UI.

---
*Last Updated: 2026-04-01*
*Status: Stabilized. Pipeline Active. Intelligence Live. Database Hardened.*
