### Skill: add_pi_widget
**Trigger:** "Add prophetic intelligence widget for [metric]" or "Create dashboard widget showing [data]"

**Steps:**
1. Identify data source (journal entries, check-ins, prayer requests, etc.)
2. Create aggregation query in service layer with `org_id` filter
3. For pastor/shepherd views, ensure query bypasses row-level user restrictions while maintaining org isolation
4. Create widget component using existing dashboard layout patterns (glass card, gradient accents)
5. Use React Query for data fetching with appropriate cache settings
6. Add refresh button and loading states
7. If widget requires real-time updates, subscribe to Supabase Realtime channel
8. Add to appropriate dashboard grid (Pastor HQ, Shepherd Dashboard, etc.)

**Success Criteria:** Widget displays accurate aggregated data, updates on refresh, follows design system

**Failure Handling:** If aggregation requires complex SQL, create database view or edge function
