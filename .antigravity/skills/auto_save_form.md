# Skill: Auto-Save Form

**Trigger:** "Add auto-save to form" or "Make form data persistent"

**Purpose:** Automatically save form progress to localStorage with 7-day expiry

**Implementation Steps:**

1. Import `useAutoSave` from `@/hooks/useAutoSave`
2. Define unique `formType` (e.g., `'onboarding'`, `'journal_entry'`)
3. Pass form data and optional callbacks
4. Add `RestorePrompt` component to show when saved data exists
5. Call `clearSaved()` on successful submission

**Success Criteria:** Form data persists through page refresh; user can restore on next visit

**Failure Handling:** Silent fail on localStorage errors; no user disruption
