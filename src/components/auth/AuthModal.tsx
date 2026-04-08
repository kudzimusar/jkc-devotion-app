"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, ShieldCheck, Mail, Key } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";
import { basePath as BP } from "@/lib/utils";
import { useStickyForm } from "@/hooks/useStickyForm";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { resolvePublicOrgId } from '@/lib/org-resolver';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
    onEmailNotConfirmed?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess, onEmailNotConfirmed }: AuthModalProps) {
    const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "magic">("login");
    const [loading, setLoading] = useState(false);
    
    const { values, handleChange: handleStickyChange, clear } = useStickyForm({
        email: "",
        name: "",
        org_id: "", // Dynamic resolution below
        isMemberRequest: false
    }, "auth-modal");

    const [organizations, setOrganizations] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchOrgs = async () => {
            const { data } = await supabase
                .from('organizations')
                .select('id, name')
                .eq('subscription_status', 'active');
            if (data) setOrganizations(data);

            // Resolve current org for default selection
            const resolvedOrgId = await resolvePublicOrgId();
            if (resolvedOrgId && !values.org_id) {
                handleStickyChange("org_id", resolvedOrgId);
            }
        };
        fetchOrgs();
    }, [values.org_id]);

    const email = values.email;
    const setEmail = (val: string) => handleStickyChange("email", val);
    const name = values.name;
    const setName = (val: string) => handleStickyChange("name", val);
    const isMemberRequest = values.isMemberRequest;
    const setIsMemberRequest = (val: boolean) => handleStickyChange("isMemberRequest", val);

    const [password, setPassword] = useState("");
    const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
    const [isResetSent, setIsResetSent] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            toast.error("Please fill in all fields.");
            return;
        }
        setLoading(true);
        const res = await Auth.login(email, password);
        if (res.success) {
            toast.success("Welcome back!");
            clear();
            onSuccess(res.user || null);
            onClose();
        } else if (res.error === 'Email not confirmed') {
            toast.error("Please confirm your email.");
            if (onEmailNotConfirmed) onEmailNotConfirmed();
            onClose();
        } else {
            toast.error(res.error || "Login failed");
        }
        setLoading(false);
    };

    const [showVerificationMessage, setShowVerificationMessage] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !name) {
            toast.error("Please fill in all fields.");
            return;
        }
        setLoading(true);
        const metadata = { 
            org_id: values.org_id,
            membership_status: isMemberRequest ? 'pending_approval' : 'guest'
        };
        const res = await Auth.createAccount(email, password, name, metadata);
        if (res.success) {
            setShowVerificationMessage(true);
            toast.success("Account created!");
            clear();
        } else {
            toast.error(res.error || "Signup failed");
        }
        setLoading(false);
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error("Please enter your email.");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + BP + '/settings',
        });
        if (error) {
            toast.error(error.message);
        } else {
            setIsResetSent(true);
            toast.success("Reset link sent!");
        }
        setLoading(false);
    };

    const handleMagicLink = async () => {
        if (!email) {
            toast.error("Please enter your email.");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin + BP + '/welcome/devotion',
            }
        });
        if (error) {
            toast.error(error.message);
        } else {
            setIsMagicLinkSent(true);
            toast.success("Magic link sent!");
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        await Auth.signInWithGoogle();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none" aria-describedby="auth-modal-description">
                <DialogTitle className="sr-only">Authenticate to Church OS</DialogTitle>
                <DialogDescription id="auth-modal-description" className="sr-only">Login or register to access Church OS dashboard.</DialogDescription>
                <div className="bg-background rounded-[3.5rem] border border-border overflow-hidden shadow-2xl p-6 md:p-10 transition-all duration-500 animate-in zoom-in-95 fade-in duration-300">
                    <div className="flex flex-col items-center gap-4 relative mb-6">
                        <img src={`${BP}/church-logo.png`} alt="Church Logo" className="w-16 h-16 object-contain" />
                        <div className="space-y-1 text-center">
                            <h3 className="text-3xl font-serif">Join the Journey</h3>
                            <p className="text-sm px-8" style={{ color: 'var(--muted-foreground)' }}>Your private journal, synced anywhere.</p>
                        </div>
                        <button onClick={onClose} className="absolute top-0 right-0 hover:opacity-100 transition-opacity" style={{ color: 'var(--muted-foreground)' }}>
                            <Trash2 className="w-6 h-6 rotate-45" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <Tabs value={authMode} onValueChange={(v: any) => setAuthMode(v)}>
                            <TabsList className="grid w-full grid-cols-2 rounded-full h-14 mb-10 bg-muted border border-border p-1">
                                <TabsTrigger value="login" className="rounded-full font-black text-xs tracking-widest">LOGIN</TabsTrigger>
                                <TabsTrigger value="register" className="rounded-full font-black text-xs tracking-widest">NEW ACCOUNT</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login" className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="h-16 rounded-3xl bg-muted border-0 px-8 text-lg placeholder:text-muted-foreground/50 focus:bg-accent transition-colors"
                                    />
                                    <Input
                                        placeholder="Password"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="h-16 rounded-3xl bg-muted border-0 px-8 text-lg placeholder:text-muted-foreground/50 focus:bg-accent transition-colors"
                                    />
                                </div>
                                <Button
                                    onClick={handleLogin}
                                    className="w-full h-16 rounded-full bg-[var(--primary)] font-black text-xl py-6 shadow-xl shadow-[var(--primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    disabled={loading}
                                >
                                    {loading ? "AUTHENTICATING..." : "CONTINUE"}
                                </Button>

                                <div className="flex justify-between items-center px-2">
                                    <Button variant="ghost" onClick={() => setAuthMode("magic")} className="text-[10px] font-bold uppercase tracking-[0.2em] transition-all h-auto py-2" style={{ color: 'var(--muted-foreground)' }}>
                                        Magic Link
                                    </Button>
                                    <Button variant="ghost" onClick={() => setAuthMode("forgot")} className="text-[10px] font-bold uppercase tracking-[0.2em] transition-all h-auto py-2" style={{ color: 'var(--muted-foreground)' }}>
                                        Forgot Password?
                                    </Button>
                                </div>

                                <div className="relative py-4 text-center">
                                    <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] px-4 pt-4 block w-full mt-2 border-t border-foreground/10">or secure sign in</span>
                                </div>
                                <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-16 rounded-full border-2 font-black gap-3 py-6 glass border-foreground/10 bg-background/50 hover:bg-foreground/5 transition-all">
                                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" /> Google Account
                                </Button>
                            </TabsContent>

                            <TabsContent value="magic" className="space-y-6 py-6 text-center animate-in slide-in-from-bottom-5">
                                {isMagicLinkSent ? (
                                    <div className="space-y-4">
                                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-xl font-serif">Check your email</h4>
                                        <p className="text-sm opacity-50">We sent a secure login link to <br /><strong>{email}</strong></p>
                                        <Button variant="ghost" onClick={() => { setIsMagicLinkSent(false); setAuthMode("login"); }} className="text-xs font-bold uppercase tracking-widest opacity-40">Back to login</Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-bold">Secure Access</h4>
                                            <p className="text-sm opacity-50 px-6">Login without a password. We'll send a one-time link to your inbox.</p>
                                        </div>
                                        <Input
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg"
                                        />
                                        <Button onClick={handleMagicLink} disabled={loading} className="w-full h-16 rounded-full bg-[var(--primary)] font-black text-xl">
                                            {loading ? "SENDING..." : "SEND MAGIC LINK"}
                                        </Button>
                                        <Button variant="ghost" onClick={() => setAuthMode("login")} className="text-xs font-bold uppercase tracking-widest opacity-40">Cancel</Button>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="forgot" className="space-y-6 py-6 text-center animate-in slide-in-from-bottom-5">
                                {isResetSent ? (
                                    <div className="space-y-4">
                                        <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                                            <ShieldCheck className="w-10 h-10 text-[var(--primary)]" />
                                        </div>
                                        <h4 className="text-xl font-serif">Reset requested</h4>
                                        <p className="text-sm opacity-50">Check <strong>{email}</strong> for instructions <br />to reset your password.</p>
                                        <Button variant="ghost" onClick={() => { setIsResetSent(false); setAuthMode("login"); }} className="text-xs font-bold uppercase tracking-widest opacity-40">Back to login</Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-bold">Recover Account</h4>
                                            <p className="text-sm opacity-50 px-6">We'll send you a link to choose a new password.</p>
                                        </div>
                                        <Input
                                            placeholder="Email address"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg"
                                        />
                                        <Button onClick={handleForgotPassword} disabled={loading} className="w-full h-16 rounded-full bg-amber-500 font-black text-xl">
                                            {loading ? "SENDING..." : "RESET PASSWORD"}
                                        </Button>
                                        <Button variant="ghost" onClick={() => setAuthMode("login")} className="text-xs font-bold uppercase tracking-widest opacity-40">Cancel</Button>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="register" className="space-y-4">
                                {showVerificationMessage ? (
                                    <div className="space-y-6 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-500 py-10">
                                        <div className="w-24 h-24 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-4">
                                            <svg className="w-12 h-12 text-[var(--primary)] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-serif text-[var(--primary)]">Check Your Email</h4>
                                            <p className="text-sm text-foreground/60 leading-relaxed px-4">
                                                We've sent a confirmation link to <span className="font-bold text-foreground">{email}</span>.
                                                Please verify your account to access your Church OS dashboard.
                                            </p>
                                        </div>
                                        <div className="w-full space-y-3">
                                            <Button onClick={() => window.location.reload()} className="w-full h-14 rounded-2xl bg-[var(--primary)] text-white font-black">
                                                I'VE CONFIRMED MY EMAIL
                                            </Button>
                                            <Button variant="ghost" onClick={() => setShowVerificationMessage(false)} className="w-full h-12 rounded-2xl text-xs font-bold uppercase tracking-widest opacity-40">
                                                Back to login
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg" />
                                            <Input placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg" />
                                            <Input placeholder="Set Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg" />
                                        </div>

                                        <div className="space-y-4 p-5 bg-[var(--primary)]/5 rounded-3xl border border-[var(--primary)]/10">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2">Select Your Church</label>
                                                <Select value={values.org_id} onValueChange={(v) => handleStickyChange("org_id", v)}>
                                                    <SelectTrigger className="h-12 rounded-2xl bg-background border-border font-bold text-xs">
                                                        <SelectValue placeholder="Select Church" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl">
                                                        {organizations.map(org => (
                                                            <SelectItem key={org.id} value={org.id} className="font-bold text-xs">{org.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="checkbox"
                                                    id="memberRequest"
                                                    checked={isMemberRequest}
                                                    onChange={(e) => setIsMemberRequest(e.target.checked)}
                                                    className="w-6 h-6 rounded-lg accent-[var(--primary)] transition-all cursor-pointer"
                                                />
                                                <label htmlFor="memberRequest" className="text-[11px] font-bold text-foreground/70 cursor-pointer leading-tight">
                                                    I am a regular member of this church <br />
                                                    <span className="opacity-50 font-medium italic">Enables attendance, tithing, and group features.</span>
                                                </label>
                                            </div>
                                        </div>

                                        <Button onClick={handleRegister} className="w-full h-16 rounded-full bg-[var(--primary)] font-black text-xl shadow-xl shadow-[var(--primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                                            {loading ? "CREATING..." : "CREATE ACCOUNT"}
                                        </Button>
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
