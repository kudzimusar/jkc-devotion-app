"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Auth } from "@/lib/auth";
import { basePath as BP } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
    onEmailNotConfirmed?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess, onEmailNotConfirmed }: AuthModalProps) {
    const [authMode, setAuthMode] = useState<"login" | "register">("login");
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isMemberRequest, setIsMemberRequest] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            toast.error("Please fill in all fields.");
            return;
        }
        setLoading(true);
        const res = await Auth.login(email, password);
        if (res.success) {
            toast.success("Welcome back!");
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

    const handleRegister = async () => {
        if (!email || !password || !name) {
            toast.error("Please fill in all fields.");
            return;
        }
        setLoading(true);
        const metadata = isMemberRequest ? { membership_status: 'pending_approval' } : {};
        const res = await Auth.createAccount(email, password, name, metadata);
        if (res.success) {
            toast.success("Account created! Check your email.");
            if (onEmailNotConfirmed) onEmailNotConfirmed();
            onClose();
        } else {
            toast.error(res.error || "Signup failed");
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        await Auth.signInWithGoogle();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
                <div className="bg-background/80 backdrop-blur-3xl rounded-[3.5rem] border border-foreground/10 overflow-hidden shadow-2xl p-6 md:p-10 transition-all duration-500 animate-in zoom-in-95 fade-in duration-300">
                    <div className="flex flex-col items-center gap-4 relative mb-6">
                        <img src={`${BP}/church-logo.png`} alt="JKC" className="w-16 h-16 object-contain" />
                        <div className="space-y-1 text-center">
                            <h3 className="text-3xl font-serif">Join the Journey</h3>
                            <p className="text-sm opacity-50 px-8">Your private journal, synced anywhere.</p>
                        </div>
                        <button onClick={onClose} className="absolute top-0 right-0 opacity-40 hover:opacity-100 transition-opacity">
                            <Trash2 className="w-6 h-6 rotate-45" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <Tabs value={authMode} onValueChange={(v: any) => setAuthMode(v)}>
                            <TabsList className="grid w-full grid-cols-2 rounded-full h-14 mb-10 bg-foreground/5 border border-foreground/10 p-1">
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
                                        className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg placeholder:opacity-30 focus:bg-foreground/10 transition-colors"
                                    />
                                    <Input
                                        placeholder="Password"
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg placeholder:opacity-30 focus:bg-foreground/10 transition-colors"
                                    />
                                </div>
                                <Button
                                    onClick={handleLogin}
                                    className="w-full h-16 rounded-full bg-[var(--primary)] font-black text-xl py-6 shadow-xl shadow-[var(--primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    disabled={loading}
                                >
                                    {loading ? "AUTHENTICATING..." : "CONTINUE"}
                                </Button>
                                <div className="relative py-4 text-center">
                                    <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] px-4 pt-4 block w-full mt-2 border-t border-foreground/10">or secure sign in</span>
                                </div>
                                <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-16 rounded-full border-2 font-black gap-3 py-6 glass border-foreground/10 bg-background/50 hover:bg-foreground/5 transition-all">
                                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" /> Google Account
                                </Button>
                            </TabsContent>

                            <TabsContent value="register" className="space-y-4">
                                <div className="space-y-2">
                                    <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg" />
                                    <Input placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg" />
                                    <Input placeholder="Set Password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-16 rounded-3xl bg-foreground/5 border-0 px-8 text-lg" />
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-[var(--primary)]/5 rounded-3xl border border-[var(--primary)]/10">
                                    <input
                                        type="checkbox"
                                        id="memberRequest"
                                        checked={isMemberRequest}
                                        onChange={(e) => setIsMemberRequest(e.target.checked)}
                                        className="w-6 h-6 rounded-lg accent-[var(--primary)] transition-all cursor-pointer"
                                    />
                                    <label htmlFor="memberRequest" className="text-[11px] font-bold text-foreground/70 cursor-pointer leading-tight">
                                        Are you a member of Japan Kingdom Church? <br />
                                        <span className="opacity-50 font-medium italic">Pending approval to access admin features.</span>
                                    </label>
                                </div>

                                <Button onClick={handleRegister} className="w-full h-16 rounded-full bg-[var(--primary)] font-black text-xl shadow-xl shadow-[var(--primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                                    {loading ? "CREATING..." : "CREATE ACCOUNT"}
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
