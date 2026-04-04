# ChurchGPT — Standalone Public Page
**Phase 1 Spec | Church OS | April 2026**

---

## What This Is

A standalone public-facing ChurchGPT experience that lives at `/churchgpt` — completely separate from the JKC member dashboard at `/jkc-devotion-app/churchgpt/`.

This is the product page. The one users find, try, and sign up for. It has no JKC branding, no Church OS navigation, no member sidebar. It looks and feels like its own product — because it is.

---

## URL Structure

```
/churchgpt                    ← Landing page + guest chat
/churchgpt/chat               ← Full chat (authenticated)
/churchgpt/login              ← Sign in
/churchgpt/signup             ← Create account
```

All of these are static export compatible — they render as HTML files on GitHub Pages.

---

## Two User Types

### Guest (no account)
- Lands on `/churchgpt`
- Can send up to 5 messages without signing up
- After 5 messages: soft prompt to create an account
- Prompt is warm, not a wall: "You've been chatting for a bit — create a free account to keep your conversation history and pick up where you left off."
- Can dismiss and keep chatting for 2 more messages (total 7)
- After 7: hard prompt — must sign up to continue
- Guest messages are stored in localStorage only — not Supabase

### Authenticated User (free account)
- Signs up with email + password directly — no church affiliation required
- Full chat history saved to Supabase
- No message limit in Phase 1
- Church members (JKC etc.) can log in with their existing Church OS account — same Supabase project, same auth

---

## Page Design

### `/churchgpt` — Landing + Guest Chat

This page has two sections that coexist:

**Top hero (above the fold):**
```
[Gold cross logo]

ChurchGPT
Your Christian AI Companion

The AI that knows the Bible, loves people,
and never pretends to be neutral about Jesus.

[Try ChurchGPT Free →]     [Sign In]
```

**Below hero — the chat interface loads immediately:**
- Same ChurchGPT chat UI as the member version
- Guest mode — no sidebar (no history to show)
- A subtle banner at the top of the chat: "You're chatting as a guest · Sign up to save your history"
- Message counter shown subtly after message 3: "3 of 7 guest messages used"

### `/churchgpt/chat` — Authenticated Full Experience
- Full sidebar with conversation history
- Same design as the member version
- No JKC branding anywhere
- Header: just "ChurchGPT" logo + user avatar + sign out

### `/churchgpt/login` and `/churchgpt/signup`
- Clean, minimal pages
- ChurchGPT branding only
- Email + password fields
- "Or continue as guest →" link on signup page
- On successful auth: redirect to `/churchgpt/chat`

---

## Route Group Architecture

```
src/app/
  (churchgpt-public)/           ← New route group — own layout
    layout.tsx                  ← No member nav, no JKC branding
    churchgpt/
      page.tsx                  ← Landing + guest chat
      chat/
        page.tsx                ← Authenticated chat
      login/
        page.tsx                ← Login form
      signup/
        page.tsx                ← Signup form
```

The `(churchgpt-public)` route group has its own layout that is completely isolated from the `(member)` layout. No shared navigation, no shared context.

---

## Guest Message Tracking

```typescript
// localStorage keys
const GUEST_MESSAGE_COUNT_KEY = 'churchgpt_guest_count'
const GUEST_MESSAGES_KEY = 'churchgpt_guest_messages'

// Thresholds
const SOFT_PROMPT_THRESHOLD = 5   // show soft signup prompt
const HARD_LIMIT = 7               // must sign up to continue
```

Guest messages are stored in localStorage as a JSON array so they can be shown in the chat. When a guest signs up, offer to import their guest conversation into their new account.

---

## Auth Flow

Uses the existing Supabase project (`dapxrorkcvpzzkggopsa`). No new Supabase project needed.

```typescript
// Signup
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      source: 'churchgpt_public',  // track where they signed up from
      is_church_member: false
    }
  }
})
// On success: redirect to /churchgpt/chat

// Login
const { error } = await supabase.auth.signInWithPassword({ email, password })
// On success: redirect to /churchgpt/chat

// Sign out
await supabase.auth.signOut()
// Redirect to /churchgpt
```

---

## Edge Function Usage

The public ChurchGPT page calls the same `churchgpt-gateway` Edge Function as the member version. The payload is slightly different — no `orgId` for guests:

```typescript
// Guest payload
{
  messages: [...],
  sessionType: 'general',
  isGuest: true
}

// Authenticated user payload  
{
  messages: [...],
  sessionType: selectedType,
  userId: user.id,
  isGuest: false
}
```

The Edge Function must handle missing `orgId` gracefully — it already does this since the persistence fix.

---

## Components Needed

### New components (create fresh):
- `PublicChurchGPTLayout` — the root layout for the public route group
- `PublicChurchGPTHero` — the landing page hero section
- `PublicChurchGPTChat` — guest-aware chat (wraps existing ChurchGPTChat logic)
- `GuestPrompt` — the soft/hard signup prompt overlay
- `PublicChurchGPTAuth` — shared login/signup form component

### Reuse from existing (do not duplicate):
- `useChurchGPT` hook — with guest mode support added
- `ChurchGPTMessage` — message bubble component
- `ChurchGPTInput` — input bar
- The Edge Function — same one

---

## Static Export Compatibility

Since Church OS deploys as a static export to GitHub Pages, these routes must be statically renderable:

```typescript
// Each page.tsx in (churchgpt-public) must NOT use:
// - cookies() 
// - Server Actions
// - getServerSideProps

// All auth and data fetching must happen client-side
// using the Supabase client (createBrowserClient)
```

---

## What This Is NOT

- Not a replacement for `/jkc-devotion-app/churchgpt/` — that remains for church members
- Not a paid product yet — Phase 1 is entirely free
- Not a separate deployment — same GitHub Pages, same domain, just a new route
- Not JKC-branded — completely neutral ChurchGPT branding

---

## Definition of Done for Phase 1

- [ ] `/churchgpt` loads without a login — shows hero + guest chat
- [ ] Guest can send 5 messages before seeing signup prompt
- [ ] Soft prompt appears at message 5, hard limit at message 7
- [ ] `/churchgpt/signup` creates a real Supabase account
- [ ] `/churchgpt/login` signs in and redirects to `/churchgpt/chat`
- [ ] `/churchgpt/chat` shows full chat with sidebar history
- [ ] No JKC branding anywhere in the public route group
- [ ] `npm run build` passes with zero errors
- [ ] GitHub Actions goes green
