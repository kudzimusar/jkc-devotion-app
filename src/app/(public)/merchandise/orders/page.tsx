"use client";

import { useState, useEffect } from "react";
import { 
    Package, ArrowLeft, Loader2, 
    Calendar, Clock, CheckCircle2,
    Truck, AlertCircle, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Auth } from "@/lib/auth";
import { ShopService, MerchandiseOrder, getCurrencySymbol } from "@/lib/shop-service";

import { resolvePublicOrgId } from '@/lib/org-resolver';

export default function OrdersPage() {
    const [orders, setOrders] = useState<MerchandiseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [orgId, setOrgId] = useState<string>("");

    useEffect(() => {
        const initOrders = async () => {
            const resolvedOrgId = await resolvePublicOrgId();
            if (resolvedOrgId) setOrgId(resolvedOrgId);

            const currentUser = await Auth.getCurrentUser();
            setUser(currentUser);

            if (currentUser) {
                try {
                    const userOrders = await ShopService.getUserOrders(currentUser.id);
                    setOrders(userOrders);
                } catch (e) {
                    console.error("Orders fetch error:", e);
                }
            }
            setLoading(false);
        };

        initOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'shipped': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'processing': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'pending': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return 'bg-destructive/10 text-destructive border-destructive/20';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background pt-32 px-4 text-center">
                <div className="max-w-md mx-auto space-y-6">
                    <Lock size={48} className="mx-auto text-muted-foreground opacity-20" />
                    <h1 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h1>
                    <p className="text-sm text-muted-foreground">Please sign in to view your divine purchase history.</p>
                    <Link href="/auth/login">
                        <Button className="rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px]">Sign In</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 md:pt-32 pb-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="space-y-1">
                        <Link href="/merchandise" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors mb-4 group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Store
                        </Link>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Purchase History</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Review your past investments in the kingdom</p>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <Card className="text-center py-20 border border-dashed border-border rounded-3xl bg-card/30">
                        <Package size={48} className="mx-auto mb-6 text-muted-foreground opacity-10" />
                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">No Orders Found</h3>
                        <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-8 font-medium">You haven't made any purchases yet. Your kingdom treasures are waiting.</p>
                        <Link href="/merchandise">
                            <Button className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 w-48 bg-primary shadow-lg shadow-primary/20">Start Shopping</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:border-primary/20 transition-all"
                            >
                                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 bg-muted/20">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Order ID</p>
                                            <p className="text-xs font-black uppercase tracking-tight">#{order.id.slice(0, 8)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Date Placed</p>
                                            <p className="text-xs font-black uppercase tracking-tight flex items-center gap-1.5">
                                                <Calendar size={12} className="text-primary" />
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Amount</p>
                                            <p className="text-xs font-black text-primary uppercase tracking-tight">
                                                {getCurrencySymbol(orgId)}{order.total_amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={`rounded-lg py-1 px-3 border uppercase text-[9px] font-bold tracking-widest ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </Badge>
                                </div>

                                <div className="p-4 space-y-3">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border/50">
                                                <img src={item.product?.images?.[0]} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[11px] font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">{item.product?.name}</h4>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Qty: {item.quantity} • {getCurrencySymbol(orgId)}{item.unit_price.toLocaleString()}</p>
                                            </div>
                                            <Link href={`/merchandise/${item.product?.slug}`}>
                                                <button className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/5">
                                                    <ChevronRight size={16} />
                                                </button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import { Lock } from "lucide-react";
