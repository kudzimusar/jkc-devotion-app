### Skill: Static Export Refactoring (SSG Compliance)
**Trigger:** *"Fix the static build error"* or *"Refactor for SSG compliance."*

**Steps:**
1.  **Dependency Audit**: Search for any `'use server'`, `headers()`, `cookies()`, or dynamic `await` calls that require a server runtime.
2.  **Client-Side Migration**: Move server-only logic into `TanStack Query` hooks or `useEffect` blocks to fetch data on the client.
3.  **Static Param Generation**: For dynamic path segments (e.g., `[day]`), implement `generateStaticParams()` in the parent `page.tsx`.
4.  **Fallback Logic**: Ensure all client-side data fetches have proper loading skeletons and error fallbacks.
5.  **Build Verification**: Run `npm run build` to confirm the project builds successfully with `output: 'export'`.

**Success Criteria:** 
- No "Server Actions are not supported with static export" errors during build.
- Dynamic routes are pre-rendered or handled gracefully on the client.

**Failure Handling:** 
- Identify the exact line triggering the build error. If the server-side dependency is unavoidable, document why it must remain server-side and propose an alternative hosting strategy.
