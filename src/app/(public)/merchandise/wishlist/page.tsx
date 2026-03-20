"use client";

import { useState, useEffect } from "react";
import { 
    Heart, ShoppingCart, ArrowLeft, 
    Package, Loader2, Trash2, ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ShopService, Merchandise, getCurrencySymbol } from "@/lib/shop-service";

export default function WishlistPage() {
    const [products, setProducts] = useState<Merchandise[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const ORG_ID = "fa547adf-f820-412f-9458-d6bade11517d";

    useEffect(() => {
        const initWishlist = async () => {
            const currentUser = await Auth.getCurrentUser();
            setUser(currentUser);

            if (currentUser) {
                try {
                    const wishlistIds = await ShopService.getWishlist(currentUser.id);
                    if (wishlistIds.length > 0) {
                        const allProducts = await ShopService.getMerchandise(ORG_ID);
                        setProducts(allProducts.filter(p => wishlistIds.includes(p.id)));
                    }
                } catch (e) {
                    console.error("Wishlist fetch error:", e);
                }
            } else {
                const stored = JSON.parse(localStorage.getItem("merchandise_wishlist") || "[]");
                if (stored.length > 0) {
                    const allProducts = await ShopService.getMerchandise(ORG_ID);
                    setProducts(allProducts.filter(p => stored.includes(p.id)));
                }
            }
            setLoading(false);
        };

        initWishlist();
    }, []);

    const removeFromWishlist = async (id: string) => {
        try {
            if (user) {
                await ShopService.toggleWishlist(user.id, id);
            } else {
                const stored = JSON.parse(localStorage.getItem("merchandise_wishlist") || "[]");
                const filtered = stored.filter((item: string) => item !== id);
                localStorage.setItem("merchandise_wishlist", JSON.stringify(filtered));
            }
            setProducts(prev => prev.filter(p => p.id !== id));
            toast.info("Removed from your divine wishlist");
        } catch (e) {
            toast.error("Failed to remove item");
        }
    };

    const moveToCart = async (product: Merchandise) => {
        try {
            if (user) {
                await ShopService.updateCartQuantity(user.id, product.id, 1);
            } else {
                const cart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
                const existing = cart.find((i: any) => i.id === product.id);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    cart.push({ ...product, quantity: 1 });
                }
                localStorage.setItem("merchandise_cart", JSON.stringify(cart));
            }
            window.dispatchEvent(new CustomEvent('cart-updated'));
            toast.success(`${product.name} moved to cart!`);
        } catch (e) {
            toast.error("Failed to add to cart");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 md:pt-32 pb-20 px-4">
            <div className="container mx-auto max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <Link href="/merchandise" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors mb-4 group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Store
                        </Link>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Your Liked Products</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Treasures you've marked for your kingdom collection</p>
                    </div>
                </div>

                {products.length === 0 ? (
                    <Card className="text-center py-20 border border-dashed border-border rounded-3xl bg-card/30">
                        <Heart size={48} className="mx-auto mb-6 text-muted-foreground opacity-10" />
                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">No Liked Products Yet</h3>
                        <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-8 font-medium">Heart your favorite kingdom gear to see them here.</p>
                        <Link href="/merchandise">
                            <Button className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 w-48 bg-primary shadow-lg shadow-primary/20">Explore Merchandise</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence>
                            {products.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-6 group hover:border-primary/30 transition-all shadow-sm"
                                >
                                    <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                                        <img src={product.images?.[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-center sm:text-left">
                                        <h4 className="text-sm font-black uppercase tracking-tight truncate">{product.name}</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest italic">{product.category}</p>
                                        <div className="text-lg font-black text-primary mt-2">
                                            {getCurrencySymbol(ORG_ID)}{product.price.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            onClick={() => moveToCart(product)}
                                            size="sm" 
                                            className="rounded-xl bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest h-10 px-6"
                                        >
                                            <ShoppingCart size={14} className="mr-2" /> Add to Cart
                                        </Button>
                                        <button 
                                            onClick={() => removeFromWishlist(product.id)}
                                            className="p-2.5 text-muted-foreground hover:text-destructive transition-colors rounded-xl bg-muted/50 hover:bg-destructive/5"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
