'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { PublicChurchGPTSidebar } from "@/components/churchgpt-public/PublicChurchGPTSidebar"
import { PanelLeft, Loader2, CheckCircle2, AlertCircle, Sun, Moon } from "lucide-react"
import Link from "next/link"
import { useCGPTTheme } from "@/hooks/useCGPTTheme"

export default function ChurchGPTAccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Profile form state
  const [fullName, setFullName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [phone, setPhone] = useState('')

  // Security form state
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const { theme, toggle: toggleTheme } = useCGPTTheme()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/churchgpt/login'); return }
      setUser(user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, name, role, phone, org_id, email')
        .eq('id', user.id)
        .maybeSingle()
      if (prof) {
        setProfile(prof)
        setFullName(prof.name ?? '')
        setRoleTitle(prof.role ?? '')
        setPhone(prof.phone ?? '')
      }

      const orgId = prof?.org_id
      if (orgId) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name, church_slug, country, city')
          .eq('id', orgId)
          .maybeSingle()
        if (orgData) setOrg(orgData)

        const { data: sub } = await supabase
          .from('organization_subscriptions')
          .select('status, plan_id, company_plans(name)')
          .eq('org_id', orgId)
          .eq('status', 'active')
          .maybeSingle()
        if (sub) setSubscription(sub)
      }

      setLoading(false)
    }
    init()
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false)
  }, [])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setSaveMsg(null)
    const { error } = await supabase
      .from('profiles')
      .update({ name: fullName, role: roleTitle, phone })
      .eq('id', user.id)
    setSaving(false)
    setSaveMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Profile saved.' })
    setTimeout(() => setSaveMsg(null), 3000)
  }

  const handleChangePassword = async () => {
    if (!newPwd || newPwd !== confirmPwd) {
      setPwdMsg({ ok: false, text: 'Passwords do not match.' }); return
    }
    if (newPwd.length < 8) {
      setPwdMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) {
      setPwdMsg({ ok: false, text: error.message })
    } else {
      setPwdMsg({ ok: true, text: 'Password updated successfully.' })
      setNewPwd(''); setConfirmPwd('')
    }
    setTimeout(() => setPwdMsg(null), 4000)
  }

  if (loading) {
    return (
      <div className="cgpt-loading-screen">
        <Loader2 className="cgpt-loader" />
      </div>
    )
  }

  const initials = (fullName || user?.email || 'U').slice(0, 2).toUpperCase()
  const displayName = fullName || user?.email?.split('@')[0] || 'User'
  const planName: string = (subscription as any)?.company_plans?.name ?? 'Starter'

  const tabs = ['Profile', 'Church', 'Subscription', 'Security']

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
          <span style={{ fontSize: 14, color: 'var(--cgpt-muted)', fontFamily: 'var(--cgpt-font-sans)' }}>Account</span>
          <div style={{ flex: 1 }} />
          <button className="cgpt-icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <div className="cgpt-page-content">
          <div className="cgpt-page-inner">
            <div className="cgpt-page-header">
              <h1 className="cgpt-page-title">Your <em>Account</em></h1>
              <p className="cgpt-page-sub">Manage your profile, church details, and subscription.</p>
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

            {/* Profile */}
            <div className={`cgpt-tab-panel ${activeTab === 'profile' ? 'active' : ''}`}>
              <div className="cgpt-profile-card">
                <div className="cgpt-profile-avatar">{initials}</div>
                <div>
                  <div className="cgpt-profile-name">{displayName}</div>
                  <div className="cgpt-profile-role">{roleTitle || 'ChurchGPT Member'}</div>
                  {org && <div className="cgpt-profile-church">{org.name}</div>}
                </div>
              </div>

              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">Personal Information</div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info"><div className="cgpt-setting-label">Full name</div></div>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="cgpt-setting-input"
                    placeholder="Your name"
                  />
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info"><div className="cgpt-setting-label">Email address</div></div>
                  <input
                    value={user?.email ?? ''}
                    disabled
                    className="cgpt-setting-input"
                    style={{ opacity: 0.5 }}
                  />
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info"><div className="cgpt-setting-label">Role / Title</div></div>
                  <input
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    className="cgpt-setting-input"
                    placeholder="e.g. Senior Pastor"
                  />
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info"><div className="cgpt-setting-label">Phone</div></div>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="cgpt-setting-input"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="cgpt-btn cgpt-btn-accent"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button className="cgpt-btn cgpt-btn-ghost" onClick={() => {
                  setFullName(profile?.name ?? '')
                  setRoleTitle(profile?.role ?? '')
                  setPhone(profile?.phone ?? '')
                }}>
                  Cancel
                </button>
                {saveMsg && (
                  <span style={{ fontSize: 13, color: saveMsg.ok ? 'oklch(65% 0.14 140)' : 'oklch(65% 0.14 20)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {saveMsg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {saveMsg.text}
                  </span>
                )}
              </div>
            </div>

            {/* Church */}
            <div className={`cgpt-tab-panel ${activeTab === 'church' ? 'active' : ''}`}>
              {org ? (
                <div className="cgpt-setting-group">
                  <div className="cgpt-setting-group-title">Church Details</div>
                  <div className="cgpt-setting-row">
                    <div className="cgpt-setting-info"><div className="cgpt-setting-label">Church name</div></div>
                    <span style={{ fontSize: 14, color: 'var(--cgpt-text)' }}>{org.name}</span>
                  </div>
                  <div className="cgpt-setting-row">
                    <div className="cgpt-setting-info"><div className="cgpt-setting-label">Slug</div></div>
                    <span style={{ fontSize: 13, color: 'var(--cgpt-muted)', fontFamily: 'var(--cgpt-font-mono)' }}>{org.church_slug}</span>
                  </div>
                  {org.city && (
                    <div className="cgpt-setting-row">
                      <div className="cgpt-setting-info"><div className="cgpt-setting-label">Location</div></div>
                      <span style={{ fontSize: 14, color: 'var(--cgpt-text)' }}>{[org.city, org.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--cgpt-muted)', padding: '24px 0' }}>
                  No church linked to this account. Contact support if this is unexpected.
                </p>
              )}
            </div>

            {/* Subscription */}
            <div className={`cgpt-tab-panel ${activeTab === 'subscription' ? 'active' : ''}`}>
              <div style={{
                background: 'var(--cgpt-bg2)', border: '1px solid var(--cgpt-border)',
                borderRadius: 14, padding: 24, marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
              }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--cgpt-muted)', marginBottom: 4 }}>Current plan</div>
                  <div style={{ fontFamily: 'var(--cgpt-font-serif)', fontSize: 24, color: 'var(--cgpt-accent)' }}>
                    {planName}
                  </div>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  background: 'rgba(255,200,80,0.15)', color: 'var(--cgpt-accent)',
                  border: '1px solid rgba(255,200,80,0.2)'
                }}>
                  {subscription ? 'Active' : 'Free tier'}
                </span>
              </div>

              {planName.toLowerCase() !== 'enterprise' && (
                <Link href="/churchgpt/upgrade" className="cgpt-modal-cta" style={{ display: 'inline-block', marginBottom: 16 }}>
                  Upgrade your plan
                </Link>
              )}

              <p style={{ fontSize: 13, color: 'var(--cgpt-dim)' }}>
                To manage billing, invoices, or cancel, contact{' '}
                <a href="mailto:hello@churchos-ai.website" style={{ color: 'var(--cgpt-accent)' }}>
                  hello@churchos-ai.website
                </a>
              </p>
            </div>

            {/* Security */}
            <div className={`cgpt-tab-panel ${activeTab === 'security' ? 'active' : ''}`}>
              <div className="cgpt-setting-group">
                <div className="cgpt-setting-group-title">Change Password</div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info"><div className="cgpt-setting-label">New password</div></div>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    className="cgpt-setting-input"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="cgpt-setting-row">
                  <div className="cgpt-setting-info"><div className="cgpt-setting-label">Confirm password</div></div>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    className="cgpt-setting-input"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={handleChangePassword} className="cgpt-btn cgpt-btn-accent">
                  Update password
                </button>
                {pwdMsg && (
                  <span style={{ fontSize: 13, color: pwdMsg.ok ? 'oklch(65% 0.14 140)' : 'oklch(65% 0.14 20)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {pwdMsg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {pwdMsg.text}
                  </span>
                )}
              </div>

              <div style={{ marginTop: 32, background: 'rgba(220,60,60,0.05)', border: '1px solid rgba(220,60,60,0.15)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, color: 'oklch(65% 0.14 20)', fontWeight: 500, marginBottom: 6 }}>Sign out everywhere</div>
                <div className="cgpt-setting-desc" style={{ marginBottom: 14 }}>
                  Sign out of all active sessions on all devices.
                </div>
                <button
                  className="cgpt-btn cgpt-btn-danger"
                  onClick={async () => { await supabase.auth.signOut(); router.push('/churchgpt') }}
                >
                  Sign out all sessions
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
