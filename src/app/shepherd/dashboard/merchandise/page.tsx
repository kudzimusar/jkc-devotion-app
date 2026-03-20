"use client";

import { useState, useEffect } from "react";
import { 
    Plus, Search, Filter, ShoppingBag, Package, ListChecks, 
    ArrowLeft, Loader2, Trash2, Edit3, Save, X, 
    Image as ImageIcon, ChevronRight, Star, AlertTriangle,
    BarChart3, TrendingUp, History, Settings, Info,
    CheckCircle2, Globe, Boxes
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShopService, Merchandise, MerchandiseOrder, MerchandiseCategory, MerchandiseStatus, getCurrencySymbol } from "@/lib/shop-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAdminCtx } from "../layout";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function MerchandiseAdminPage() {
    const [activeTab, setActiveTab] = useState<"products" | "orders" | "inventory" | "categories">("products");
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Merchandise[]>([]);
    const [orders, setOrders] = useState<MerchandiseOrder[]>([]);
    const [categories, setCategories] = useState<MerchandiseCategory[]>([]);

    // Form States
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: "",
        subtitle: "",
        description: "",
        long_description: "",
        price: 0,
        discount_price: 0,
        stock_quantity: 0,
        category_id: "",
        status: "published" as MerchandiseStatus,
        slug: "",
        images: [] as string[],
        features: [] as string[],
        specifications: {} as Record<string, string>,
        faqs: [] as { question: string; answer: string }[],
        delivery_options: [] as { name: string; price: number; time: string }[]
    });

    const [shippingName, setShippingName] = useState("");
    const [shippingPrice, setShippingPrice] = useState(0);
    const [shippingTime, setShippingTime] = useState("");

    const [faqQuestion, setFaqQuestion] = useState("");
    const [faqAnswer, setFaqAnswer] = useState("");
    const [imageInput, setImageInput] = useState("");

    const [featureInput, setFeatureInput] = useState("");
    const [specKey, setSpecKey] = useState("");
    const [specVal, setSpecVal] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<MerchandiseOrder | null>(null);
    const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

    const [newCategory, setNewCategory] = useState({
        name: "",
        description: "",
        slug: ""
    });

    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (orgId) loadData();
    }, [orgId]);

    async function loadData() {
        if (!orgId) return;
        try {
            setLoading(true);

            const [productsData, categoriesData, ordersData] = await Promise.all([
                ShopService.getProducts(orgId),
                ShopService.getCategories(orgId),
                ShopService.getOrgOrders(orgId)
            ]);

            setProducts(productsData);
            setCategories(categoriesData);
            setOrders(ordersData);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load merchandise HQ.");
        } finally {
            setLoading(false);
        }
    }

    const addFeature = () => {
        if (!featureInput.trim()) return;
        setNewProduct(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
        setFeatureInput("");
    };

    const addSpec = () => {
        if (!specKey.trim() || !specVal.trim()) return;
        setNewProduct(prev => ({ 
            ...prev, 
            specifications: { ...prev.specifications, [specKey.trim()]: specVal.trim() } 
        }));
        setSpecKey("");
        setSpecVal("");
    };
    const addFAQ = () => {
        if (!faqQuestion.trim() || !faqAnswer.trim()) return;
        setNewProduct(prev => ({ 
            ...prev, 
            faqs: [...(prev.faqs || []), { question: faqQuestion.trim(), answer: faqAnswer.trim() }] 
        }));
        setFaqQuestion("");
        setFaqAnswer("");
    };

    const addImage = () => {
        if (!imageInput.trim()) return;
        setNewProduct(prev => ({ ...prev, images: [...prev.images, imageInput.trim()] }));
        setImageInput("");
    };

    const addShipping = () => {
        if (!shippingName.trim()) return;
        setNewProduct(prev => ({ 
            ...prev, 
            delivery_options: [...(prev.delivery_options || []), { name: shippingName.trim(), price: shippingPrice, time: shippingTime.trim() }] 
        }));
        setShippingName("");
        setShippingPrice(0);
        setShippingTime("");
    };
    async function handleCreateProduct() {
        if (!orgId) return;
        try {
            const slug = newProduct.slug || newProduct.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
            await ShopService.upsertProduct({
                ...newProduct,
                org_id: orgId,
                slug,
                metadata: {}
            });
            toast.success("Product launched successfully!");
            setIsAddProductOpen(false);
            loadData();
            // Reset form
            setNewProduct({ 
                name: "", subtitle: "", description: "", long_description: "", 
                price: 0, discount_price: 0, stock_quantity: 0, category_id: "", 
                status: "published", slug: "", images: [], features: [], specifications: {},
                faqs: [], delivery_options: []
            });
        } catch (err) {
            toast.error("Deployment failed.");
        }
    }

    async function handleUpdateOrderStatus(orderId: string, status: any) {
        try {
            await ShopService.updateOrderStatus(orderId, status);
            toast.success(`Order designated as ${status}`);
            loadData();
        } catch (err) {
            toast.error("Protocol update failed.");
        }
    }

    const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length;
    const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;

    return (
        <div className="min-h-screen bg-[#080c14] text-white p-6 md:p-10 space-y-10 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Link href="/ministry-dashboard" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <ArrowLeft size={16} className="text-white/60" />
                        </Link>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-400">Inventory Intelligence HQ</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Merchandise <span className="text-violet-500 italic">Control</span></h1>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={loadData} className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 h-12 w-12 p-0">
                        <Loader2 className={loading ? "animate-spin" : ""} size={18} />
                    </Button>
                    <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs tracking-widest uppercase shadow-2xl shadow-indigo-600/20">
                                <Plus className="mr-2" size={20} /> Launch New Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-[#0d1421] border-white/10 rounded-[3rem] p-0 overflow-hidden shadow-2xl">
                            <div className="h-[80vh] overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                <DialogHeader>
                                    <DialogTitle className="text-3xl font-black uppercase tracking-tight">Product Deployment</DialogTitle>
                                </DialogHeader>
                                
                                <div className="grid grid-cols-2 gap-8">
                                    {/* Column 1: Core Info */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Identity (Name)</label>
                                            <Input placeholder="Kingdom Hoodie v2" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="h-14 rounded-2xl bg-white/5 border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Hook (Subtitle)</label>
                                            <Input placeholder="Premium Organic Comfort" value={newProduct.subtitle} onChange={e => setNewProduct({...newProduct, subtitle: e.target.value})} className="h-14 rounded-2xl bg-white/5 border-white/10" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Standard Price ({getCurrencySymbol(orgId || "")})</label>
                                                <Input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} className="h-14 rounded-2xl bg-white/5 border-white/10" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Discount Price (Opt)</label>
                                                <Input type="number" value={newProduct.discount_price} onChange={e => setNewProduct({...newProduct, discount_price: parseFloat(e.target.value)})} className="h-14 rounded-2xl bg-white/5 border-white/10" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Unit Allocation (Stock)</label>
                                            <Input type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value)})} className="h-14 rounded-2xl bg-white/5 border-white/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Broad Description</label>
                                            <Textarea placeholder="Core value proposition..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="rounded-2xl bg-white/5 border-white/10 min-h-[100px]" />
                                        </div>
                                    </div>

                                    {/* Column 2: Rich Data & Media */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Narrative (Long Description)</label>
                                            <Textarea placeholder="The story behind the gear..." value={newProduct.long_description} onChange={e => setNewProduct({...newProduct, long_description: e.target.value})} className="rounded-2xl bg-white/5 border-white/10 min-h-[120px]" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Visual Assets (Multi-Image Gallery)</label>
                                            <div className="flex gap-2">
                                                <Input placeholder="Image URL..." value={imageInput} onChange={e => setImageInput(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10" />
                                                <Button onClick={addImage} variant="outline" className="h-11 rounded-xl border-white/10">+</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {newProduct.images.map((img, i) => (
                                                    <div key={i} className="relative group/img">
                                                        <img src={img} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                                                        <button onClick={() => setNewProduct({...newProduct, images: newProduct.images.filter((_, idx) => idx !== i)})} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Features List */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 text-indigo-400">Value Features (Rich Data)</label>
                                            <div className="flex gap-2">
                                                <Input placeholder="Add feature..." value={featureInput} onChange={e => setFeatureInput(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10" />
                                                <Button onClick={addFeature} variant="outline" className="h-11 rounded-xl border-white/10">+</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {newProduct.features.map((f, i) => (
                                                    <Badge key={i} className="bg-white/5 text-white/60 border-white/10 px-3 py-1 uppercase text-[8px] font-black">
                                                        {f} <X size={10} className="ml-2 cursor-pointer" onClick={() => setNewProduct({...newProduct, features: newProduct.features.filter((_, idx) => idx !== i)})} />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Specs Table */}
                                        <div className="space-y-3 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 text-emerald-400">Technical Specs (JSON)</label>
                                            <div className="flex gap-2">
                                                <Input placeholder="Key (e.g. Fabric)" value={specKey} onChange={e => setSpecKey(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10 w-1/3" />
                                                <Input placeholder="Value (e.g. Silk)" value={specVal} onChange={e => setSpecVal(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10 flex-1" />
                                                <Button onClick={addSpec} variant="outline" className="h-11 rounded-xl border-white/10">+</Button>
                                            </div>
                                            <div className="space-y-1">
                                                {Object.entries(newProduct.specifications).map(([k, v]) => (
                                                    <div key={k} className="flex justify-between items-center bg-white/5 p-2 px-4 rounded-xl text-[10px] font-bold">
                                                        <span className="text-white/40 uppercase tracking-widest">{k}</span>
                                                        <span className="text-white">{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Shipping Options */}
                                        <div className="space-y-3 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 text-blue-400">Logistics (Shipping Options)</label>
                                            <div className="space-y-2">
                                                <Input placeholder="Option Name (e.g. Express)" value={shippingName} onChange={e => setShippingName(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10 w-full" />
                                                <div className="flex gap-2">
                                                    <Input type="number" placeholder="Price" value={shippingPrice} onChange={e => setShippingPrice(parseFloat(e.target.value))} className="h-11 rounded-xl bg-white/5 border-white/10 w-1/3" />
                                                    <Input placeholder="Est. Time (e.g. 2-3 days)" value={shippingTime} onChange={e => setShippingTime(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10 flex-1" />
                                                    <Button onClick={addShipping} variant="outline" className="h-11 rounded-xl border-white/10">+</Button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {newProduct.delivery_options?.map((d, i) => (
                                                    <div key={i} className="bg-white/5 p-3 rounded-xl flex justify-between items-center group/ship">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-white uppercase">{d.name} — {getCurrencySymbol(orgId || "")}{d.price}</span>
                                                            <span className="text-[8px] text-white/40">{d.time}</span>
                                                        </div>
                                                        <button onClick={() => setNewProduct({...newProduct, delivery_options: (newProduct.delivery_options || []).filter((_, idx) => idx !== i)})} className="text-white/20 hover:text-red-400 p-1 opacity-0 group-hover/ship:opacity-100 transition-opacity">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="p-10 bg-white/5 border-t border-white/10">
                                <Button onClick={handleCreateProduct} className="w-full h-16 bg-white text-black font-black rounded-2xl text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 uppercase">Initialize Deployment</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                <StatCard label="Live Collection" value={products.length} icon={Boxes} color="indigo" />
                <StatCard label="Pending Orders" value={orders.filter(o => o.status === 'pending').length} icon={ShoppingBag} color="amber" />
                <StatCard label="Low Stocks" value={lowStockCount} icon={AlertTriangle} color="red" badge={lowStockCount > 0 ? "ACTION REQ" : undefined} />
                <StatCard label="Total Revenue" value={`${getCurrencySymbol(orgId || "")}${orders.reduce((acc, o) => acc + o.total_amount, 0).toLocaleString()}`} icon={TrendingUp} color="emerald" />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit relative z-10">
                {[
                    { id: "products", label: "Inventory", icon: Package },
                    { id: "orders", label: "Logistics", icon: ListChecks },
                    { id: "inventory", label: "Stock Logs", icon: History },
                    { id: "categories", label: "Clusters", icon: Filter },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                            activeTab === tab.id
                                ? "bg-white text-black shadow-xl"
                                : "text-white/40 hover:text-white"
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="relative z-10 min-h-[500px]"
                >
                    {activeTab === "products" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <Card key={product.id} className="group overflow-hidden bg-[#0d1421] border-white/10 rounded-[2.5rem] hover:border-indigo-500/50 transition-all shadow-2xl relative">
                                    <div className="aspect-[4/3] bg-white/5 relative overflow-hidden">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/20">
                                                <Package size={48} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <Badge className="bg-black/60 backdrop-blur-md text-white border-0 font-black text-[8px] uppercase tracking-widest h-6 px-3">
                                                {product.category?.name || "Uncategorized"}
                                            </Badge>
                                        </div>
                                        
                                        {/* Stock Level Overlay */}
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <div className={`p-3 rounded-2xl backdrop-blur-xl border flex items-center justify-between ${
                                                product.stock_quantity === 0 ? "bg-red-500/20 border-red-500/30" : 
                                                product.stock_quantity < 10 ? "bg-amber-500/20 border-amber-500/30" : 
                                                "bg-white/10 border-white/10"
                                            }`}>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Inventory Level</span>
                                                    <span className={`text-xs font-black uppercase ${
                                                        product.stock_quantity === 0 ? "text-red-400" : 
                                                        product.stock_quantity < 10 ? "text-amber-400" : 
                                                        "text-white"
                                                    }`}>
                                                        {product.stock_quantity === 0 ? "DEPLETED" : `${product.stock_quantity} Units Avail`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <div key={i} className={`w-1 h-3 rounded-full ${i < (product.stock_quantity / 20) ? "bg-indigo-500" : "bg-white/10"}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-8 pb-10">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">{product.name}</h3>
                                            <p className="text-[10px] font-bold text-white/40 line-clamp-1 italic uppercase tracking-widest">{product.subtitle || "Kingdom Collection"}</p>
                                        </div>
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="text-2xl font-black text-indigo-400">
                                                {getCurrencySymbol(orgId || "")}{product.price.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Star size={10} fill="currentColor" />
                                                <span className="text-[9px] font-black tracking-widest mt-0.5">BRAND NEW</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-black text-[9px] tracking-widest uppercase">Manage Data</Button>
                                            <Button variant="ghost" className="w-12 h-12 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/5">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {activeTab === "orders" && (
                        <div className="space-y-6">
                            <Card className="bg-[#0d1421] border-white/10 rounded-[3rem] overflow-hidden">
                                <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                        <Globe className="text-indigo-400" /> Active Global Shipments
                                    </h3>
                                    <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/20 font-black text-[9px] uppercase px-4 py-1 rounded-full">Automated Tracking</Badge>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5">
                                            <tr>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-white/40">Unit ID</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-white/40">Consignee</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-white/40">Status</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-white/40">Invested</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-white/40">Timeline</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-white/5 transition-all group">
                                                    <td className="px-8 py-6 font-mono text-[10px] text-white/40 uppercase">ORD-{order.id.slice(0, 6)}</td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-xs uppercase text-white">{order.contact_email?.split('@')[0]}</span>
                                                            <span className="text-[9px] font-bold text-white/20">{order.contact_email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <select 
                                                            value={order.status}
                                                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                            className={`h-9 px-4 rounded-xl border-0 font-black text-[9px] tracking-widest uppercase outline-none appearance-none cursor-pointer transition-all ${
                                                                order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                order.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                                                'bg-blue-500/10 text-blue-400'
                                                            }`}
                                                        >
                                                            <option value="pending">Awaiting Verification</option>
                                                            <option value="processing">Processing Deployment</option>
                                                            <option value="shipped">In Transit (Global)</option>
                                                            <option value="delivered">Successfully Delivered</option>
                                                            <option value="cancelled">Order Voided</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-8 py-6 font-black text-sm text-indigo-400">
                                                        {getCurrencySymbol(orgId || "")}{order.total_amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-6 text-[9px] font-black uppercase text-white/40">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => { setSelectedOrder(order); setIsOrderDetailsOpen(true); }}
                                                            className="h-10 w-10 text-white/20 hover:text-indigo-400 hover:bg-white/5"
                                                        >
                                                            <ChevronRight size={18} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === "inventory" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                           <Card className="lg:col-span-2 bg-[#0d1421] border-white/10 rounded-[3rem] overflow-hidden shadow-xl">
                                <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                        <Boxes className="text-emerald-400" /> Stock Health Monitor
                                    </h3>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[9px] uppercase px-4 py-1">Real-time Sync</Badge>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5">
                                            <tr>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-white/40">Product</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-white/40">Status</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-white/40">Quantity</th>
                                                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-white/40">Trend</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {products.map((p) => (
                                                <tr key={p.id} className="hover:bg-white/5 transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden">
                                                                <img src={p.images?.[0]} className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="font-black text-xs uppercase text-white">{p.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <Badge className={`font-black text-[8px] uppercase tracking-widest border-none px-3 py-1 ${
                                                            p.stock_quantity === 0 ? "bg-red-500/20 text-red-400" :
                                                            p.stock_quantity < 10 ? "bg-amber-500/20 text-amber-400" :
                                                            "bg-emerald-500/20 text-emerald-400"
                                                        }`}>
                                                            {p.stock_quantity === 0 ? "Exhausted" : p.stock_quantity < 10 ? "Critical" : "Healthy"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-6 font-mono text-sm font-bold text-white/60">
                                                        {p.stock_quantity.toString().padStart(3, '0')}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: 12 }).map((_, i) => (
                                                                <div key={i} className={`w-1 h-4 rounded-full ${i < (p.stock_quantity / 5) ? "bg-indigo-500" : "bg-white/5"}`} />
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                           </Card>
                           
                           <Card className="bg-[#0d1421] border-white/10 rounded-[3rem] p-10 space-y-8 h-fit">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Inventory Health Thresholds</h4>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-white/40">Critical Depletion (Low)</span>
                                            <span className="text-red-400">10 Units</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 w-[10%]" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-white/40">Standard Restock Level</span>
                                            <span className="text-indigo-400">50 Units</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-[50%]" />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-8 border-t border-white/5 space-y-4">
                                        <p className="text-[8px] font-bold text-white/30 uppercase leading-relaxed uppercase tracking-widest text-center">Protocol: Orders automatically decrement inventory upon verification. Restock must be manually logged for reconciliation.</p>
                                        <Button variant="outline" className="w-full h-12 rounded-2xl border-white/10 text-[9px] font-black uppercase tracking-widest">Generate Reconciliation Report</Button>
                                    </div>
                                </div>
                           </Card>
                        </div>
                    )}

                    {activeTab === "categories" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {categories.map(category => (
                                <Card key={category.id} className="bg-[#0d1421] border-white/10 rounded-[2.5rem] p-8 group hover:border-violet-500/50 transition-all shadow-xl">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                                            <Filter size={24} />
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-white/20 hover:text-red-400 hover:bg-red-500/5">
                                            <X size={16} />
                                        </Button>
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tight mb-2">{category.name}</h3>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest line-clamp-2">{category.description || "Active Storage Cluster"}</p>
                                </Card>
                            ))}
                            <button className="h-full min-h-[160px] rounded-[2.5rem] border-2 border-dashed border-white/10 hover:border-violet-500/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2 group">
                                <Plus size={32} className="text-white/10 group-hover:text-violet-400 transition-colors" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10 group-hover:text-white transition-colors">Create Cluster</span>
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Order Details Dialog */}
            <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
                <DialogContent className="max-w-2xl bg-[#0d1421] border-white/10 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Deployment Intelligence: ORD-{selectedOrder?.id.slice(0, 8)}</DialogTitle>
                    </DialogHeader>
                    
                    {selectedOrder && (
                        <div className="space-y-8 mt-6">
                            {/* Consignee Data */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Consignee Name</p>
                                    <p className="text-sm font-black text-white">{selectedOrder.shipping_address?.full_name || "Unknown Identity"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Contact Signal</p>
                                    <p className="text-sm font-black text-white">{selectedOrder.contact_phone || "No Pulse"}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Deployment Coordinates (Address)</p>
                                <p className="text-sm font-bold text-white/80 leading-relaxed uppercase">
                                    {selectedOrder.shipping_address?.address_line1}, {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.zip_code}, {selectedOrder.shipping_address?.country}
                                </p>
                            </div>

                            {/* Inventory Manifest */}
                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Inventory Manifest</p>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-black/40 overflow-hidden">
                                                    <img src={item.product?.images?.[0]} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase text-white">{item.product?.name}</p>
                                                    <p className="text-[9px] font-bold text-white/20 uppercase">Units: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-white">{getCurrencySymbol(orgId || "")}{(item.unit_price * item.quantity).toLocaleString()}</p>
                                                <p className="text-[8px] font-bold text-white/20 uppercase">EA: {getCurrencySymbol(orgId || "")}{item.unit_price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Logistics Status */}
                            <div className="flex items-center justify-between pt-6">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Total Investment</p>
                                    <p className="text-2xl font-black text-white">{getCurrencySymbol(orgId || "")}{selectedOrder.total_amount.toLocaleString()}</p>
                                </div>
                                <Badge className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-none ${
                                    selectedOrder.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                                    selectedOrder.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-indigo-500/20 text-indigo-400'
                                }`}>
                                    {selectedOrder.status}
                                </Badge>
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter className="pt-10">
                        <Button onClick={() => setIsOrderDetailsOpen(false)} className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/10">Close Logistics View</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, badge }: any) {
    const colors: any = {
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        red: "text-red-400 bg-red-500/10 border-red-500/20",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    };

    return (
        <Card className="bg-[#0d1421] border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] opacity-10 ${colors[color].split(' ')[1]} group-hover:opacity-20 transition-opacity`} />
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
                    <Icon size={24} />
                </div>
                {badge && (
                    <Badge className="bg-red-500 text-white border-0 font-black text-[7px] uppercase tracking-tighter px-2 h-5">
                        {badge}
                    </Badge>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{label}</p>
                <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
            </div>
        </Card>
    );
}
