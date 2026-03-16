"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Shield, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { basePath as BP } from "@/lib/utils";

/**
 * Invitation Acceptance Page
 * Validates token and forces password setup for new admins.
 */
function AcceptInviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'validating' | 'setup' | 'success' | 'invalid'>('validating');
    const [invitationData, setInvitationData] = useState<any>(null);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function validateToken() {
            if (!token) {
                setStatus('invalid');
                return;
            }

            const { data, error } = await supabase
                .from('vw_invitation_check')
                .select('*')
                .eq('invitation_token', token)
                .maybeSingle();

            if (error || !data) {
                setStatus('invalid');
            } else {
                setInvitationData(data);
                setStatus('setup');
            }
        }

        validateToken();
    }, [token]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // In a real flow, we'd use supabase.auth.signUp()
            // But if they were invited by email, we might use a specific endpoint
            // For this design, we'll assume they are setting up their account for the first time
            
            // NOTE: This requires the 'handle_invited_signup' trigger in DB to link the user_id
            const { data, error: signupError } = await supabase.auth.signUp({
                email: invitationData.email || "", // This would need to be in the view/record
                password,
                options: {
                    data: {
                        org_id: invitationData.org_id,
                        invited_role: invitationData.role
                    }
                }
            });

            if (signupError) throw signupError;

            setStatus('success');
            setTimeout(() => {
                router.push(`${BP}/login/`);
            }, 3000);

        } catch (err: any) {
            setError(err.message || "Failed to finalize account.");
        } finally {
            setLoading(false);
        }
    };

    if (status === 'validating') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c14] gap-4">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Validating High Command Authorization</p>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c14] p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Access Denied</h1>
                <p className="text-sm text-white/40 max-w-xs">
                    This invitation is invalid, expired, or has already been used. Please contact your administrator.
                </p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c14] p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h1 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Onboarding Complete</h1>
                <p className="text-sm text-white/40">
                    Your credentials have been established. Redirecting to Mission Control...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[#0d1421] border border-white/8 rounded-3xl p-8 shadow-2xl"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white uppercase tracking-tight">Leadership Onboarding</h1>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Role: {invitationData.role}</p>
                    </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Configure Secure Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                                placeholder="••••••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <p className="text-xs text-red-300 font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || password.length < 8}
                        className="w-full h-12 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalize Authorization"}
                    </button>
                </form>

                <p className="mt-8 text-[9px] text-white/20 text-center font-medium leading-relaxed uppercase tracking-wider">
                    By finalizing, you agree to the Church OS Security Guidelines. 
                    Your actions will be logged for accountability.
                </p>
            </motion.div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AcceptInviteContent />
        </Suspense>
    );
}
