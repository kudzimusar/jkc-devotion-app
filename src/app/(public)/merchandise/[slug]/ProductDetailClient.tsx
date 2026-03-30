"use client";

import { useState, useEffect } from "react";
import { 
    ChevronLeft, Plus, Minus, ShoppingBag, 
    Truck, ShieldCheck, RefreshCcw, Star,
    Heart, Share2, Info, CheckCircle2,
    Package, ChevronDown, ChevronRight,
    MessageSquare, AlertTriangle, Shield,
    ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShopService, Merchandise, getCurrencySymbol } from "@/lib/shop-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";

import { resolvePublicOrgId } from '@/lib/org-resolver';

export default function ProductDetailClient({ slug }: { slug: string }) {
    const router = useRouter();
    
    const [product, setProduct] = useState<Merchandise | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [user, setUser] = useState<any>(null);
    const [orgId, setOrgId] = useState<string>("");

    useEffect(() => {
        const initData = async () => {
             const resolvedOrgId = await resolvePublicOrgId();
             if (resolvedOrgId) {
                setOrgId(resolvedOrgId);
                if (slug) await loadProduct(resolvedOrgId);
             }
             
             const currentUser = await Auth.getCurrentUser();
             setUser(currentUser);
             
             if (currentUser) {
                 const dbWishlist = await ShopService.getWishlist(currentUser.id);
                 setWishlist(dbWishlist);
             } else {
                 const stored = JSON.parse(localStorage.getItem("merchandise_wishlist") || "[]");
                 setWishlist(stored);
             }
        };

        initData();
        
        const handleScroll = () => setScrolled(window.scrollY > 400);
        window.addEventListener("scroll", handleScroll);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const u = await Auth.getCurrentUser();
                setUser(u);
                if (u) {
                    const dbWishlist = await ShopService.getWishlist(u.id);
                    setWishlist(dbWishlist);
                }
            } else {
                setUser(null);
                const stored = JSON.parse(localStorage.getItem("merchandise_wishlist") || "[]");
                setWishlist(stored);
            }
        });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            subscription.unsubscribe();
        };
    }, [slug]);

    useEffect(() => {
        if (product && wishlist.includes(product.id)) {
            setIsLiked(true);
        } else {
            setIsLiked(false);
        }
    }, [product?.id, wishlist]);

    const toggleLike = async () => {
        if (!product) return;
        
        if (user) {
            try {
                const liked = await ShopService.toggleWishlist(user.id, product.id);
                setIsLiked(liked);
                if (liked) {
                    setWishlist(prev => [...prev, product.id]);
                    toast.success("Added to your Kingdom Wishlist");
                } else {
                    setWishlist(prev => prev.filter(id => id !== product.id));
                }
            } catch (e) {
                toast.error("Failed to update wishlist");
            }
        } else {
            const newIsLiked = !isLiked;
            setIsLiked(newIsLiked);
            
            let newWishlist = wishlist;
            if (newIsLiked) {
                newWishlist = [...wishlist, product.id];
                toast.success("Added to your Kingdom Wishlist");
            } else {
                newWishlist = wishlist.filter(id => id !== product.id);
            }
            
            setWishlist(newWishlist);
            localStorage.setItem("merchandise_wishlist", JSON.stringify(newWishlist));
        }
    };

    async function loadProduct(targetOrgId?: string) {
        const fetchId = targetOrgId || orgId;
        if (!fetchId) return;

        try {
            setLoading(true);
            const data = await ShopService.getProductBySlug(fetchId, slug);
            if (data) {
                // Ensure data is rich for our UI
                const enriched: Merchandise = {
                    ...data,
                    subtitle: data.subtitle || "Kingdom Essentials for the Prophetic Age",
                    features: data.features || ["Divine protection and spiritual awareness", "Premium quality materials with symbolic significance", "Designed for the modern kingdom citizen", "Equipped for supernatural daily living"],
                    specifications: data.specifications || { "Material": "Prophetic Grade", "Origin": "Kingdom Design Lab", "Version": "2026 Release", "Quality": "Premium" },
                    long_description: data.long_description || data.description || "This exclusive JKC Store product is designed to equip you for the vision. Every item in our collection is carefully curated to reflect the glory and excellence of the Kingdom of God, serving as a reminder of your divine purpose and identity."
                };
                setProduct(enriched);
            }
        } catch (err) {
            toast.error("Product not found");
        } finally {
            setLoading(false);
        }
    }

    const addToCart = async () => {
        if (!product) return;
        
        if (user) {
            try {
                // Get existing item from DB to increment quantity
                const cart = await ShopService.getCart(user.id);
                const existing = cart.find((i: any) => i.product_id === product.id);
                const newQuantity = (existing?.quantity || 0) + quantity;
                
                await ShopService.updateCartQuantity(user.id, product.id, newQuantity);
                toast.success(`Victory! ${product.name} added to your cloud cart.`);
                
                // Dispatch event for Navbar
                window.dispatchEvent(new CustomEvent('cart-updated'));
            } catch (e) {
                toast.error("Failed to add to cart");
            }
        } else {
            // Guest mode
            const cart = JSON.parse(localStorage.getItem("merchandise_cart") || "[]");
            const existing = cart.find((item: any) => item.id === product.id);
            
            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.push({ 
                    id: product.id, 
                    name: product.name, 
                    price: product.price,
                    images: product.images,
                    org_id: product.org_id,
                    quantity: quantity 
                });
            }
            
            localStorage.setItem("merchandise_cart", JSON.stringify(cart));
            toast.success(`Victory! ${product.name} added to cart.`);
            
            // Dispatch event for Navbar
            window.dispatchEvent(new CustomEvent('cart-updated'));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                        <ShoppingBag className="w-12 h-12 text-primary" />
                    </motion.div>
                    <p className="font-black text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Equipping the Vision...</p>
                </div>
            </div>
        );
    }

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center">
             <div className="text-center">
                <h1 className="text-4xl font-black mb-4">Product Not Found</h1>
                <Link href="/merchandise">
                    <Button>Back to Store</Button>
                </Link>
             </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-foreground flex flex-col">
            
            <main className="flex-1 pt-20 md:pt-24 pb-20">
                <div className="container mx-auto max-w-7xl px-4">
                    {/* Back Button */}
                    <Link href="/merchandise" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all mb-10 group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Store
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xxl:gap-24 items-start">
                        {/* 1. IMAGE GALLERY */}
                        <div className="space-y-6">
                            <div className="relative aspect-square md:aspect-[4/5] bg-[#f8f9fa] rounded-[3rem] overflow-hidden border border-border/50 shadow-sm group mx-auto md:ml-0 max-h-[500px] flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    <motion.img 
                                        key={selectedImage}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        src={product.images?.[selectedImage] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" 
                                    />
                                </AnimatePresence>
                                <div className="absolute top-6 right-6">
                                    <Button 
                                        size="icon" 
                                        onClick={toggleLike}
                                        className={`h-11 w-11 rounded-full shadow-xl border-none transition-all active:scale-90 ${isLiked ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-white/90'}`}
                                    >
                                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Thumbnails */}
                            {product.images?.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                    {product.images.map((img, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => setSelectedImage(i)}
                                            className={`w-24 h-24 rounded-2xl flex-shrink-0 overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:border-gray-200'}`}
                                        >
                                            <img src={img} alt={`View ${i+1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. PRODUCT INFO */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-2">
                                    {product.category?.name || "Global Publication"}
                                </Badge>
                                <div>
                                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-none mb-2">
                                        {product.name}
                                    </h1>
                                    <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-[0.05em] leading-relaxed">
                                        {product.subtitle}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6 pt-2">
                                    <div className="flex items-center gap-1 text-amber-500">
                                        {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= 4 ? "currentColor" : "none"} className={s === 5 ? "opacity-30" : ""} />)}
                                        <span className="text-xs font-black ml-2 text-foreground">4.9</span>
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-l border-border pl-6">124 REVIEWS</span>
                                </div>
                            </div>

                            <div className="bg-[#fcfcff] border border-border/50 rounded-[2.5rem] p-8 md:p-10 space-y-8 shadow-sm">
                                <div className="flex items-baseline gap-4">
                                    <div className="text-4xl font-black text-foreground">
                                        {getCurrencySymbol(orgId)}{product.price.toLocaleString()}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">(税込 / TAX INCLUDED)</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                                <CheckCircle2 size={16} className="text-emerald-500" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">In Stock & Ready</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                                <Truck size={16} className="text-indigo-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest italic">Free Shipping Over {getCurrencySymbol(orgId)}10,000</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                                <ShieldCheck size={16} className="text-blue-500" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Global Kingdom Guarantee</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center gap-4">
                                    <div className="flex items-center bg-white border border-border rounded-2xl p-1 gap-2 shadow-sm">
                                        <Button onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="ghost" className="h-12 w-12 rounded-xl text-foreground hover:bg-muted" size="icon"><Minus size={16} /></Button>
                                        <span className="w-10 text-center font-black text-sm">{quantity}</span>
                                        <Button onClick={() => setQuantity(quantity + 1)} variant="ghost" className="h-12 w-12 rounded-xl text-foreground hover:bg-muted" size="icon"><Plus size={16} /></Button>
                                    </div>
                                    <Button 
                                        onClick={addToCart}
                                        className="flex-1 h-16 rounded-[2rem] bg-foreground hover:bg-black text-background font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                                    >
                                        <ShoppingBag className="mr-3" size={18} /> Add to Sanctuary Cart
                                    </Button>
                                </div>
                            </div>

                            {/* Features & Narrative */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="h-px w-8 bg-primary" /> Key Revelations
                                </h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {product.features?.map((f, i) => (
                                        <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-[#fafafa] border border-border/30 group hover:border-primary/30 transition-all">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0 group-hover:scale-150 transition-transform" />
                                            <span className="text-sm font-medium leading-relaxed">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Tabs / Accordion for Details */}
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="narrative" className="border-border">
                                    <AccordionTrigger className="text-[10px] font-black uppercase tracking-widest py-6">The Narrative</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground leading-relaxed font-medium pt-2 pb-8">
                                        <div className="prose prose-sm max-w-none prose-neutral">
                                            {product.long_description?.split('\n').map((para, i) => (
                                                <p key={i} className={i > 0 ? "mt-4" : ""}>{para}</p>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="specifications" className="border-border">
                                    <AccordionTrigger className="text-[10px] font-black uppercase tracking-widest py-6">Specifications</AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-8">
                                        <div className="grid grid-cols-2 gap-y-4 border border-border p-6 rounded-3xl">
                                            {product.specifications && Object.entries(product.specifications).map(([k, v]) => (
                                                <div key={k} className="flex flex-col gap-1">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{k}</span>
                                                    <span className="text-sm font-black uppercase">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="faqs" className="border-border">
                                    <AccordionTrigger className="text-[10px] font-black uppercase tracking-widest py-6">FAQs</AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-8 space-y-4">
                                        <div className="space-y-4">
                                            <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Frequently Asked Questions</p>
                                            <div className="space-y-6">
                                                {product.faqs && product.faqs.length > 0 ? (
                                                    product.faqs.map((faq, i) => (
                                                        <div key={i}>
                                                            <p className="text-sm font-black mb-1 uppercase">{faq.question}</p>
                                                            <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <>
                                                        <div>
                                                            <p className="text-sm font-black mb-1 uppercase">Global Shipping Reach?</p>
                                                            <p className="text-xs text-muted-foreground leading-relaxed">We ship to over 180 nations worldwide using premium logistics partners.</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black mb-1 uppercase">Kingdom Gift Wrapping?</p>
                                                            <p className="text-xs text-muted-foreground leading-relaxed">Yes, elegant gift wrapping with a personalized note from the ministry is available at checkout.</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Mobile Add to Cart */}
            <AnimatePresence>
                {scrolled && (
                    <motion.div 
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-border/50 p-6 lg:hidden shadow-[0_-20px_40px_rgba(0,0,0,0.1)]"
                    >
                        <div className="flex items-center gap-6 max-w-lg mx-auto">
                            <div className="flex-1">
                                <p className="text-[9px] font-black uppercase tracking-widest truncate text-muted-foreground mb-1">{product.name}</p>
                                <p className="text-xl font-black text-foreground">{getCurrencySymbol(orgId)}{product.price.toLocaleString()}</p>
                            </div>
                            <Button 
                                onClick={addToCart}
                                className="h-14 px-8 rounded-2xl bg-foreground text-background font-black text-[10px] uppercase tracking-widest shadow-xl flex-shrink-0 active:scale-95"
                            >
                                <ShoppingBag className="mr-2" size={16} /> ADD TO CART
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
