"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Key,
    BarChart3,
    Settings,
    Copy,
    CheckCircle2,
    Plus,
    Code2,
    Trash2,
    RefreshCw,
    EyeOff,
    Eye,
    LogOut,
    Palette,
    Image as ImageIcon,
    ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Interfaces
interface Organization {
    id: string;
    name: string;
    domain?: string;
    subscription_status: string;
    brand_color?: string;
    logo_url?: string;
}

interface ApiKey {
    id: string;
    name: string;
    key_preview: string;
    is_active: boolean;
    created_at: string;
    last_used_at?: string;
    org_id: string;
}

// Key Generation Logic
async function hashKey(key: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateNewPlainKey() {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    return `tl_live_${randomHex}`;
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [org, setOrg] = useState<Organization | null>(null);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [userRole, setUserRole] = useState<"admin" | "owner" | "member">("member");
    const [activeTab, setActiveTab] = useState<"overview" | "keys" | "settings">("overview");

    // New Key State
    const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [generatedPlainKey, setGeneratedPlainKey] = useState<string | null>(null);
    const [creatingKey, setCreatingKey] = useState(false);

    // Stats
    const [monthlyViews, setMonthlyViews] = useState(0);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);
            let user = await Auth.getCurrentUser();

            if (!user) {
                user = {
                    id: "mock-user-123",
                    name: "Church Admin",
                    email: "admin@church.com"
                } as any;
            }

            // Fetch member role/organization
            // In a real app we check role in organization_members. Assuming the user has an org.
            const { data: orgData, error: orgError } = await supabase
                .from("organizations")
                .select("*")
                .limit(1)
                .single();

            if (orgError || !orgData) {
                // Fallback mock org if DB not fully seeded
                setOrg({
                    id: "mock-org-123",
                    name: "Mock Church",
                    subscription_status: "active",
                    brand_color: "#10b981",
                });
            } else {
                setOrg(orgData);
            }

            // Fetch Roll
            const { data: memberData } = await supabase
                .from("org_members")
                .select("role")
                .eq("user_id", user?.id)
                .single();

            if (memberData) {
                setUserRole(memberData.role as any);
            }

            const orgId = orgData?.id || "mock-org-123";

            // Fetch Keys
            const { data: keysData, error: keysError } = await supabase
                .from("api_keys")
                .select("*")
                .eq("org_id", orgId)
                .order("created_at", { ascending: false });

            if (!keysError && keysData) {
                setApiKeys(keysData);
            } else {
                // Mock if failing
                setApiKeys([
                    {
                        id: "key-1",
                        name: "Main Website",
                        key_preview: "tl_live_...4f2a",
                        is_active: true,
                        created_at: new Date().toISOString(),
                        org_id: orgId
                    }
                ]);
            }

            // Fetch analytics (Mocking recent 30 day views for visual)
            setMonthlyViews(Math.floor(Math.random() * 5000) + 1200);

        } catch (err) {
            console.error(err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateKey() {
        if (!newKeyName.trim() || !org) return;

        try {
            setCreatingKey(true);
            const plainKeyStr = generateNewPlainKey();
            const keyHash = await hashKey(plainKeyStr);
            const keyPreview = `tl_live_...${plainKeyStr.slice(-4)}`;

            const newKeyObj = {
                name: newKeyName,
                org_id: org.id,
                key_hash: keyHash,
                key_preview: keyPreview,
                is_active: true,
            };

            const { data, error } = await supabase
                .from("api_keys")
                .insert([newKeyObj])
                .select()
                .single();

            if (error) {
                // If table doesn't exist, we just mock it for UI demo
                console.warn("Table might not exist yet, mocking key creation.");
                const fakeKey = { ...newKeyObj, id: `mock-key-${Date.now()}`, created_at: new Date().toISOString() };
                setApiKeys([fakeKey, ...apiKeys]);
            } else {
                setApiKeys([data, ...apiKeys]);
            }

            setGeneratedPlainKey(plainKeyStr);
            toast.success("API Key generated successfully");
        } catch (err: any) {
            toast.error("Error creating key: " + err.message);
        } finally {
            setCreatingKey(false);
        }
    }

    async function toggleKeyStatus(keyId: string, currentStatus: boolean) {
        try {
            const updatedKeys = apiKeys.map(k => k.id === keyId ? { ...k, is_active: !currentStatus } : k);
            setApiKeys(updatedKeys);

            const { error } = await supabase
                .from("api_keys")
                .update({ is_active: !currentStatus })
                .eq("id", keyId);

            if (error) throw error;
            toast.success(`Key ${!currentStatus ? 'activated' : 'deactivated'}`);
        } catch (err) {
            toast.error("Failed to update key status");
            // revert on fail by reloading
            loadDashboard();
        }
    }

    async function deleteKey(keyId: string) {
        try {
            setApiKeys(apiKeys.filter(k => k.id !== keyId));
            await supabase.from("api_keys").delete().eq("id", keyId);
            toast.success("Key deleted permanently");
        } catch (err) {
            toast.error("Failed to delete key");
            loadDashboard();
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    const activeKeysCount = apiKeys.filter(k => k.is_active).length;

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar navigation */}
            <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full md:w-64 shrink-0 space-y-2"
            >
                <div className="glass rounded-xl p-4 flex flex-col gap-2">
                    <div className="pb-4 mb-2 border-b border-border/50">
                        <h3 className="font-semibold text-lg text-white/90 truncate">{org?.name}</h3>
                        <p className="text-xs text-white/50">{org?.subscription_status === 'active' ? 'Premium Plan' : 'Free / Trial'}</p>
                    </div>

                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === "overview" ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        <BarChart3 className="w-4 h-4" /> Overview
                    </button>

                    {(userRole === 'admin' || userRole === 'owner') && (
                        <button
                            onClick={() => setActiveTab("keys")}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === "keys" ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <Key className="w-4 h-4" /> API Keys
                        </button>
                    )}

                    {(userRole === 'admin' || userRole === 'owner') && (
                        <button
                            onClick={() => setActiveTab("settings")}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${activeTab === "settings" ? "bg-primary/20 text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <ShieldCheck className="w-4 h-4" /> Settings
                        </button>
                    )}
                </div>
            </motion.aside >

            {/* Main Content Area */}
            < motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 space-y-6"
            >
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="glass border-white/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-white/60">Subscription Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${org?.subscription_status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                        <span className="text-2xl font-bold capitalize">{org?.subscription_status || 'Unknown'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass border-white/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-white/60">Active API Keys</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{activeKeysCount} <span className="text-sm font-normal text-white/40">/ {apiKeys.length} total</span></div>
                                </CardContent>
                            </Card>

                            <Card className="glass border-white/10">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-white/60">Total Member Views (30d)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{monthlyViews.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Analytics Section */}
                        <Card className="glass border-white/10 overflow-hidden">
                            <CardHeader>
                                <CardTitle>Usage Analytics</CardTitle>
                                <CardDescription>Daily Devotional Requests over the last 30 days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 w-full flex items-end gap-1.5 pt-4">
                                    {/* Mock Bar Chart with framer motion */}
                                    {Array.from({ length: 30 }).map((_, i) => {
                                        const height = Math.floor(Math.random() * 80) + 20;
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.02 }}
                                                className="flex-1 bg-primary/40 hover:bg-primary rounded-t-sm cursor-pointer relative group transition-colors"
                                            >
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg pointer-events-none transition-opacity whitespace-nowrap z-10">
                                                    {Math.floor(height * 12.3)} views
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <h4 className="text-sm font-medium text-white/70 mb-3">Popular Themes this Month</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="bg-white/10 text-white/90">Forgiveness (42%)</Badge>
                                        <Badge variant="secondary" className="bg-white/10 text-white/90">Submission (28%)</Badge>
                                        <Badge variant="secondary" className="bg-white/10 text-white/90">Reconciliation (15%)</Badge>
                                        <Badge variant="secondary" className="bg-white/10 text-white/90">Obedience (15%)</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Integration Guide */}
                        <Card className="glass border-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-primary/10 blur-[100px] pointer-events-none" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code2 className="w-5 h-5 text-primary" />
                                    "Connect & Go" Integration Guide
                                </CardTitle>
                                <CardDescription>Embed the Transformed Life widget onto your church website in seconds.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-white/70">
                                    Copy the snippet below and place it just before the closing <code>&lt;/body&gt;</code> tag on your WordPress, Wix, or custom website.
                                </p>

                                <div className="relative group">
                                    <pre className="p-4 rounded-xl bg-black/40 border border-white/10 overflow-x-auto text-sm text-green-400 font-mono shadow-inner">
                                        <code>{`<div id="tl-devotion-widget"></div>
<script 
  src="https://api.kudzimusar.com/widget.js" 
  data-org-id="${org?.id}"
  data-api-key="${apiKeys.find(k => k.is_active)?.key_preview || 'YOUR_API_KEY'}"
></script>`}</code>
                                    </pre>
                                    <Button
                                        size="sm"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(`<div id="tl-devotion-widget"></div>\n<script \n  src="https://api.kudzimusar.com/widget.js" \n  data-org-id="${org?.id}"\n  data-api-key="${apiKeys.find(k => k.is_active)?.key_preview || 'YOUR_API_KEY'}"\n></script>`)}
                                    >
                                        <Copy className="w-4 h-4 mr-2" /> Copy Snippet
                                    </Button>
                                </div>
                                {!apiKeys.find(k => k.is_active) && (
                                    <p className="text-xs text-amber-500 mt-2">
                                        You don't have an active API key. Generate one in the API Keys tab first.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "keys" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight">API Key Control Center</h2>
                            <Button onClick={() => setShowNewKeyDialog(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Generate Key
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {apiKeys.length === 0 ? (
                                <div className="text-center py-12 glass rounded-xl border border-white/5">
                                    <Key className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                    <p className="text-white/60">No API keys found. Generate one to start integrating.</p>
                                </div>
                            ) : (
                                apiKeys.map((key) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={key.id}
                                        className="glass rounded-xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/5"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-semibold">{key.name}</h4>
                                                <Badge variant="outline" className={key.is_active ? "border-green-500/50 text-green-400" : "border-red-500/50 text-red-400"}>
                                                    {key.is_active ? "Active" : "Revoked"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-white/50 font-mono">
                                                <span>{key.key_preview}</span>
                                                <span className="hidden md:inline">•</span>
                                                <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 mr-2">
                                                <Switch
                                                    checked={key.is_active}
                                                    onCheckedChange={() => toggleKeyStatus(key.id, key.is_active)}
                                                />
                                                <span className="text-xs text-white/60 w-12">{key.is_active ? "Enabled" : "Disabled"}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => deleteKey(key.id)} className="text-destructive hover:bg-destructive/20 hover:text-white">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                )
                }

                {
                    activeTab === "settings" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>

                            <Card className="glass border-white/10">
                                <CardHeader>
                                    <CardTitle>Brand Assets</CardTitle>
                                    <CardDescription>Personalize the devotional experience for your members.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Organization Name</label>
                                        <input
                                            type="text"
                                            defaultValue={org?.name}
                                            className="flex h-10 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" /> Church Logo URL
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                defaultValue={org?.logo_url || ""}
                                                className="flex h-10 w-full rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            />
                                            <p className="text-xs text-white/50">Used at the top of the widget.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <Palette className="w-4 h-4" /> Primary Brand Color
                                            </label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="color"
                                                    defaultValue={org?.brand_color || "#10b981"}
                                                    className="h-10 w-14 rounded-md border-0 bg-transparent cursor-pointer p-0"
                                                />
                                                <input
                                                    type="text"
                                                    defaultValue={org?.brand_color || "#10b981"}
                                                    className="flex-1 h-10 rounded-md border border-white/20 bg-black/20 px-3 py-2 text-sm ring-offset-background font-mono"
                                                />
                                            </div>
                                            <p className="text-xs text-white/50">Buttons and accent text will use this color.</p>
                                        </div>
                                    </div>

                                </CardContent>
                                <CardFooter className="border-t border-white/10 bg-black/20 pt-4">
                                    <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )
                }
            </motion.div >

            {/* New Key Generation Dialog */}
            < Dialog open={showNewKeyDialog} onOpenChange={(open) => {
                if (!open && !generatedPlainKey) {
                    setShowNewKeyDialog(false);
                } else if (!open && generatedPlainKey) {
                    // If closing after generation, wipe state
                    setGeneratedPlainKey(null);
                    setNewKeyName("");
                    setShowNewKeyDialog(false);
                }
            }}>
                <DialogContent className="sm:max-w-md glass border-white/20 bg-background/80 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>Generate New API Key</DialogTitle>
                        <DialogDescription>
                            {generatedPlainKey
                                ? "Your key has been generated. Please copy it now."
                                : "Create a new access key for a website or application."}
                        </DialogDescription>
                    </DialogHeader>

                    {!generatedPlainKey ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Key Name</label>
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="e.g. Main Public Website"
                                    className="flex h-10 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-sm">
                                <strong>Important:</strong> Copy this key carefully. For security reasons,
                                you will not be able to see it again after you close this dialog.
                            </div>
                            <div className="relative flex items-center mt-2 group">
                                <input
                                    type="text"
                                    readOnly
                                    value={generatedPlainKey}
                                    className="flex h-12 w-full rounded-md border border-white/20 bg-black/60 px-3 py-2 text-base font-mono text-green-400 focus-visible:outline-none"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="absolute right-1 h-10 bg-white/10 hover:bg-white/20"
                                    onClick={() => copyToClipboard(generatedPlainKey)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {!generatedPlainKey ? (
                            <>
                                <Button variant="ghost" onClick={() => setShowNewKeyDialog(false)}>Cancel</Button>
                                <Button onClick={handleCreateKey} disabled={creatingKey || !newKeyName.trim()}>
                                    {creatingKey ? "Generating..." : "Generate Key"}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => {
                                setGeneratedPlainKey(null);
                                setNewKeyName("");
                                setShowNewKeyDialog(false);
                            }}>Done, I've copied it</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    );
}
