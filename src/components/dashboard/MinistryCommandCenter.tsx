"use client";

import { Users, UserPlus, Baby, ClipboardCheck, Sparkles, Heart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MinistryCommandCenterProps {
    ministrySlug: string;
    onAction: (action: string) => void;
}

export function MinistryCommandCenter({ ministrySlug, onAction }: MinistryCommandCenterProps) {
    const isUsher = ministrySlug === 'ushering';
    const isKids = ministrySlug === 'children';
    const isEvangelism = ministrySlug === 'evangelism';

    if (isUsher) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden group shadow-sm transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />
                    <CardHeader className="p-0 mb-4">
                        <Users className="w-8 h-8 text-primary mb-2" />
                        <CardTitle className="text-lg font-black text-foreground">Sunday Attendance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-3xl font-black text-foreground">428</span>
                            <span className="text-xs font-bold text-emerald-500 mb-1">+12% vs last wk</span>
                        </div>
                        <Button onClick={() => onAction('usher_report')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black text-[10px] tracking-widest uppercase h-10 transition-all opacity-100 dark:opacity-90 dark:hover:opacity-100">
                            SUBMIT HEADCOUNT
                        </Button>
                    </CardContent>
                </Card>
                {/* Additional Usher Widgets: Parking, New Souls, etc. */}
            </div>
        );
    }

    if (isKids) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden group shadow-sm transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all" />
                    <CardHeader className="p-0 mb-4">
                        <Baby className="w-8 h-8 text-blue-500 mb-2" />
                        <CardTitle className="text-lg font-black text-foreground">Check-in Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-3xl font-black text-foreground">142</span>
                            <span className="text-xs font-bold text-muted-foreground mb-1">kids active</span>
                        </div>
                        <Button onClick={() => onAction('register_child')} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] tracking-widest uppercase h-10">
                            REGISTER CHILD
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-red-500/5 dark:bg-red-500/10 border-red-500/20 rounded-3xl p-6 shadow-sm">
                    <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Safety Alerts</CardTitle>
                        <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-0 text-[8px] font-black uppercase">Active</Badge>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-foreground">3 Children with Peanut Allergies</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-foreground">2 Pending Authorized Pickups</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isEvangelism) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden group shadow-sm transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                    <CardHeader className="p-0 mb-4">
                        <Sparkles className="w-8 h-8 text-emerald-500 mb-2" />
                        <CardTitle className="text-lg font-black text-foreground">Soul Harvest Today</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-3xl font-black text-foreground">18</span>
                            <span className="text-xs font-bold text-emerald-500 mb-1">decisions made</span>
                        </div>
                        <Button onClick={() => onAction('log_outreach')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] tracking-widest uppercase h-10">
                            LOG NEW DECISION
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Default Generic View
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card border border-border rounded-3xl p-6 shadow-sm transition-colors">
                <CardHeader className="p-0 mb-4">
                    <Heart className="w-8 h-8 text-pink-500 mb-2" />
                    <CardTitle className="text-lg font-black text-foreground">Ministry Operational Pulse</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Button onClick={() => onAction('generic_report')} className="w-full bg-muted hover:bg-foreground/5 rounded-xl font-black text-[10px] tracking-widest uppercase h-10 border border-border text-foreground transition-all">
                        SUBMIT WEEKLY REPORT
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
