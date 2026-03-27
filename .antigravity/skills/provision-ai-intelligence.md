---
name: provision_ai_intelligence
description: Manual or automated AI growth blueprint lifecycle for new organizations.
---

# Provision AI Intelligence Skill

Use this skill when you need to initialize or re-calculate the AI growth blueprint for an organization. This process leverages the **Theological DNA** of a church to generate a strategic "First Prophetic Insight."

## Workflow

### 1. Collect Theological DNA
Ensure the `organization_intelligence` table has the required fields for the organization (`org_id`):
- `theological_tradition`
- `ministry_emphasis`
- `worship_style`
- `congregation_size`
- `primary_language`

### 2. Trigger Provisioning
Call the `provision-church-intelligence` Edge Function via the API or a secure client-side handler.

**Example Fetch Call:**
```typescript
const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/provision-church-intelligence`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ 
        record: { 
            org_id: 'ORG_UUID',
            theological_tradition: '...',
            // ... (other DNA fields)
        } 
    })
});
```

### 3. Verification Steps
- **Database**: Check the `organization_intelligence` table for `ai_provisioning_status = 'completed'`.
- **Insight**: Verify a new record exists in `prophetic_insights` with `category = 'Growth Blueprint'`.
- **Email**: Check the logs or Brevo dashboard for the successful delivery of the "Your AI Strategy is Ready" email.

## Key Components
- **Edge Function**: `supabase/functions/provision-church-intelligence/index.ts`
- **Dashboard Widget**: `src/components/dashboard/AIOnboardingStatus.tsx`
- **Registration Hook**: `src/app/api/onboarding/register/route.ts`

## Design Notes
The AI provisioning status should always be visible to the pastor in the **Strategic Center** (Pastor HQ) until the first insight is generated. Use premium animations (via `framer-motion`) to convey the "calibrating" state of the AI engine.
