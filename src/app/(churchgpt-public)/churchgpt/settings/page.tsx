'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { PublicChurchGPTSidebar } from "@/components/churchgpt-public/PublicChurchGPTSidebar"
import { PanelLeft, Loader2, Sun, Moon } from "lucide-react"
import { useCGPTTheme } from "@/hooks/useCGPTTheme"

const PREF_KEY = 'cgpt_prefs'

function loadPrefs() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}') } catch { return {} }
}
function savePrefs(prefs: Record<string, any>) {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
}

export default function ChurchGPTSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [prefs, setPrefs] = useState<Record<string, any>>({})
  const { theme, toggle: toggleTheme } = useCGPTTheme()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/churchgpt/login'); return }
      setUser(user)
      setPrefs(loadPrefs())
      setLoading(false)
    })
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false)
  }, [])

  const setPref = (key: string, val: any) => {
    const next = { ...prefs, [key]: val }
    setPrefs(next)
    savePrefs(next)
  }

  const Toggle = ({ prefKey, defaultOn = false }: { prefKey: string; defaultOn?: boolean }) => {
    const on = prefs[prefKey] ?? defaultOn
    return (
      <button
        className={`cgpt-toggle ${on ? 'on' : ''}`}
        onClick={() => setPref(prefKey, !on)}
        aria-label="toggle"
      />
    )
  }

  if (loading) {
    return (
      <div className="cgpt-loading-screen">
        <Loader2 className="cgpt-loader" />
      </div>
    )
  }

  const tabs = ['General', 'Appearance', 'Notifications', 'Integrations', 'Privacy']

  return (
    <div className={`cgpt-page-shell ${theme === 'light' ? 'cgpt-light' : ''}`}>
      <div className={`cgpt-sidebar-wrap ${sidebarOpen ? '' : 'cgpt-sidebar-hidden'}`}>
        <PublicChurchGPTSidebar
          conversations={[]}
          activeId={null}
          onSelect={() => {}}
          onDelete={() => {}}
          onNewChat={() => router.push('/churchgpt/chat')}
          user={user}
        />
      </div>
      {sidebarOpen && (
        <div className="cgpt-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="cgpt-page-main">
        <div className="cgpt-page-topbar">
          <button className="cgpt-icon-btn" onClick={() => setSidebarOpen(v => !v)}>
            <PanelLeft size={16} />
          </button>
          <span style={{ fontSize: 14, color: 'var(--cgpt-muted)', fontFamily: 'var(--cgpt-font-sans)' }}>Settings</span>
          <div style={{ flex: 1 }} />
          <button className="cgpt-icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <div className="cgpt-page-content">
          <div className="cgpt-page-inner">
            <div className="cgpt-page-header">
              <h1 className="cgpt-page-title">Settings</h1>
              <p className="cgpt-page-sub">Manage your ChurchGPT preferences and integrations.</p>
            </div>

            <div className="cgpt-tab-bar">
              {tabs.map(t => (
                <button
                  key={t}
                  className={`cgpt-tab-btn ${activeTab === t.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.toLowerCase())}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* General */}
            <div className={`cgpt-tab-panel ${activeTab === 'general' ? 'active' : ''}`}>
              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">Language & Region</div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Language</div>
                    <div className="cgpt-setting-desc">Interface and response language</div>
                  </div>
                  <select className="cgpt-setting-select" value={prefs.language ?? 'en-US'} onChange={e => setPref('language', e.target.value)}>
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="pt">Portuguese</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Date format</div>
                  </div>
                  <select className="cgpt-setting-select" value={prefs.dateFormat ?? 'MM/DD/YYYY'} onChange={e => setPref('dateFormat', e.target.value)}>
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">Chat Behaviour</div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Auto-save conversations</div>
                    <div className="cgpt-setting-desc">Save all conversations automatically to history</div>
                  </div>
                  <Toggle prefKey="autoSave" defaultOn={true} />
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Send with Enter</div>
                    <div className="cgpt-setting-desc">Press Enter to send; Shift+Enter for new line</div>
                  </div>
                  <Toggle prefKey="sendOnEnter" defaultOn={true} />
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Show typing indicator</div>
                    <div className="cgpt-setting-desc">Animated dots while ChurchGPT is thinking</div>
                  </div>
                  <Toggle prefKey="typingIndicator" defaultOn={true} />
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Scripture reference style</div>
                    <div className="cgpt-setting-desc">Preferred Bible translation in responses</div>
                  </div>
                  <select className="cgpt-setting-select" value={prefs.bible ?? 'ESV'} onChange={e => setPref('bible', e.target.value)}>
                    {['ESV','NIV','KJV','NKJV','NLT','NASB'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className={`cgpt-tab-panel ${activeTab === 'appearance' ? 'active' : ''}`}>
              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">Accent Colour</div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Primary highlight colour</div>
                    <div className="cgpt-setting-desc">Used throughout the ChurchGPT interface</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { label: 'Gold',   val: 'oklch(72% 0.14 65)' },
                      { label: 'Teal',   val: 'oklch(72% 0.14 180)' },
                      { label: 'Rose',   val: 'oklch(72% 0.14 10)' },
                      { label: 'Violet', val: 'oklch(72% 0.14 290)' },
                    ].map(c => (
                      <button
                        key={c.label}
                        title={c.label}
                        onClick={() => setPref('accent', c.val)}
                        style={{
                          width: 22, height: 22, borderRadius: 5,
                          background: c.val, cursor: 'pointer', border: 'none',
                          outline: prefs.accent === c.val ? '2px solid var(--cgpt-text)' : 'none',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Font size</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="range" min={13} max={18} step={1}
                      value={prefs.fontSize ?? 15}
                      onChange={e => setPref('fontSize', +e.target.value)}
                      style={{ width: 100, accentColor: 'var(--cgpt-accent)' }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--cgpt-muted)', width: 30 }}>
                      {prefs.fontSize ?? 15}px
                    </span>
                  </div>
                </div>
              </div>
              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">Sidebar</div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Show sidebar by default</div>
                  </div>
                  <Toggle prefKey="sidebarDefault" defaultOn={true} />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className={`cgpt-tab-panel ${activeTab === 'notifications' ? 'active' : ''}`}>
              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">Email Notifications</div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Weekly digest</div>
                    <div className="cgpt-setting-desc">Summary of your ChurchGPT activity each Monday</div>
                  </div>
                  <Toggle prefKey="weeklyDigest" defaultOn={true} />
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">New feature announcements</div>
                  </div>
                  <Toggle prefKey="featureAnnouncements" defaultOn={true} />
                </div>
              </div>
              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">In-App Alerts</div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Usage limit warnings</div>
                    <div className="cgpt-setting-desc">Alert when approaching your monthly message limit</div>
                  </div>
                  <Toggle prefKey="usageWarnings" defaultOn={true} />
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div className={`cgpt-tab-panel ${activeTab === 'integrations' ? 'active' : ''}`}>
              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">Connected Services</div>
                {[
                  { name: 'Planning Center', desc: 'Sync members, teams, and service plans' },
                  { name: 'Church Community Builder', desc: 'Import congregation data and giving records' },
                  { name: 'Breeze ChMS', desc: 'People, attendance, and contributions' },
                  { name: 'Google Workspace', desc: 'Calendar events and document access' },
                  { name: 'Mailchimp', desc: 'Send newsletters directly from ChurchGPT' },
                ].map(s => (
                  <div key={s.name} className="cgpt-setting-row">
                    <div className="cgpt-setting-info">
                      <div className="cgpt-setting-label">{s.name}</div>
                      <div className="cgpt-setting-desc">{s.desc}</div>
                    </div>
                    <button className="cgpt-btn cgpt-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                      Coming soon
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className={`cgpt-tab-panel ${activeTab === 'privacy' ? 'active' : ''}`}>
              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">Data & Privacy</div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Use conversations to improve AI</div>
                    <div className="cgpt-setting-desc">Help improve ChurchGPT by sharing anonymised conversation data</div>
                  </div>
                  <Toggle prefKey="dataSharing" defaultOn={false} />
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info">
                    <div className="cgpt-setting-label">Analytics</div>
                    <div className="cgpt-setting-desc">Allow usage analytics to improve performance</div>
                  </div>
                  <Toggle prefKey="analytics" defaultOn={true} />
                </div>
              </div>
              <div style={{
                background: 'rgba(220,60,60,0.05)', border: '1px solid rgba(220,60,60,0.15)',
                borderRadius: 12, padding: 20
              }}>
                <div style={{ fontSize: 13, color: 'oklch(65% 0.14 20)', fontWeight: 500, marginBottom: 6 }}>
                  Danger zone
                </div>
                <div className="cgpt-setting-desc" style={{ marginBottom: 14 }}>
                  Permanently delete all your conversation history and account data.
                </div>
                <button className="cgpt-btn cgpt-btn-danger">Delete all data</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
