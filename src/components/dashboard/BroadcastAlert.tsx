"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Megaphone, X, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BroadcastAlert() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBroadcast = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch unread broadcast for current organization
      const { data: receipt, error } = await supabase
        .from('broadcast_receipts')
        .select(`
          id,
          platform_broadcasts (*)
        `)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (receipt) setBroadcast(receipt);
      setLoading(false);
    };

    fetchBroadcast();
  }, []);

  const handleDismiss = async () => {
    if (!broadcast) return;

    try {
      const { error } = await supabase
        .from('broadcast_receipts')
        .update({ 
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq('id', broadcast.id);

      if (error) throw error;
      setBroadcast(null);
    } catch (err: any) {
      toast.error("Failed to dismiss broadcast.");
    }
  };

  if (loading || !broadcast) return null;

  const msg = broadcast.platform_broadcasts;

  return (
    <div className="fixed top-0 left-0 right-0 z-[110] p-4 pointer-events-none animate-in slide-in-from-top-full duration-700">
      <div className="max-w-[700px] mx-auto pointer-events-auto">
        <div className="bg-indigo-600 shadow-[0_10px_40px_rgba(79,70,229,0.4)] border border-indigo-500/30 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 left-0 h-1 bg-white/20" />
            
            <div className="flex items-center gap-6 p-6">
                <div className="hidden sm:flex shrink-0 w-16 h-16 rounded-2xl bg-white/10 items-center justify-center border border-white/10">
                    <Megaphone className="w-8 h-8 text-white animate-bounce-slow" />
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Info className="w-4 h-4 text-indigo-200" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Official System Broadcast</span>
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight mb-2 tracking-tight line-clamp-1">{msg.title}</h3>
                    <p className="text-indigo-100 text-sm leading-relaxed line-clamp-2 opacity-90">{msg.message}</p>
                    
                    <div className="flex items-center gap-4 mt-4">
                        <Button 
                            className="bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-xl px-6 border-none shadow-lg h-10 group"
                            onClick={handleDismiss}
                        >
                            Understood 
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <span className="text-[10px] text-indigo-200/50 italic">Acknowledged on behalf of your church leadership</span>
                    </div>
                </div>

                <button 
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
