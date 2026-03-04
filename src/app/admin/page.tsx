"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, Shield, Building2 } from "lucide-react";

export default function AdminDashboard() {
    const [loading, setLoading] = useState(false);
    const [orgId, setOrgId] = useState("00000000-0000-0000-0000-000000000000"); // placeholder

    useEffect(() => {
        // In a real app we would load the user's organization id here from auth
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success')) {
            toast.success("Subscription successful! You are now subscribed.");
        }
        if (urlParams.get('canceled')) {
            toast.info("Subscription canceled.");
        }
    }, []);

    const handleSubscribe = async (tier: 'lite' | 'pro' | 'enterprise') => {
        setLoading(true);
        let priceId = ''; // We will read these from env in a real scenario
        if (tier === 'lite') priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE || '';
        if (tier === 'pro') priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '';
        if (tier === 'enterprise') priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || '';

        try {
            const res = await fetch("/api/stripe-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId, priceId }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || "Failed to create checkout session");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/stripe-portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || "Failed to create portal session");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-16 h-16 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-[var(--primary)]">Church Admin Portal</h1>
                    <p className="opacity-70">Manage your subscription, API keys, and billing</p>
                </div>
            </div>

            <div className="flex gap-4 mb-8">
                <input
                    type="text"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="font-mono text-xs w-[300px] px-4 rounded-xl border-white/20 glass"
                    placeholder="Organization ID (UUID)"
                />
                <Button onClick={handleManageBilling} disabled={loading} variant="outline" className="rounded-full glass font-bold">
                    <Shield className="w-4 h-4 mr-2" />
                    Manage Billing & Cancellations
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Lite Tier */}
                <Card className="glass border-white/20 rounded-[2rem] overflow-hidden relative">
                    <CardContent className="p-8">
                        <h3 className="text-xl font-bold mb-2">Lite</h3>
                        <div className="text-3xl font-black text-[var(--primary)] mb-6">$29<span className="text-sm opacity-50">/mo</span></div>
                        <ul className="space-y-4 mb-8 opacity-80 text-sm">
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Up to 1,000 API calls/day</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Standard Support</li>
                        </ul>
                        <Button onClick={() => handleSubscribe('lite')} disabled={loading} className="w-full rounded-full bg-white/10 hover:bg-[var(--primary)] font-bold">
                            Subscribe to Lite
                        </Button>
                    </CardContent>
                </Card>

                {/* Pro Tier */}
                <Card className="bg-[var(--primary)]/10 border-[var(--primary)]/50 rounded-[2rem] overflow-hidden relative shadow-xl">
                    <div className="absolute top-0 right-0 bg-[var(--primary)] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                        Popular
                    </div>
                    <CardContent className="p-8">
                        <h3 className="text-xl font-bold mb-2 text-[var(--primary)]">Pro</h3>
                        <div className="text-3xl font-black text-[var(--primary)] mb-6">$79<span className="text-sm opacity-50">/mo</span></div>
                        <ul className="space-y-4 mb-8 opacity-80 text-sm font-medium">
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Up to 10,000 API calls/day</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Includes MCP Access</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Priority Support</li>
                        </ul>
                        <Button onClick={() => handleSubscribe('pro')} disabled={loading} className="w-full rounded-full bg-[var(--primary)] text-white font-bold shadow-lg">
                            <Sparkles className="w-4 h-4 mr-2" /> Upgrade to Pro
                        </Button>
                    </CardContent>
                </Card>

                {/* Enterprise Tier */}
                <Card className="glass border-white/20 rounded-[2rem] overflow-hidden relative">
                    <CardContent className="p-8">
                        <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                        <div className="text-3xl font-black text-[var(--primary)] mb-6">Custom</div>
                        <ul className="space-y-4 mb-8 opacity-80 text-sm">
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Unlimited API calls/day</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Global MCP Distribution</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Dedicated Account Manager</li>
                        </ul>
                        <Button onClick={() => handleSubscribe('enterprise')} disabled={loading} className="w-full rounded-full bg-white/10 hover:bg-[var(--primary)] font-bold">
                            Contact Sales
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
