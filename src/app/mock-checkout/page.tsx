"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Building2 } from "lucide-react";
import { useState, Suspense } from "react";

function MockCheckoutInner() {
    const searchParams = useSearchParams();
    const orgId = searchParams.get("orgId");
    const customerId = searchParams.get("customerId");
    const priceId = searchParams.get("priceId");
    const [loading, setLoading] = useState(false);

    const simulatePayment = async () => {
        setLoading(true);
        try {
            const resp = await fetch("/api/mock-checkout-success", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId, customerId, priceId })
            });
            if (resp.ok) {
                window.location.href = "/admin?success=true";
            } else {
                alert("Payment simulation failed");
            }
        } catch (e) {
            console.error(e);
            alert("Error simulating payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/20">
            <Card className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden glass border-[var(--primary)]/20">
                <div className="bg-[var(--primary)] text-white p-8 text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 text-white">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif">Stripe Checkout</h2>
                    <p className="opacity-80 text-sm uppercase tracking-widest font-bold">Test Mode</p>
                </div>
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-white/10 pb-4">
                            <span className="opacity-70 font-bold">Organization</span>
                            <span className="font-mono text-xs max-w-[150px] truncate">{orgId}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-4">
                            <span className="opacity-70 font-bold">Target Price</span>
                            <span className="font-mono text-xs max-w-[150px] truncate">{priceId}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-60 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Pre-filled test card active
                        </div>
                    </div>

                    <Button
                        onClick={simulatePayment}
                        disabled={loading}
                        className="w-full h-14 rounded-full bg-[var(--primary)] text-white font-bold text-lg shadow-xl shadow-[var(--primary)]/20 hover:scale-105 transition-all"
                    >
                        {loading ? "Processing..." : "PAY & SUBSCRIBE"}
                    </Button>
                    <div className="text-center">
                        <a href="/admin?canceled=true" className="text-xs font-bold opacity-50 hover:underline">Cancel</a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function MockCheckout() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MockCheckoutInner />
        </Suspense>
    );
}
