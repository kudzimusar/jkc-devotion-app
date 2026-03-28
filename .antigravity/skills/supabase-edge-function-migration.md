### Skill: Supabase Edge Function Migration (Static Hosting Compliance)

**Trigger:** *"The API route is 404"* or *"How do I handle backend logic on GitHub Pages?"*

**Context:** 
When deploying a Next.js app with `output: 'export'` (e.g., GitHub Pages), all API routes (`src/app/api/...`) are lost. Any dynamic logic involving secrets (like database admin keys or third-party APIs) must be relocated to a serverless environment.

**Decision Tree:**
- **Static Content**: Keep in Next.js.
- **Client-Side Auth/Data**: Use the Supabase JS SDK directly in the browser.
- **Admin/Secret Logic**: Migrate to **Supabase Edge Functions**.

**Migration Workflow:**
1.  **Extract Logic**: Move code from `src/app/api/.../route.ts` to `supabase/functions/[function-name]/index.ts`.
2.  **API Translation**:
    *   `NextResponse` → `Response`.
    *   `process.env` → `Deno.env.get`.
    *   `crypto` (Node) → `crypto` (Web/Deno standard).
3.  **CORS Setup**: Every Edge Function called from the browser MUST handle `OPTIONS` requests and return `Access-Control-Allow-Origin`.
4.  **Secrets Management**:
    ```bash
    supabase secrets set MY_API_KEY=xxx
    ```
5.  **Frontend Update**: Change the fetch URL.
    ```typescript
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/new-function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`, // Authenticate the user
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Required by Supabase
      },
      body: JSON.stringify(data)
    });
    ```

**Verification:**
- Test in a staging/local environment using `supabase functions serve`.
- Check browser **Network Tab** for successful pre-flight (OPTIONS) and response.
