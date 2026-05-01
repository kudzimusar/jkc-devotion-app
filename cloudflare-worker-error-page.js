/**
 * Cloudflare Worker — ChurchGPT Error Fallback
 *
 * Deploy this in the Cloudflare Dashboard:
 *   Workers & Pages → Create Worker → paste this file → Deploy
 *   Then: Workers & Pages → your worker → Triggers → Add Route
 *   Route: ai.churchos-ai.website/*   (zone: ai.churchos-ai.website)
 *
 * What it does:
 *   1. Passes every request through to Vercel (origin) unchanged
 *   2. If origin returns 5xx OR the network call itself fails (timeout, 524)
 *      → returns the branded Church OS error page
 *   3. Everything else is returned exactly as Vercel sent it
 */

const BRANDED_ERROR_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChurchGPT — Temporarily Unavailable</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background-color: #0f1f3d;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      width: 100%;
      max-width: 460px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 48px 40px;
      text-align: center;
    }
    .label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #D4AF37;
      margin-bottom: 12px;
    }
    h1 { font-size: 26px; font-weight: 700; margin-bottom: 14px; line-height: 1.3; }
    .message {
      font-size: 14px;
      line-height: 1.7;
      color: rgba(255,255,255,0.5);
      margin-bottom: 28px;
    }
    .status-row {
      display: flex;
      justify-content: center;
      gap: 28px;
      margin-bottom: 32px;
    }
    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .dot {
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
    }
    .dot-green { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.35); color: #4ade80; }
    .dot-red   { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.35);  color: #f87171; }
    .ok  { color: #4ade80; font-weight: 700; }
    .err { color: #f87171; font-weight: 700; }
    .muted { color: rgba(255,255,255,0.3); }
    .divider { width: 40px; height: 1px; background: rgba(212,175,55,0.25); margin: 0 auto 28px; }
    .verse {
      font-size: 13px;
      font-style: italic;
      color: #D4AF37;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .verse cite {
      display: block;
      font-style: normal;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.07em;
      margin-top: 5px;
      opacity: 0.65;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      background: #D4AF37;
      color: #0f1f3d;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      margin-bottom: 12px;
    }
    .btn:hover { background: #c9a227; }
    .btn-outline {
      display: block;
      width: 100%;
      padding: 13px;
      background: transparent;
      color: rgba(255,255,255,0.4);
      font-size: 13px;
      font-weight: 600;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      text-decoration: none;
      margin-bottom: 12px;
    }
    .btn-outline:hover { color: rgba(255,255,255,0.75); border-color: rgba(255,255,255,0.22); }
    .status-link {
      display: block;
      font-size: 11px;
      color: rgba(255,255,255,0.25);
      text-decoration: none;
      margin-top: 4px;
    }
    .status-link:hover { color: #D4AF37; }
    .ray { margin-top: 24px; font-size: 10px; color: rgba(255,255,255,0.15); letter-spacing: 0.04em; }
    footer { margin-top: 36px; font-size: 11px; color: rgba(255,255,255,0.15); }
    footer a { color: rgba(255,255,255,0.25); text-decoration: none; }
    footer a:hover { color: #D4AF37; }
    @media (max-width: 500px) { .card { padding: 36px 20px; } h1 { font-size: 22px; } }
  </style>
</head>
<body>
  <div class="card">
    <img src="https://ai.churchos-ai.website/churchgpt-logo.png"
         alt="ChurchGPT" width="80"
         style="display:block;margin:0 auto 24px;width:80px;height:auto;filter:brightness(0) invert(1);" />

    <p class="label">ChurchGPT &nbsp;·&nbsp; Church OS</p>
    <h1>We&rsquo;ll be right<br />back with you</h1>
    <p class="message">
      Our servers are temporarily unavailable. The team is aware
      and working to restore service. Please try again in a few minutes.
    </p>

    <div class="status-row">
      <div class="status-item">
        <div class="dot dot-green">✓</div>
        <span class="muted">Cloudflare</span>
        <span class="ok">Working</span>
      </div>
      <div class="status-item">
        <div class="dot dot-red">✕</div>
        <span class="muted">Host</span>
        <span class="err">Error</span>
      </div>
    </div>

    <div class="divider"></div>

    <p class="verse">
      &ldquo;Be still, and know that I am God.&rdquo;
      <cite>— Psalm 46:10</cite>
    </p>

    <button class="btn" onclick="window.location.reload()">Try again</button>
    <a href="https://stats.uptimerobot.com/DaiCtNKrmS" target="_blank" class="btn-outline">
      Check live service status &rarr;
    </a>
    <a href="mailto:hello@churchos-ai.website" class="status-link">Contact support</a>
  </div>

  <footer>
    &copy; 2026 Church OS PVT LTD &nbsp;&middot;&nbsp;
    <a href="https://ai.churchos-ai.website/churchgpt">ChurchGPT</a>
  </footer>
</body>
</html>`

export default {
  async fetch(request, env, ctx) {
    try {
      const response = await fetch(request)

      // Origin returned a server error — show branded page
      if (response.status >= 500) {
        return new Response(BRANDED_ERROR_PAGE, {
          status: response.status,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }

      // Everything else — pass through unchanged
      return response

    } catch (_err) {
      // Network/timeout failure — origin completely unreachable
      return new Response(BRANDED_ERROR_PAGE, {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }
  },
}
