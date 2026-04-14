"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, ShieldCheck, Key, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { basePath as BP } from "@/lib/utils";
import { resolveSlugByOrgId } from "@/lib/org-resolver";

export type AuthDomain = 'corporate' | 'onboarding' | 'tenant' | 'member';
export type AuthSurface = 'console' | 'pastor-hq' | 'mission-control' | 'ministry' | 'profile' | 'onboarding';
export type SecurityTier = 'strict' | 'elevated' | 'standard' | 'low-friction';

export interface BaseAuthProps {
  authDomain: AuthDomain;
  authSurface: AuthSurface;
  intent: string;
  securityTier: SecurityTier;
  title: string;
  subtitle: string;
}

export const BaseAuth = ({
  authDomain,
  authSurface,
  intent,
  securityTier,
  title,
  subtitle
}: BaseAuthProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextHint, setContextHint] = useState<null | 'single' | 'multi'>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return;
    setHintLoading(true);
    try {
      const { data } = await supabase.rpc('fn_preview_context_count', {
        p_email: email,
        p_domain: authDomain
      });
      if (data) {
        setContextHint(data.has_multiple ? 'multi' : (data.count > 0 ? 'single' : null));
      }
    } catch {
      // Silent fail — never block login
    } finally {
      setHintLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Single-query auth resolution
      const { data: contexts, error: contextError } = await supabase
        .from('v_user_auth_contexts')
        .select('*')
        .eq('identity_id', data.user.id)
        .eq('auth_domain', authDomain);

      if (contextError) throw contextError;

      let finalContexts = contexts;

      // Auto-provision missing domain context on first login
      if (!contexts || contexts.length === 0) {
        try {
          // Attempt to auto-create context based on domain
          if (authDomain === 'onboarding') {
            // Create onboarding_sessions entry
            const { error: onboardError } = await supabase
              .from('onboarding_sessions')
              .insert({
                identity_id: data.user.id,
                email: data.user.email!,
                status: 'email_verified',
                current_step: 'org_creation'
              });
            if (!onboardError) {
              // Retry the context query
              const { data: retryContexts } = await supabase
                .from('v_user_auth_contexts')
                .select('*')
                .eq('identity_id', data.user.id)
                .eq('auth_domain', authDomain);
              finalContexts = retryContexts || [];
            }
          } else if (authDomain === 'member') {
            // For member domain, create entry with default org (JKC)
            const JKC_ORG_ID = 'fa547adf-f820-412f-9458-d6bade11517d';
            const { error: memberError } = await supabase
              .from('member_profiles')
              .insert({
                identity_id: data.user.id,
                org_id: JKC_ORG_ID
              });
            if (!memberError) {
              const { data: retryContexts } = await supabase
                .from('v_user_auth_contexts')
                .select('*')
                .eq('identity_id', data.user.id)
                .eq('auth_domain', authDomain);
              finalContexts = retryContexts || [];
            }
          }
          // For corporate and tenant domains, don't auto-provision — require explicit admin action
        } catch (autoProvisionErr) {
          console.warn('[BaseAuth] Auto-provision failed:', autoProvisionErr);
        }
      }

      if (!finalContexts || finalContexts.length === 0) {
        // Still no context after auto-provision attempt
        await supabase.rpc('fn_log_auth_event', {
          p_identity_id: data.user.id,
          p_auth_domain: authDomain,
          p_auth_surface: authSurface,
          p_intent: intent,
          p_gateway: 'invalid_domain_access'
        });

        await supabase.auth.signOut();
        throw new Error(`Access denied. You do not have permissions for the ${authDomain} domain. Please contact your administrator.`);
      }

      // Success - Log audit
      await supabase.rpc('fn_log_auth_event', {
        p_identity_id: data.user.id,
        p_auth_domain: authDomain,
        p_auth_surface: authSurface,
        p_intent: intent,
        p_gateway: 'web_portal',
        p_org_id: finalContexts[0]?.org_id
      });

      // Handle multi-role context selection if needed
      if (finalContexts.length > 1) {
        // Redirect to context selector — user has multiple offices/roles to choose from
        router.push(`/auth/context-selector?domain=${authDomain}&surface=${authSurface}`);
      } else if (authSurface === 'ministry') {
        // Dynamic lookup — ministry leads each have their own dashboard slug
        const { data: ministry } = await supabase
          .from('ministries')
          .select('slug')
          .eq('leader_id', data.user.id)
          .single();
        if (ministry?.slug) {
          router.push(`/ministry-dashboard/${ministry.slug}`);
        } else {
          // Step 2: fallback — check org_members.ministry_id
          const { data: membership } = await supabase
            .from('org_members')
            .select('ministry_id, ministries(slug)')
            .eq('identity_id', data.user.id)
            .eq('role', 'ministry_lead')
            .single();
          const slug = (membership?.ministries as any)?.slug;
          if (slug) {
            router.push(`/ministry-dashboard/${slug}`);
          } else {
            router.push(`/ministry-dashboard`);
          }
        }
      } else {
        // Static redirect map for all other surfaces
        const targetSurface = finalContexts[0]?.auth_surface || authSurface;
        
        // Ensure browser Cache knows about it
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('church_os_active_domain', authDomain);
            sessionStorage.setItem('church_os_active_surface', targetSurface);
            sessionStorage.removeItem('church_os_domain_session');
            // Mark as direct login entry — Pastor HQ skips 2MFA on direct access
            if (targetSurface === 'pastor-hq') {
                sessionStorage.setItem('church_os_phq_direct', '1');
            } else {
                sessionStorage.removeItem('church_os_phq_direct');
            }
        }

        // For member profile surface, route to /{church_slug}/member/profile
        if (targetSurface === 'profile') {
          const orgId = finalContexts[0]?.org_id;
          const churchSlug = orgId ? await resolveSlugByOrgId(orgId) : null;
          router.push(churchSlug ? `/${churchSlug}/member/profile` : '/member/profile');
          return;
        }

        const redirectMap: Record<Exclude<AuthSurface, 'ministry' | 'profile'>, string> = {
          'console': '/super-admin',
          'pastor-hq': '/pastor-hq',
          'mission-control': '/shepherd/dashboard',
          'onboarding': '/onboarding'
        };
        router.push(`${redirectMap[targetSurface as Exclude<AuthSurface, 'ministry' | 'profile'>]}`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05] 
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600 blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.03, 0.08, 0.03] 
          }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600 blur-3xl" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30 mb-4"
          >
            <Flame className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase">Church OS</h1>
          <div className="flex items-center gap-2 mt-2">
            <ShieldCheck className="w-3 h-3 text-violet-400" />
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em] font-mono">
              {authDomain} Identity Gateway
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0d1421]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 shadow-2xl overflow-hidden relative">
          {/* Progress bar for strict security */}
          {securityTier === 'strict' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: loading ? "100%" : "0%" }}
                className="h-full bg-violet-500"
              />
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">{title}</h2>
            <p className="text-sm text-white/40 mt-1 font-medium">{subtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                Identity Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setContextHint(null); }}
                  onBlur={handleEmailBlur}
                  placeholder="name@church.org"
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/10 transition-all font-medium"
                  required
                />
              </div>
              {hintLoading && (
                <p className="text-[10px] font-bold text-white/20 ml-1 mt-1.5 animate-pulse">Resolving identity...</p>
              )}
              {!hintLoading && contextHint === 'multi' && (
                <p className="text-[10px] font-bold text-violet-400/80 ml-1 mt-1.5">
                  Multiple access contexts detected — you will be asked to choose a dashboard after login.
                </p>
              )}
              {!hintLoading && contextHint === 'single' && (
                <p className="text-[10px] font-bold text-emerald-400/60 ml-1 mt-1.5">Identity recognised.</p>
              )}
            </div>

            {securityTier !== 'low-friction' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                  Security Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/10 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-300 font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-violet-500/25 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Initialize Authentication</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Additional context for non-member domains */}
          {authDomain !== 'member' && (
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  Secure Node: {typeof window !== 'undefined' ? window.location.hostname : 'Cloud'}
                </span>
              </div>
              <button 
                type="button"
                className="text-[10px] font-black text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                <Key className="w-3 h-3" />
                Recovery
              </button>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
            Identity Protocol 2.0 • Security Tier: {securityTier}
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-8 bg-white/5" />
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div className="h-[1px] w-8 bg-white/5" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const BaseAuthCorporate = () => (
  <BaseAuth
    authDomain="corporate"
    authSurface="console"
    intent="platform_control"
    securityTier="strict"
    title="Corporate Sovereignty"
    subtitle="Authorized personnel only. Accessing platform governor controls."
  />
);

export const BaseAuthTenant = () => (
  <BaseAuth
    authDomain="tenant"
    authSurface="mission-control"
    intent="church_operations"
    securityTier="elevated"
    title="Mission Control"
    subtitle="Strategic gateway for church leadership and administration."
  />
);

export const BaseAuthOnboarding = () => (
  <BaseAuth
    authDomain="onboarding"
    authSurface="onboarding"
    intent="identity_bootstrap"
    securityTier="standard"
    title="Identity Bootstrap"
    subtitle="Configure your new Church OS instance and identity."
  />
);

export const BaseAuthMember = () => (
  <BaseAuth
    authDomain="member"
    authSurface="profile"
    intent="spiritual_engagement"
    securityTier="standard"
    title="Member Hub"
    subtitle="Access your spiritual journey and church profile."
  />
);

export const BaseAuthMinistry = () => (
  <BaseAuth
    authDomain="tenant"
    authSurface="ministry"
    intent="ministry_leadership"
    securityTier="standard"
    title="Ministry Gateway"
    subtitle="Direct access for ministry leaders and department heads."
  />
);
