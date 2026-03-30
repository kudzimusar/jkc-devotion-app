"use client";

import { useState, useEffect } from "react";
import { 
    Trash2, Plus, Minus, ShoppingBag, 
    ArrowRight, ArrowLeft, CreditCard,
    ShieldCheck, Truck, Package, LayoutGrid, List
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

import { resolvePublicOrgId } from '@/lib/org-resolver';

export default function CartPage() {
    const [cart, setCart] = useState<any[]>([]);
    const [savedItems, setSavedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [orgId, setOrgId] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        const initCart = async () => {
            const resolvedOrgId = await resolvePublicOrgId();
            if (resolvedOrgId) setOrgId(resolvedOrgId);

            const currentUser = await Auth.getCurrentUser();
            setUser(currentUser);

            if (currentUser) {
                try {
                    const dbCart = await ShopService.getCart(currentUser.id);
                    const mapped = dbCart.map((item: any) => ({
                        ...item.product,
                        quantity: item.quantity,
                        db_id: item.id,
                        is_saved: item.is_saved
                    }));
                    setCart(mapped.filter((i: any) => !i.is_saved));
                    setSavedItems(mapped.filter((i: any) => i.is_saved));
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
                const dbCart = await ShopService.getCart(session.user.id);
                const mapped = dbCart.map((item: any) => ({ 
                    ...item.product, 
                    quantity: item.quantity, 
                    db_id: item.id,
                    is_saved: item.is_saved
                }));
                setCart(mapped.filter((i: any) => !i.is_saved));
                setSavedItems(mapped.filter((i: any) => i.is_saved));
            } else {
                setUser(null);
                const savedCart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
                setCart(savedCart);
                setSavedItems([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const updateQuantity = async (id: string, delta: number) => {
        const item = [...cart, ...savedItems].find(i => i.id === id);
        if (!item) return;

        const newQty = Math.max(1, item.quantity + delta);
        
        if (user) {
            try {
                await ShopService.updateCartQuantity(user.id, id, newQty);
                const dbCart = await ShopService.getCart(user.id);
                const mapped = dbCart.map((item: any) => ({ ...item.product, quantity: item.quantity, db_id: item.id, is_saved: item.is_saved }));
                setCart(mapped.filter((i: any) => !i.is_saved));
                setSavedItems(mapped.filter((i: any) => i.is_saved));
                window.dispatchEvent(new CustomEvent('cart-updated'));
            } catch (e) {
                toast.error("Failed to update quantity");
            }
        } else {
            const newCart = cart.map(item => {
                if (item.id === id) return { ...item, quantity: newQty };
                return item;
            });
            setCart(newCart);
            localStorage.setItem("merchandise_cart", JSON.stringify(newCart));
            window.dispatchEvent(new CustomEvent('cart-updated'));
        }
    };

    const toggleSave = async (id: string, currentlySaved: boolean) => {
        if (!user) {
            toast.error("Please login to save for later");
            return;
        }

        try {
            await ShopService.toggleSaveForLater(user.id, id, !currentlySaved);
            const dbCart = await ShopService.getCart(user.id);
            const mapped = dbCart.map((item: any) => ({ ...item.product, quantity: item.quantity, db_id: item.id, is_saved: item.is_saved }));
            setCart(mapped.filter((i: any) => !i.is_saved));
            setSavedItems(mapped.filter((i: any) => i.is_saved));
            window.dispatchEvent(new CustomEvent('cart-updated'));
            toast.success(currentlySaved ? "Moved to cart" : "Saved for later");
        } catch (e) {
            toast.error("Failed to update item status");
        }
    };

    const removeItem = async (id: string) => {
        if (user) {
            try {
                await ShopService.updateCartQuantity(user.id, id, 0); 
                const dbCart = await ShopService.getCart(user.id);
                const mapped = dbCart.map((item: any) => ({ ...item.product, quantity: item.quantity, db_id: item.id, is_saved: item.is_saved }));
                setCart(mapped.filter((i: any) => !i.is_saved));
                setSavedItems(mapped.filter((i: any) => i.is_saved));
                window.dispatchEvent(new CustomEvent('cart-updated'));
                toast.info("Item removed");
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
    const tax = Math.round(subtotal * 0.1);
    const shipping = subtotal > 10000 ? 0 : 500;
    const total = subtotal + tax + shipping; // FIX: Adding tax to total

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
        <div className="min-h-screen bg-section-alt flex flex-col">
            <main className="flex-1 pt-24 md:pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-7xl">
                    <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-border/50 px-2 lg:px-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white">
                                <ShoppingBag size={18} />
                            </div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic">Kingdom Cart</h1>
                        </div>
                    </div>

                    {cart.length === 0 && savedItems.length === 0 ? (
                        <div className="text-center py-24 glass rounded-3xl border-white/20 shadow-2xl">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="mb-8"
                            >
                                <ShoppingBag size={64} className="mx-auto text-primary/20" />
                            </motion.div>
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Your Kingdom Cart is empty</h3>
                            <Link href="/merchandise">
                                <Button className="btn-navy rounded-full font-black uppercase tracking-widest text-[10px] h-14 px-10 shadow-xl shadow-primary/20">
                                    Start Shopping
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                            {/* Items List */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {cart.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="card-surface p-6 sm:p-8 relative overflow-hidden group hover:border-primary/30 transition-all duration-500"
                                            >
                                                <div className="flex flex-col sm:flex-row gap-6 lg:gap-8">
                                                    <div className="flex items-start">
                                                        <input 
                                                            type="checkbox" 
                                                            checked 
                                                            readOnly 
                                                            className="h-5 w-5 rounded-md border-border text-primary focus:ring-primary/50 cursor-pointer" 
                                                        />
                                                    </div>
                                                    
                                                    <Link href={`/merchandise/${item.slug}`} className="w-full sm:w-40 h-40 flex-shrink-0 bg-muted/30 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500 flex items-center justify-center p-4">
                                                        <img src={item.images?.[0]} alt={item.name} className="max-w-full max-h-full object-contain" />
                                                    </Link>
 
                                                    <div className="flex-1 flex flex-col justify-between py-2">
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <Link href={`/merchandise/${item.slug}`} className="text-xl font-black uppercase tracking-tighter leading-none hover:text-primary transition-colors">
                                                                    {item.name}
                                                                </Link>
                                                                <div className="text-2xl font-black text-primary whitespace-nowrap">
                                                                    {getCurrencySymbol(orgId)}{(item.price * item.quantity).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-3">
                                                                <div className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest">In Stock</div>
                                                                <div className="px-2 py-0.5 rounded bg-primary/5 text-primary/70 text-[10px] font-black uppercase tracking-widest">Free Shipping</div>
                                                            </div>
                                                            
                                                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                                                <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2 border border-border/50">
                                                                    <button onClick={() => updateQuantity(item.id, -1)} className="text-muted-foreground hover:text-primary transition-colors"><Minus size={14} /></button>
                                                                    <span className="min-w-[24px] text-center font-black text-sm">{item.quantity}</span>
                                                                    <button onClick={() => updateQuantity(item.id, 1)} className="text-muted-foreground hover:text-primary transition-colors"><Plus size={14} /></button>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-3 ml-2">
                                                                    <button 
                                                                        onClick={() => removeItem(item.id)} 
                                                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors group/btn"
                                                                    >
                                                                        <Trash2 size={12} className="group-hover/btn:scale-110 transition-transform" /> Delete
                                                                    </button>
                                                                    <div className="w-1 h-1 rounded-full bg-border" />
                                                                    <button 
                                                                        onClick={() => toggleSave(item.id, false)} 
                                                                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                                                    >
                                                                        Save for later
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                    
                                    <div className="text-right pt-4 text-base md:text-lg">
                                        Subtotal ({cart.length} items): <span className="font-bold">{getCurrencySymbol(orgId)}{subtotal.toLocaleString()}</span>
                                    </div>

                                {/* Saved for Later */}
                                {savedItems.length > 0 && (
                                    <div className="pt-12">
                                        <div className="flex items-center gap-3 mb-8 ml-2">
                                            <div className="w-2 h-8 rounded-full bg-primary" />
                                            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Saved for Later <span className="text-muted-foreground/50 ml-2">({savedItems.length})</span></h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {savedItems.map((item) => (
                                                <motion.div 
                                                    key={item.id} 
                                                    layout
                                                    className="card-surface p-5 flex flex-col gap-4 group hover:border-primary/20 transition-all"
                                                >
                                                    <div className="w-full h-40 bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center p-4">
                                                        <img src={item.images?.[0]} alt={item.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-black uppercase tracking-tight line-clamp-1">{item.name}</h4>
                                                        <p className="text-lg font-black text-primary">{getCurrencySymbol(orgId)}{item.price.toLocaleString()}</p>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => toggleSave(item.id, true)}
                                                        className="w-full h-10 rounded-full text-[10px] font-black uppercase tracking-widest border-border hover:bg-primary hover:text-white transition-all"
                                                    >
                                                        Move to cart
                                                    </Button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:sticky lg:top-36 space-y-4">
                                <div className="card-surface p-8 border-primary/10 relative overflow-hidden">
                                    {/* Accent background element */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl" />
                                    
                                    <div className="flex items-center gap-3 mb-8 p-3 rounded-2xl bg-green-500/5 border border-green-500/10">
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                            <ShieldCheck size={14} className="text-white" />
                                        </div>
                                        <p className="text-[10px] text-green-700 font-black uppercase tracking-widest leading-none">Qualified for FREE Shipping</p>
                                    </div>
 
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Subtotal</span>
                                            <span className="text-xl font-black">{getCurrencySymbol(orgId)}{subtotal.toLocaleString()}</span>
                                        </div>
                                        
                                        <div className="space-y-2 pt-4 border-t border-border/50">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                                                <span>Tax (10% JCT)</span>
                                                <span>+{getCurrencySymbol(orgId)}{tax.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                                                <span>Shipping</span>
                                                <span className={shipping === 0 ? "text-green-600" : ""}>
                                                    {shipping === 0 ? "FREE" : `+${getCurrencySymbol(orgId)}${shipping.toLocaleString()}`}
                                                </span>
                                            </div>
                                        </div>
 
                                        <div className="pt-6 mt-6 border-t font-black flex justify-between items-center">
                                            <span className="text-sm uppercase tracking-[0.2em]">Grand Total</span>
                                            <span className="text-3xl tracking-tighter text-primary">{getCurrencySymbol(orgId)}{total.toLocaleString()}</span>
                                        </div>
                                    </div>
 
                                    <Link href="/merchandise/checkout">
                                        <Button className="btn-gold w-full h-16 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-secondary/20">
                                            Proceed to Checkout <ArrowRight size={18} className="ml-3" />
                                        </Button>
                                    </Link>
                                </div>
                                
                                <div className="p-6 glass rounded-3xl space-y-4 hidden lg:block border-white/10">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Kingdom Protection</h4>
                                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                                        <CreditCard size={14} className="text-primary" /> Secure Stripe & PayPal
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
