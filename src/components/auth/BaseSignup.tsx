"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { basePath as BP } from "@/lib/utils";
import { resolvePublicOrgId } from "@/lib/org-resolver";

export type AuthDomain = 'corporate' | 'onboarding' | 'tenant' | 'member';
export type SignupStep = 'email' | 'verification' | 'password' | 'success';

export interface BaseSignupProps {
  authDomain: AuthDomain;
  title: string;
  subtitle: string;
  onSignupSuccess?: (email: string, orgId?: string) => void;
}

export const BaseSignup = ({
  authDomain,
  title,
  subtitle,
  onSignupSuccess
}: BaseSignupProps) => {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check if email already exists in auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: "temporary",
        options: {
          emailRedirectTo: `${window.location.origin}${BP}/auth/callback`,
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (signUpData?.user) {
        setSuccessEmail(email);
        setStep('verification');
      }
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Failed to get user after signup");
      }

      // Auto-provision domain context based on authDomain
      if (authDomain === 'member') {
        const { error: memberError } = await supabase
          .from('member_profiles')
          .insert({
            identity_id: user.id,
            org_id: await resolvePublicOrgId()
          });

        if (memberError) {
          console.warn('Failed to create member profile:', memberError);
        }
      } else if (authDomain === 'onboarding') {
        const { error: onboardError } = await supabase
          .from('onboarding_sessions')
          .insert({
            identity_id: user.id,
            email: user.email!,
            status: 'email_verified',
            current_step: 'org_creation'
          });

        if (onboardError) {
          console.warn('Failed to create onboarding session:', onboardError);
        }
      }

      setStep('success');

      if (onSignupSuccess) {
        onSignupSuccess(email, authDomain === 'member' ? 'fa547adf-f820-412f-9458-d6bade11517d' : undefined);
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        const loginMap: Record<AuthDomain, string> = {
          'corporate': '/corporate/login',
          'tenant': '/church/login',
          'member': '/member/login',
          'onboarding': '/onboarding/login'
        };
        router.push(loginMap[authDomain]);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
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
          <div className="mb-8">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">{title}</h2>
            <p className="text-sm text-white/40 mt-1 font-medium">{subtitle}</p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8 flex gap-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'email' || step === 'verification' || step === 'password' || step === 'success' ? 'bg-violet-500' : 'bg-white/10'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'verification' || step === 'password' || step === 'success' ? 'bg-violet-500' : 'bg-white/10'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'password' || step === 'success' ? 'bg-violet-500' : 'bg-white/10'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'success' ? 'bg-violet-500' : 'bg-white/10'}`} />
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form
                key="email-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleEmailSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-violet-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/10 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

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
                      <span>Continue with Email</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-white/30 text-center">
                  Already have an account? <a href={`${BP}/login`} className="text-violet-400 hover:text-violet-300">Sign in</a>
                </p>
              </motion.form>
            )}

            {step === 'verification' && (
              <motion.div
                key="verification"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mx-auto"
                >
                  <Mail className="w-8 h-8 text-violet-400" />
                </motion.div>
                <div>
                  <h3 className="text-white font-black text-lg">Check Your Email</h3>
                  <p className="text-white/60 text-sm mt-2">We've sent a verification link to:</p>
                  <p className="text-violet-300 font-mono text-sm mt-1">{email}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] text-white/40">
                    Click the verification link to continue setting up your account.
                  </p>
                </div>
                <button
                  onClick={() => setStep('password')}
                  className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-all"
                >
                  Continue to Password
                </button>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.form
                key="password-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                    Password
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-violet-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/10 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

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
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6 text-center"
              >
                <motion.div
                  animate={{ scale: [0.9, 1.1, 1], rotate: 360 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <div>
                  <h3 className="text-white font-black text-lg">Welcome!</h3>
                  <p className="text-white/60 text-sm mt-2">Your account has been created successfully.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-[10px] text-emerald-300">
                    Redirecting you to login...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">
            Secure Registration • Identity Protocol 2.0
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// Preset exports for each domain
export const BaseSignupMember = () => (
  <BaseSignup
    authDomain="member"
    title="Join as Member"
    subtitle="Create your Church OS member account to access spiritual resources."
  />
);

export const BaseSignupOnboarding = () => (
  <BaseSignup
    authDomain="onboarding"
    title="Register Your Church"
    subtitle="Start your Church OS journey by creating your church account."
  />
);

export const BaseSignupTenant = () => (
  <BaseSignup
    authDomain="tenant"
    title="Church Registration"
    subtitle="Create a leadership account for your church."
  />
);

export const BaseSignupCorporate = () => (
  <BaseSignup
    authDomain="corporate"
    title="Corporate Access"
    subtitle="Platform administrator registration."
  />
);
