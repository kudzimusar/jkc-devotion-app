"use client";

import { useState, useEffect } from "react";
import { 
    Trash2, Plus, Minus, ShoppingBag, 
    ArrowRight, ArrowLeft, CreditCard,
    ShieldCheck, Truck, Package, ChevronLeft,
    CheckCircle2, Loader2, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Auth } from "@/lib/auth";
import { ShopService, getCurrencySymbol } from "@/lib/shop-service";

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        postalCode: "",
    });

    useEffect(() => {
        const initCheckout = async () => {
            const currentUser = await Auth.getCurrentUser();
            
            // Check Supabase first for logged-in users
            if (currentUser) {
                try {
                    const mapped = dbCart.map((item: any) => ({
                        ...item.product,
                        quantity: item.quantity,
                        db_id: item.id,
                        is_saved: item.is_saved
                    })).filter((item: any) => !item.is_saved);

                    if (mapped.length > 0) {
                        setCart(mapped);
                    } else {
                        router.push("/merchandise/cart");
                    }
                } catch (e) {
                    console.error("Checkout cart fetch error:", e);
                    router.push("/merchandise");
                }
            } else {
                // Fallback to localStorage for guests
                const savedCart = localStorage.getItem("merchandise_cart");
                if (savedCart) {
                    setCart(JSON.parse(savedCart));
                } else {
                    router.push("/merchandise");
                }
            }
        };

        initCheckout();
    }, [router]);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxRate = 0.1; // 10% JCT
    const taxAmount = Math.round(subtotal * taxRate);
    const shipping = subtotal > 10000 ? 0 : 500;
    const total = subtotal + taxAmount + shipping; // FIX: Included tax in total

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        localStorage.removeItem("merchandise_cart");
        setIsSuccess(true);
        setSubmitting(false);
        toast.success("Divine Transaction Complete!");
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-4 text-center">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md space-y-8"
                    >
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mx-auto border-2 border-emerald-500/20">
                            <CheckCircle2 size={48} className="animate-bounce" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tight mb-4">Payment Successful</h1>
                            <p className="text-muted-foreground font-medium">Your kingdom gear is being prepared for shipment. A confirmation email has been sent to <span className="text-primary font-bold">{formData.email}</span>.</p>
                        </div>
                        <div className="space-y-4 pt-6">
                            <Link href="/merchandise">
                                <Button className="w-full h-16 rounded-[2rem] bg-foreground text-background font-black text-sm uppercase tracking-widest shadow-xl">BACK TO SHOP</Button>
                            </Link>
                            <Link href="/">
                                <Button variant="ghost" className="w-full h-12 rounded-2xl font-black text-[10px] tracking-widest uppercase">RETURN HOME</Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            
            <main className="pt-24 md:pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-7xl">
                    {/* Back Button */}
                    <Link href="/merchandise/cart" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors mb-10 group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Cart
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        {/* 左: Checkout Form */}
                        <div className="lg:col-span-7 space-y-12">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black uppercase tracking-tight">Checkout</h1>
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Phase 3: Finalizing Divine Exchange</p>
                            </div>

                            <form onSubmit={handleCheckout} className="space-y-12">
                                {/* Section 1: Contact */}
                                <div className="space-y-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs">1</span> Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</Label>
                                            <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} className="h-14 rounded-2xl border-border bg-card/30 px-6 font-medium focus:ring-primary/20" placeholder="your@email.com" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Phone Number</Label>
                                            <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleInputChange} className="h-14 rounded-2xl border-border bg-card/30 px-6 font-medium focus:ring-primary/20" placeholder="+81 00-0000-0000" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Shipping */}
                                <div className="space-y-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs">2</span> Shipping Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">First Name</Label>
                                            <Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="h-14 rounded-2xl border-border bg-card/30 px-6 font-medium focus:ring-primary/20" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Last Name</Label>
                                            <Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="h-14 rounded-2xl border-border bg-card/30 px-6 font-medium focus:ring-primary/20" />
                                        </div>
                                        <div className="md:col-span-2 space-y-3">
                                            <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Delivery Address</Label>
                                            <Input id="address" name="address" required value={formData.address} onChange={handleInputChange} className="h-14 rounded-2xl border-border bg-card/30 px-6 font-medium focus:ring-primary/20" placeholder="Street, Apartment, suite, etc." />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">City / Region</Label>
                                            <Input id="city" name="city" required value={formData.city} onChange={handleInputChange} className="h-14 rounded-2xl border-border bg-card/30 px-6 font-medium focus:ring-primary/20" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="postalCode" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Postal Code</Label>
                                            <Input id="postalCode" name="postalCode" required value={formData.postalCode} onChange={handleInputChange} className="h-14 rounded-2xl border-border bg-card/30 px-6 font-medium focus:ring-primary/20" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 space-y-8 border-t border-border">
                                    <div className="flex items-center gap-3 p-5 bg-muted/30 rounded-[2rem] text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                        <ShieldCheck size={18} className="text-emerald-500" /> Secure Encryption via Stripe & SSL
                                    </div>
                                    <Button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="w-full h-14 rounded-2xl bg-foreground hover:bg-black text-background font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="mr-3 animate-spin" size={16} /> PROCESSING...</>
                                        ) : (
                                            <><Lock className="mr-3" size={16} /> COMPLETE TRANSACTION • {getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{total.toLocaleString()}</>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="lg:col-span-5 lg:sticky lg:top-36">
                            <Card className="bg-card border-none rounded-3xl p-6 shadow-sm border border-border/50">
                                <h3 className="text-lg font-black uppercase tracking-tight mb-6">Order Summary</h3>
                                <div className="space-y-8 mb-12">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-6">
                                            <div className="w-20 h-20 rounded-[1.5rem] bg-muted overflow-hidden flex-shrink-0 border border-border/50">
                                                <img src={item.images?.[0]} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h4 className="text-sm font-black uppercase tracking-tight truncate">{item.name}</h4>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-widest">Qty: {item.quantity} • {getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="text-sm font-black flex items-center">{getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{(item.price * item.quantity).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-6 border-t border-border/50 font-bold uppercase tracking-widest text-[9px]">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="text-foreground">{getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Tax (10% JCT)</span>
                                        <span className="text-foreground">{getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{Math.round(taxAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Global Logistics</span>
                                        <span className={shipping === 0 ? "text-emerald-500" : "text-foreground"}>{shipping === 0 ? "FREE" : `${getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}${shipping.toLocaleString()}`}</span>
                                    </div>
                                    <div className="pt-6 flex justify-between text-xl font-black text-foreground">
                                        <span className="tracking-tight">TOTAL</span>
                                        <span className="text-primary">{getCurrencySymbol("fa547adf-f820-412f-9458-d6bade11517d")}{total.toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <div className="mt-12 p-8 bg-muted/30 rounded-[2.5rem] space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Truck className="text-primary" size={20} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Kingdom Express Shipping</span>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground leading-relaxed uppercase font-black tracking-widest bg-white/50 p-4 rounded-2xl">
                                        Estimated arrival: <br />
                                        <span className="text-foreground text-xs">{new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()} - {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
