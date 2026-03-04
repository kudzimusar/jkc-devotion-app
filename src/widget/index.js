const TEMPLATE = document.createElement("template");
// HTML and CSS will be injected here.
TEMPLATE.innerHTML = `
<style>
  :host {
    display: block;
    font-family: var(--tl-font-family, system-ui, -apple-system, sans-serif);
    --primary: var(--tl-primary, #b59f77);
    --primary-light: color-mix(in srgb, var(--primary) 15%, transparent);
    --bg-surface: var(--tl-bg-surface, #ffffff);
    --text-main: var(--tl-text, #111827);
    --text-muted: color-mix(in srgb, var(--text-main) 60%, transparent);
    --border-radius: var(--tl-border-radius, 1.5rem);
    --widget-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --bg-surface: var(--tl-bg-surface-dark, #18181b);
      --text-main: var(--tl-text-dark, #fafafa);
      --widget-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
    }
  }

  .tl-widget-container {
    background: var(--bg-surface);
    color: var(--text-main);
    border-radius: var(--border-radius);
    padding: 2rem;
    box-shadow: var(--widget-shadow);
    border: 1px solid color-mix(in srgb, var(--text-main) 10%, transparent);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    max-width: var(--tl-max-width, 600px);
    margin: 0 auto;
  }

  /* Decorative Glow */
  .tl-glow {
    position: absolute;
    top: -50px;
    right: -50px;
    width: 150px;
    height: 150px;
    background: var(--primary);
    filter: blur(80px);
    opacity: 0.15;
    pointer-events: none;
  }

  /* Skeleton Loading */
  .tl-skeleton {
    animation: pulse 1.5s infinite ease-in-out;
    background: color-mix(in srgb, var(--text-main) 10%, transparent);
    border-radius: 4px;
    height: 1em;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .badge {
    display: inline-block;
    background: var(--primary-light);
    color: var(--primary);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }

  .title {
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.2;
    margin: 0 0 1.5rem;
    font-family: serif;
    font-style: italic;
    color: var(--primary);
  }

  .section-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .scripture-box {
    margin-bottom: 1.5rem;
  }

  .scripture-text {
    font-size: 1.125rem;
    line-height: 1.6;
    margin: 0;
  }

  .declaration-box {
    background: var(--primary-light);
    border: 1px dashed color-mix(in srgb, var(--primary) 30%, transparent);
    border-radius: calc(var(--border-radius) / 2);
    padding: 1.5rem;
    text-align: center;
  }

  .declaration-text {
    font-size: 1.25rem;
    font-weight: 700;
    font-style: italic;
    margin: 0;
  }

  .version-toggle {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
  }
  .version-toggle:hover {
    text-decoration: underline;
  }

  /* Messages (Error/Offline) */
  .status-message {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .sk-badge { width: 120px; height: 1.5rem; border-radius: 999px; margin-bottom: 1rem; }
  .sk-title { width: 80%; height: 2rem; margin-bottom: 1.5rem; }
  .sk-text { width: 100%; height: 1rem; margin-bottom: 0.5rem; }
  .sk-text-short { width: 60%; height: 1rem; margin-bottom: 1.5rem; }
  .sk-box { width: 100%; height: 80px; border-radius: calc(var(--border-radius) / 2); }

  #content, #loading, #error {
    display: none;
  }
</style>

<div class="tl-widget-container">
  <div class="tl-glow"></div>
  
  <div id="loading">
    <div class="tl-skeleton sk-badge"></div>
    <div class="tl-skeleton sk-title"></div>
    <div class="tl-skeleton sk-text"></div>
    <div class="tl-skeleton sk-text"></div>
    <div class="tl-skeleton sk-text-short"></div>
    <div class="tl-skeleton sk-box"></div>
  </div>

  <div id="error" class="status-message">
    <span id="error-text">Service Unavailable</span>
  </div>

  <div id="content">
    <div class="badge" id="theme-badge">Week X: Theme</div>
    <h3 class="title" id="devotion-title">"Title Placeholder"</h3>

    <div class="scripture-box">
      <div class="section-label">
        <span>Scripture Focus</span>
        <button class="version-toggle" id="version-btn">EN (NASB)</button>
      </div>
      <p class="scripture-text" id="scripture-text">Scripture content will load here.</p>
    </div>

    <div class="declaration-box">
      <div class="section-label" style="justify-content: center;">Daily Declaration</div>
      <p class="declaration-text" id="declaration-text">"I declare..."</p>
    </div>
  </div>
</div>
`;

class TransformedLifeWidget extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "closed" });
    this._shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

    this._uiLoading = this._shadowRoot.getElementById("loading");
    this._uiError = this._shadowRoot.getElementById("error");
    this._uiContent = this._shadowRoot.getElementById("content");

    this._elBadge = this._shadowRoot.getElementById("theme-badge");
    this._elTitle = this._shadowRoot.getElementById("devotion-title");
    this._elScripture = this._shadowRoot.getElementById("scripture-text");
    this._elDeclaration = this._shadowRoot.getElementById("declaration-text");
    this._elVersionBtn = this._shadowRoot.getElementById("version-btn");
    this._elErrorText = this._shadowRoot.getElementById("error-text");

    this._apiKey = "";
    this._lang = "EN";
    this._devotionData = null;

    this._elVersionBtn.addEventListener("click", () => {
      this._lang = this._lang === "EN" ? "JP" : "EN";
      this._renderContent();
    });
  }

  connectedCallback() {
    this._apiKey = this.getAttribute("data-api-key") || "";
    this._lang = this.getAttribute("data-lang") || "EN";

    if (!this._apiKey) {
      this._showError("Missing API Key. Provide data-api-key attribute.");
      return;
    }

    this._loadDevotion();
  }

  async _loadDevotion() {
    this._showLoading();

    let tz = "UTC";
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) { }

    // YYYY-MM-DD local format
    const d = new Date();
    const nowLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const cacheKey = `tl_devotion_${nowLocal}`;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        this._devotionData = JSON.parse(cached);
        this._renderContent();
        this._fetchFromApi(tz, cacheKey, false);
        return;
      }
    } catch (e) {
      console.warn("TL Widget: LocalStorage access denied or error", e);
    }

    await this._fetchFromApi(tz, cacheKey, true);
  }

  async _fetchFromApi(tz, cacheKey, isPrimaryWait) {
    if (!navigator.onLine) {
      if (isPrimaryWait) this._showError("Network Offline. Reconnecting...");
      return;
    }

    try {
      const host = this.getAttribute("data-api-host") || window.location.origin;
      const apiUrl = new URL("/api/v1/devotion/today", host);
      apiUrl.searchParams.set("timezone", tz);

      const response = await fetch(apiUrl.toString(), {
        headers: {
          "X-API-KEY": this._apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Key Validation Error - Service Unavailable");
        }
        if (response.status === 402) {
          try {
            const respBody = await response.json();
            throw new Error(respBody.error || "Content Paused");
          } catch (e) {
            throw new Error("Content Paused");
          }
        }
        throw new Error("Service Unavailable");
      }

      const data = await response.json();
      this._devotionData = data;

      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) { }

      if (isPrimaryWait || this._uiLoading.style.display === "block") {
        this._renderContent();
      }

    } catch (error) {
      if (isPrimaryWait) {
        this._showError(error.message);
      }
    }
  }

  _showLoading() {
    this._uiLoading.style.display = "block";
    this._uiContent.style.display = "none";
    this._uiError.style.display = "none";
  }

  _showError(msg) {
    this._uiLoading.style.display = "none";
    this._uiContent.style.display = "none";
    this._uiError.style.display = "block";
    this._elErrorText.textContent = msg;
  }

  _renderContent() {
    if (!this._devotionData) return;

    this._uiLoading.style.display = "none";
    this._uiError.style.display = "none";
    this._uiContent.style.display = "block";

    const d = this._devotionData;
    this._elBadge.textContent = `Week ${d.week || 1}: ${d.week_theme || d.theme || 'Devotion'}`;
    this._elTitle.textContent = `"${d.title || 'Untitled'}"`;
    this._elDeclaration.textContent = `"${d.declaration || '...'}"`;

    const versionLabel = this._lang === "EN" ? "EN (NASB)" : "JP (JBS)";
    this._elVersionBtn.textContent = versionLabel;

    this._elScripture.innerHTML = `
      <strong style="color:var(--primary); font-size:1.1em">${d.scripture || ''}</strong><br/><br/>
      <span style="opacity:0.8; font-size:0.9em">
      ${this._lang === "EN"
        ? "Open your Bible to meditate on today's scripture."
        : "今日の黙想のために、聖書を開いてください。"}
      </span>
    `;
  }
}

if (!customElements.get("transformed-life-widget")) {
  customElements.define("transformed-life-widget", TransformedLifeWidget);
}
