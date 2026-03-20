"use client";

import { useState, useEffect } from "react";
import { 
    Trash2, Plus, Minus, ShoppingBag, 
    ArrowRight, ArrowLeft, CreditCard,
    ShieldCheck, Truck, Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ShopService, getCurrencySymbol } from "@/lib/shop-service";

export default function CartPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    const ORG_ID = "fa547adf-f820-412f-9458-d6bade11517d";

    useEffect(() => {
        const initCart = async () => {
            const currentUser = await Auth.getCurrentUser();
            setUser(currentUser);

            if (currentUser) {
                try {
                    const dbCart = await ShopService.getCart(currentUser.id);
                    // Map DB items to the flat structure expected by the UI
                    const mappedCart = dbCart.map((item: any) => ({
                        ...item.product,
                        quantity: item.quantity,
                        db_id: item.id // Keep DB id for reference
                    }));
                    setCart(mappedCart);
                } catch (e) {
                    console.error("Cart fetch error:", e);
                    toast.error("Failed to load your kingdom cart");
                }
            } else {
                const savedCart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
                setCart(savedCart);
            }
            setLoading(false);
        };

        initCart();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const currentUser = await Auth.getCurrentUser();
                setUser(currentUser);
                const dbCart = await ShopService.getCart(session.user.id);
                setCart(dbCart.map((item: any) => ({ ...item.product, quantity: item.quantity, db_id: item.id })));
            } else {
                setUser(null);
                const savedCart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
                setCart(savedCart);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const updateQuantity = async (id: string, delta: number) => {
        const item = cart.find(i => i.id === id);
        if (!item) return;

        const newQty = Math.max(1, item.quantity + delta);
        
        if (user) {
            try {
                await ShopService.updateCartQuantity(user.id, id, newQty);
                // Refresh data from DB to stay in sync
                const dbCart = await ShopService.getCart(user.id);
                setCart(dbCart.map((item: any) => ({ ...item.product, quantity: item.quantity, db_id: item.id })));
                window.dispatchEvent(new CustomEvent('cart-updated'));
            } catch (e) {
                toast.error("Failed to update quantity");
            }
        } else {
            const newCart = cart.map(item => {
                if (item.id === id) {
                    return { ...item, quantity: newQty };
                }
                return item;
            });
            setCart(newCart);
            localStorage.setItem("merchandise_cart", JSON.stringify(newCart));
            window.dispatchEvent(new CustomEvent('cart-updated'));
        }
    };

    const removeItem = async (id: string) => {
        if (user) {
            try {
                await ShopService.updateCartQuantity(user.id, id, 0); // 0 quantity deletes
                const dbCart = await ShopService.getCart(user.id);
                setCart(dbCart.map((item: any) => ({ ...item.product, quantity: item.quantity, db_id: item.id })));
                window.dispatchEvent(new CustomEvent('cart-updated'));
                toast.info("Item removed from your cloud cart");
            } catch (e) {
                toast.error("Failed to remove item");
            }
        } else {
            const newCart = cart.filter(item => item.id !== id);
            setCart(newCart);
            localStorage.setItem("merchandise_cart", JSON.stringify(newCart));
            window.dispatchEvent(new CustomEvent('cart-updated'));
            toast.info("Item removed from cart");
        }
    };

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = subtotal > 10000 ? 0 : 500;
    const total = subtotal + shipping;

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="flex-1 flex items-center justify-center pt-40">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <ShoppingBag className="text-primary w-10 h-10" />
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            
            <main className="flex-1 pt-24 md:pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight">Your Kingdom Cart</h1>
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] flex items-center gap-2 mt-1">
                                <ShieldCheck size={12} className="text-primary" /> 100% Secure Checkout Guaranteed
                            </p>
                        </div>
                        <Link href="/merchandise">
                            <Button variant="ghost" className="rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-primary/10 hover:text-primary transition-all">
                                <ArrowLeft size={16} className="mr-2" /> Continue Shopping
                            </Button>
                        </Link>
                    </div>

                    {cart.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-card/30">
                            <ShoppingBag size={48} className="mx-auto mb-6 text-muted-foreground opacity-10" />
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-foreground">Cart is currently empty</h3>
                            <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-8 font-medium">Your harvest is empty. Head back to our collection to find something special.</p>
                            <Link href="/merchandise">
                                <Button className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 w-48 bg-primary shadow-lg shadow-primary/20">Start Exploring</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                            {/* Items List */}
                            <div className="lg:col-span-2 space-y-6">
                                <AnimatePresence>
                                    {cart.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className="group relative overflow-hidden bg-card border border-border rounded-2xl p-4 pr-8 hover:border-primary/30 transition-all shadow-sm"
                                        >
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="w-24 h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                                                    {item.images?.[0] ? (
                                                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package size={24} className="text-muted-foreground opacity-20" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 flex flex-col justify-between py-1">
                                                    <div className="space-y-2">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors">{item.name}</h3>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic mt-0.5">Global Kingdom Shipping Eligible</p>
                                                            </div>
                                                            <button onClick={() => removeItem(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/5">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                                                        <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl p-0.5 w-fit border border-border/50">
                                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transiton-colors text-foreground">
                                                                <Minus size={14} />
                                                            </button>
                                                            <span className="w-10 text-center font-black text-xs">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transiton-colors text-foreground">
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="text-xl font-black text-primary group-hover:scale-105 transition-transform origin-right">
                                                            {getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{(item.price * item.quantity).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-6 lg:sticky lg:top-36">
                                <Card className="rounded-3xl border-none bg-card p-6 shadow-sm border border-border/50">
                                    <h3 className="text-lg font-black uppercase tracking-tight mb-6">Order Summary</h3>
                                    
                                    <div className="space-y-4 mb-6 text-[10px] font-bold uppercase tracking-widest">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span className="text-foreground">{getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Tax (10% JCT)</span>
                                            <span className="text-foreground">{getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{Math.round(subtotal * 0.1).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Shipping</span>
                                            <span className="text-foreground">{shipping === 0 ? "FREE" : `${getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}${shipping.toLocaleString()}`}</span>
                                        </div>
                                        <div className="pt-4 border-t border-border/50 flex justify-between text-xl font-black">
                                            <span className="tracking-tight text-foreground">Grand Total</span>
                                            <span className="text-primary">{getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{total.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Link href="/merchandise/checkout">
                                            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-95">
                                                Proceed to Checkout <ArrowRight size={14} className="ml-2" />
                                            </Button>
                                        </Link>
                                        <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-muted-foreground italic">
                                            <CreditCard size={12} className="text-primary" /> Supported by Stripe & PayPal
                                        </div>
                                    </div>

                                    <div className="mt-10 p-6 bg-muted/20 rounded-[2.5rem] space-y-4 border border-border/10">
                                        <div className="flex items-center gap-3">
                                            <Truck className="text-primary" size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Express Kingdom Delivery</span>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground leading-relaxed uppercase font-bold">
                                            Your order will be shipped within 24-48 hours from our central harvest facility.
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </main>

        </div>
    );
}
