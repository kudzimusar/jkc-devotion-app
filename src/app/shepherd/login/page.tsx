"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { AdminAuth } from "@/lib/admin-auth";
import { basePath as BP } from "@/lib/utils";

const DASHBOARD_PATH = "/shepherd/dashboard";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkingSession, setCheckingSession] = useState(true);

    // If already logged in as admin, redirect immediately
    useEffect(() => {
        AdminAuth.getAdminSession().then(session => {
            if (session) router.replace(`${BP}${DASHBOARD_PATH}/`);
            else setCheckingSession(false);
        });
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setError(null);
        setLoading(true);

        const result = await AdminAuth.loginAdmin(email, password);

        if (!result.success) {
            setError(result.error || "Login failed");
            setLoading(false);
            return;
        }

        router.push(`${BP}${DASHBOARD_PATH}/`);
    };

    if (checkingSession) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30 mb-4">
                        <Flame className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-wide">Church OS</h1>
                    <p className="text-sm text-white/40 mt-1 font-medium">Mission Control — Admin Access</p>
                </div>

                {/* Card */}
                <div className="bg-[#0d1421] border border-white/8 rounded-3xl p-8 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="text-lg font-black text-white">Admin Sign In</h2>
                        <p className="text-xs text-white/40 mt-1">
                            Access restricted to authorized church leadership
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@jkc.church"
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(s => !s)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                                >
                                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-300">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                            ) : (
                                <><ShieldCheck className="w-4 h-4" /> Access Mission Control</>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 pt-5 border-t border-white/5 text-center">
                        <p className="text-[10px] text-white/25">
                            Don't have access?{" "}
                            <a href="mailto:admin@jkc.church" className="text-violet-400 hover:text-violet-300 transition-colors">
                                Request access from your administrator
                            </a>
                        </p>
                    </div>
                </div>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-[9px] text-white/20 font-medium uppercase tracking-widest">
                        Secured by Supabase Auth · End-to-End Encrypted
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
