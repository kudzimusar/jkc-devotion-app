"use client";

import { useState, useEffect, useMemo } from "react";
import { 
    ShoppingBag, ShoppingCart, ArrowRight, 
    Package, Loader2, Sparkles, Filter,
    Search, ChevronRight, Star, Truck,
    Heart, LayoutGrid, List, ShieldCheck, RefreshCcw, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { ShopService, Merchandise, getCurrencySymbol } from "@/lib/shop-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";

export default function MerchandisePage() {
    const [products, setProducts] = useState<Merchandise[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [user, setUser] = useState<any>(null);

    // Japan Kingdom Church ORG_ID
    const ORG_ID = "fa547adf-f820-412f-9458-d6bade11517d"; 

    useEffect(() => {
        const initData = async () => {
            const currentUser = await Auth.getCurrentUser();
            setUser(currentUser);
            
            await loadProducts();

            if (currentUser) {
                // 1. Sync local cart if any
                const localCart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
                if (localCart.length > 0) {
                    try {
                        await ShopService.syncCart(currentUser.id, localCart);
                    } catch (e) {
                        console.error("Cart sync error:", e);
                    }
                }
                
                // 2. Fetch from DB
                try {
                    const [dbWishlist, dbCart] = await Promise.all([
                        ShopService.getWishlist(currentUser.id),
                        ShopService.getCart(currentUser.id)
                    ]);
                    setWishlist(dbWishlist);
                    setCartCount(dbCart.filter((item: any) => !item.is_saved).reduce((acc: number, item: any) => acc + item.quantity, 0));
                } catch (e: any) {
                    console.error("Data fetch error:", e.message || e);
                }
            } else {
                // Guest mode
                updateCartCount();
                const stored = JSON.parse(localStorage.getItem("merchandise_wishlist") || "[]");
                setWishlist(stored);
            }
        };

        initData();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const currentUser = await Auth.getCurrentUser();
                setUser(currentUser);
                if (currentUser) {
                     const localCart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
                     if (localCart.length > 0) await ShopService.syncCart(currentUser.id, localCart);
                     const [dbWishlist, dbCart] = await Promise.all([
                        ShopService.getWishlist(currentUser.id),
                        ShopService.getCart(currentUser.id)
                     ]);
                     setWishlist(dbWishlist);
                     setCartCount(dbCart.filter((item: any) => !item.is_saved).reduce((acc: number, item: any) => acc + item.quantity, 0));
                }
            } else {
                setUser(null);
                updateCartCount();
                const stored = JSON.parse(localStorage.getItem("merchandise_wishlist") || "[]");
                setWishlist(stored);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const toggleLike = async (id: string, name: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (user) {
            try {
                const isLiked = await ShopService.toggleWishlist(user.id, id);
                if (isLiked) {
                    setWishlist(prev => [...prev, id]);
                    toast.success(`Liked ${name}`);
                } else {
                    setWishlist(prev => prev.filter(item => item !== id));
                    toast.success(`Unliked ${name}`);
                }
            } catch (e) {
                toast.error("Failed to update wishlist");
            }
        } else {
            // Guest mode
            let newWishlist: string[];
            if (wishlist.includes(id)) {
                newWishlist = wishlist.filter(item => item !== id);
                toast.success(`Unliked ${name}`);
            } else {
                newWishlist = [...wishlist, id];
                toast.success(`Liked ${name}`);
            }
            setWishlist(newWishlist);
            localStorage.setItem("merchandise_wishlist", JSON.stringify(newWishlist));
        }
    };

    async function loadProducts() {
        try {
            setLoading(true);
            const productsData = await ShopService.getProducts(ORG_ID);
            setProducts(productsData);
        } catch (err) {
            console.error(err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
        setCartCount(cart.reduce((acc: number, item: any) => acc + item.quantity, 0));
    };

    const addToCart = async (product: Merchandise) => {
        if (user) {
            try {
                // Get existing item from DB to increment quantity
                const cart = await ShopService.getCart(user.id);
                const existing = cart.find(i => i.product_id === product.id);
                const newQuantity = (existing?.quantity || 0) + 1;
                
                await ShopService.updateCartQuantity(user.id, product.id, newQuantity);
                setCartCount(prev => prev + 1);
                toast.success(`${product.name} added to your cloud cart!`);
                
                // Dispatch event for Navbar
                window.dispatchEvent(new CustomEvent('cart-updated'));
            } catch (e) {
                toast.error("Failed to add to cart");
            }
        } else {
            // Guest mode
            const cart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
            const existingItem = cart.find((item: any) => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ 
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    images: product.images,
                    org_id: product.org_id,
                    quantity: 1 
                });
            }
            
            localStorage.setItem("merchandise_cart", JSON.stringify(cart));
            updateCartCount();
            toast.success(`${product.name} added to cart!`);
            
            // Dispatch event for Navbar
            window.dispatchEvent(new CustomEvent('cart-updated'));
        }
    };

    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredProducts = useMemo(() => products.filter(p => 
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
    ), [products, debouncedSearch]);

    // Dynamic Hero Product selection
    const featuredProduct = useMemo(() => products.find(p => (p as any).is_featured) || products[0], [products]);

    return (
        <div className="min-h-screen bg-background text-foreground pt-16 md:pt-20">
            
            {/* 1. HERO / CAMPAIGN */}
            <section className="bg-foreground text-background py-10 md:py-16 px-4 overflow-hidden relative">
                <div className="absolute inset-0 opacity-10">
                    {/* Abstract kingdom pattern background */}
                    <div className="grid grid-cols-12 h-full opacity-20">
                        {Array.from({ length: 144 }).map((_, i) => (
                            <div key={i} className="border border-background/20" />
                        ))}
                    </div>
                </div>
                
                <div className="container mx-auto max-w-7xl relative z-10 text-center md:text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white"
                            >
                                <Sparkles size={16} className="text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap">Kingdom Exclusive Collection</span>
                            </motion.div>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <h2 className="text-primary font-black uppercase tracking-[0.3em] text-[8px]">{featuredProduct?.category?.name || "Prophetic Essentials"}</h2>
                                <h1 className="text-3xl md:text-5xl lg:text-5xl font-black tracking-tight uppercase leading-[0.95]">
                                    {featuredProduct ? (
                                        <>
                                            {featuredProduct.name.split(' ').slice(0, 2).join(' ')} <br />
                                            <span className="text-primary italic text-2xl md:text-4xl lg:text-4xl">
                                                {featuredProduct.name.split(' ').slice(2).join(' ')}
                                            </span>
                                        </>
                                    ) : (
                                        <>EQUIP THE <br /><span className="text-primary italic text-2xl md:text-4xl lg:text-4xl">VISION</span></>
                                    )}
                                </h1>
                            </motion.div>
                            
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-base text-white/60 font-medium max-w-sm line-clamp-2"
                            >
                                {featuredProduct?.description || "Premium gear designed to fuel your spirit and manifest your Kingdom identity."}
                            </motion.p>

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                {featuredProduct ? (
                                    <>
                                        <Link href={`/merchandise/${featuredProduct.slug}`}>
                                            <Button className="h-12 px-8 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-white/90 shadow-2xl w-full sm:w-auto">
                                                Order Now - {getCurrencySymbol(ORG_ID)}{featuredProduct.price.toLocaleString()}
                                            </Button>
                                        </Link>
                                        <Link href={`/merchandise/${featuredProduct.slug}`}>
                                            <Button variant="outline" className="h-12 px-8 rounded-full border-2 border-white/20 text-white font-black text-[10px] uppercase tracking-widest bg-transparent hover:bg-white/10 w-full sm:w-auto">
                                                SEE MORE
                                            </Button>
                                        </Link>
                                    </>
                                ) : (
                                    <Button variant="outline" onClick={() => {
                                        const el = document.getElementById('collection');
                                        el?.scrollIntoView({ behavior: 'smooth' });
                                    }} className="h-12 px-8 rounded-full border-2 border-white/20 text-white font-black text-[10px] uppercase tracking-widest bg-transparent hover:bg-white/10 w-full sm:w-auto">
                                        Explore Full Collection
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Visual element (Featured Product) */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            className="hidden md:block relative aspect-square"
                        >
                            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                            <div className="relative w-full h-full bg-white/5 backdrop-blur-xl rounded-[4rem] border border-white/10 flex items-center justify-center p-8">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full p-12">
                                     <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transform rotate-2 border-2 border-white/10 overflow-hidden group relative">
                                         <img 
                                            src={featuredProduct?.images?.[0] || "/jkc-devotion-app/images/books/book-power-of-purpose.png"} 
                                            alt={featuredProduct?.name || "Featured Product"} 
                                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                         />
                                         {featuredProduct && (
                                             <div className="absolute bottom-8 left-8 right-8 z-10 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 transform -rotate-1">
                                                 <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-1 text-primary/80">Featured {featuredProduct.category?.name || "Resource"}</p>
                                                 <h3 className="text-xl font-black uppercase tracking-tight leading-none text-white">{featuredProduct.name}</h3>
                                             </div>
                                         )}
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 2. STICKY SEARCH BAR */}
            <div className="sticky top-16 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50 py-4 transition-all duration-300">
                <div className="container mx-auto max-w-7xl px-4 flex justify-center">
                    <div className="relative w-full max-w-2xl group">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative flex items-center bg-white border-2 border-border/50 rounded-full px-6 h-14 shadow-lg group-focus-within:border-primary/50 transition-all">
                            <Search size={20} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="SEARCH PRODUCTS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-[12px] font-black uppercase tracking-widest px-4 w-full placeholder:text-muted-foreground/30"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery("")}
                                    className="p-1 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X size={16} className="text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. COLLECTION AREA */}
            <main className="container mx-auto max-w-7xl px-4 py-20">
                {/* Filters & Sorting */}
                <div id="collection" className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 px-2 scroll-mt-32">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-black uppercase tracking-tight">The Collection</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Found {filteredProducts.length} Kingdom Resources</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white border-2 border-border/50 rounded-xl p-1">
                            <Button 
                                variant={viewMode === "grid" ? "default" : "ghost"} 
                                size="icon" 
                                onClick={() => setViewMode("grid")}
                                className="h-8 w-8 rounded-lg"
                            >
                                <LayoutGrid size={16} />
                            </Button>
                            <Button 
                                variant={viewMode === "list" ? "default" : "ghost"} 
                                size="icon" 
                                onClick={() => setViewMode("list")}
                                className="h-8 w-8 rounded-lg"
                            >
                                <List size={16} />
                            </Button>
                        </div>
                        <Button variant="outline" className="h-10 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Filter size={14} /> Refine
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <p className="font-black text-[10px] uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Gathering Global Harvest...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-40 border-4 border-dashed border-border rounded-[4rem] bg-white">
                        <Package size={80} className="mx-auto mb-8 text-muted-foreground opacity-20" />
                        <h3 className="text-4xl font-black uppercase tracking-tight mb-4">Stock In Transit</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto font-medium">Our collection is currently being restocked for the new season. Check back soon for the Kingdom exclusive drop.</p>
                        <Button variant="outline" onClick={loadProducts} className="mt-10 rounded-full h-14 px-10 font-black uppercase text-xs tracking-widest border-2">Refresh Store</Button>
                    </div>
                ) : (
                    <div className={viewMode === "grid" 
                        ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4" 
                        : "flex flex-col gap-4"
                    }>
                        {filteredProducts.map((product, idx) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.03 }}
                            >
                                <Card className={`group relative overflow-hidden bg-white border border-border/50 hover:border-primary/30 transition-all duration-300 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md ${viewMode === "list" ? "flex flex-row h-32 md:h-40" : "flex flex-col"}`}>
                                    {/* Link covers the image and title area but not the CTA button */}
                                    <div className="relative h-full flex flex-col flex-1">
                                        <Link href={`/merchandise/${product.slug}`} className="block relative overflow-hidden flex-1">
                                            {/* Product Image */}
                                            <div className={`${viewMode === "list" ? "w-24 md:w-32 h-full flex-shrink-0" : "aspect-[4/5]"} relative overflow-hidden bg-muted/30`}>
                                                <img 
                                                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'} 
                                                    alt={product.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                />
                                                
                                                {/* Overlays */}
                                                <div className="absolute top-2 left-2 transition-all duration-300 z-10">
                                                    <Button 
                                                        size="icon" 
                                                        onClick={(e) => toggleLike(product.id, product.name, e)}
                                                        className={`h-7 w-7 rounded-full shadow-lg border-none transition-all active:scale-90 ${wishlist.includes(product.id) ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-md text-black hover:bg-white'}`}
                                                    >
                                                        <Heart size={12} fill={wishlist.includes(product.id) ? "currentColor" : "none"} strokeWidth={3} />
                                                    </Button>
                                                </div>

                                                {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                                                    <div className="absolute top-2 right-2 z-10">
                                                        <Badge className="bg-red-500 text-white font-black text-[7px] px-2 py-1 rounded-full uppercase tracking-widest border-none">LOW STOCK</Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        <CardContent className={`p-3 md:p-4 flex flex-col ${viewMode === "list" ? "flex-1 justify-center" : ""}`}>
                                            <div className="space-y-1.5">
                                                <Link href={`/merchandise/${product.slug}`} className="block group/title">
                                                    <div className="flex flex-col">
                                                        <span className="text-[7px] font-black text-primary/80 uppercase tracking-widest mb-0.5">{product.category?.name || 'Publication'}</span>
                                                        <h3 className="text-[11px] md:text-[13px] font-black text-foreground uppercase tracking-tight group-hover/title:text-primary transition-colors leading-tight line-clamp-1">
                                                            {product.name}
                                                        </h3>
                                                    </div>
                                                </Link>
                                                
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="text-sm md:text-base font-black text-foreground">{getCurrencySymbol(ORG_ID, "Japan")}{product.price.toLocaleString()}</div>
                                                    <div className="flex items-center gap-0.5 text-amber-500">
                                                        <Star size={8} fill="currentColor" />
                                                        <span className="text-[7px] font-black tracking-widest mt-0.5">4.9</span>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-[9px] text-muted-foreground font-medium line-clamp-1 leading-relaxed hidden sm:block">
                                                    {product.description}
                                                </p>
                                                
                                                <div className="pt-1.5">
                                                    <Button 
                                                        onClick={() => addToCart(product)}
                                                        disabled={product.stock_quantity === 0}
                                                        className="w-full h-8 rounded-lg bg-foreground hover:bg-black text-background font-black text-[8px] uppercase tracking-widest active:scale-95 transition-all"
                                                    >
                                                        <ShoppingCart className="mr-1.5" size={10} />
                                                        Add to Cart
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* 4. VALUE PROPS / TRUST */}
            <section className="py-32 border-t border-border/50 bg-white">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mx-auto border-2 border-primary/10">
                                <Truck size={36} />
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight">Rapid Global Logistics</h4>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">Seamless shipping across Japan and to all nations. EMS, Yamato, and Sagawa integrated.</p>
                        </div>
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mx-auto border-2 border-primary/10">
                                <ShieldCheck size={36} />
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight">Kingdom Secure Checkout</h4>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">Bank-grade encryption for all transactions. Visa, Mastercard, Stripe, and PayPal accepted.</p>
                        </div>
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mx-auto border-2 border-primary/10">
                                <RefreshCcw size={36} />
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tight">Satisfaction Guarantee</h4>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">Not satisfied with your kingdom gear? We offer extended 30-day exchange windows for all orders.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-foreground text-background">
                <div className="container mx-auto max-w-5xl px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">Fuel the Harvest</h2>
                    <p className="text-lg font-medium text-white/60 mb-12 max-w-2xl mx-auto italic">
                        Every purchase directly funds our Japan and Global mission outreaches. Join the movement.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input 
                            type="email" 
                            placeholder="JOIN THE KINGDOM LIST" 
                            className="h-16 rounded-full bg-white/10 border border-white/20 px-8 text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-white/30 flex-1"
                        />
                        <Button className="h-16 px-10 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-white/90">SUBSCRIBE</Button>
                    </div>
                </div>
            </section>

        </div>
    );
}
