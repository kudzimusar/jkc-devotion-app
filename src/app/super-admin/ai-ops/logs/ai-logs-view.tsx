"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Search, 
  Clock, 
  ShieldAlert,
  Wrench,
  Bot
} from "lucide-react";
import Link from "next/link";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface AILog {
  id: string;
  user_id: string;
  organization_id: string;
  session_id: string;
  persona: string;
  path: string;
  user_query: string;
  ai_response: string;
  response_time_ms: number;
  tools_called: any[];
  tool_results: any[];
  feedback_rating: string;
  feedback_reason: string;
  escalated: boolean;
  model_used: string;
  created_at: string;
  error_message?: string;
  // Join for user profiles
  profiles?: {
    full_name: string;
    avatar_url: string;
  }
}

export default function AILogsView() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [filter, setFilter] = useState<'all' | 'up' | 'down' | 'escalated'>('all');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLogs();
  }, [filter]);
  
  const fetchLogs = async () => {
    setLoading(true);
    
    let query = supabase
      .from('ai_conversation_logs')
      .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (filter === 'up' || filter === 'down') {
      query = query.eq('feedback_rating', filter);
    } else if (filter === 'escalated') {
      query = query.eq('escalated', true);
    }
    
    const { data, error } = await query;
    if (error) console.error("Logs fetch failed:", error);
    setLogs(data || []);
    setLoading(false);
  };

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-950 text-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <Link href="/super-admin/ai-ops" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-2 text-sm">
             <ChevronLeft className="w-4 h-4" />
             Back to AI Ops
           </Link>
           <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <MessageSquare className="w-8 h-8 text-amber-500" />
             AI Interaction Audit
           </h1>
           <p className="text-slate-400 mt-1">Real-time observability into the spiritual and functional accuracy of your AI ecosystem.</p>
        </div>
        
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner shadow-black/20">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilter('all')}
            className={filter === 'all' ? "bg-slate-800 text-white rounded-lg" : "text-slate-500 hover:text-slate-300"}
          >
            All Logs
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilter('up')}
            className={filter === 'up' ? "bg-emerald-600/20 text-emerald-400 rounded-lg" : "text-slate-500 hover:text-slate-300"}
          >
            Helpful
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilter('down')}
            className={filter === 'down' ? "bg-rose-600/20 text-rose-400 rounded-lg" : "text-slate-500 hover:text-slate-300"}
          >
            Low Quality
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilter('escalated')}
            className={filter === 'escalated' ? "bg-amber-600/20 text-amber-400 rounded-lg" : "text-slate-500 hover:text-slate-300"}
          >
            Escalations
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-20 opacity-40">
            <Bot className="w-12 h-12 animate-pulse text-amber-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-900 rounded-3xl">
             <p className="text-slate-500">No logs found for this filter in the last 24 hours.</p>
          </div>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="bg-slate-900/40 border-slate-800/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl transition-all hover:bg-slate-900/60">
              <div className="flex flex-col lg:flex-row h-full">
                {/* User Context Strip */}
                <div className="lg:w-64 p-5 bg-slate-950/20 border-b lg:border-b-0 lg:border-r border-slate-800/60 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                      {log.profiles?.avatar_url ? (
                        <img src={log.profiles.avatar_url} className="rounded-full" alt="avatar" />
                      ) : (
                        log.profiles?.full_name?.charAt(0) || '?'
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white truncate max-w-[120px]">
                        {log.profiles?.full_name || 'Anonymous User'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {log.user_id?.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Metadata</div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[10px] font-bold">
                        {log.persona}
                      </Badge>
                      <Badge variant="outline" className="border-slate-800 text-slate-500 text-[10px]">
                        {log.model_used.includes('3.1') ? 'v3.1 Pro' : 'v1.5 Flash'}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis px-1 py-1 rounded bg-slate-950/40">
                       <Clock className="w-3 h-3 text-slate-600" />
                       {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 px-1 py-1 italic opacity-60">
                       {log.path || '/root'}
                    </div>
                  </div>

                  {log.feedback_rating && (
                     <div className={cn(
                       "mt-4 p-3 rounded-xl border flex gap-3",
                       log.feedback_rating === 'up' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
                     )}>
                        {log.feedback_rating === 'up' ? (
                          <ThumbsUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                           <div className={cn(
                             "text-[10px] font-bold uppercase",
                             log.feedback_rating === 'up' ? "text-emerald-500" : "text-rose-500"
                           )}>
                             {log.feedback_rating === 'up' ? 'Helpful Result' : 'Low Quality'}
                           </div>
                           {log.feedback_reason && (
                             <p className="text-[10px] text-slate-400 mt-1 italic leading-tight">{log.feedback_reason}</p>
                           )}
                        </div>
                     </div>
                  )}

                  {log.escalated && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                       <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                       <div>
                          <div className="text-[10px] font-bold text-amber-500 uppercase">ESCALATED</div>
                          <p className="text-[10px] text-slate-400 mt-0.5 italic leading-tight">Interaction was handed off to church staff.</p>
                       </div>
                    </div>
                  )}
                </div>

                {/* Turn Data */}
                <div className="flex-1 p-0 flex flex-col">
                  {/* User Query */}
                  <div className="p-6 bg-slate-950/10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">User Intent</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-manrope">{log.user_query}</p>
                  </div>

                  {/* AI Response Strip */}
                  <div className="p-6 border-t border-slate-800/40 relative">
                     <div className="absolute top-0 right-6 -translate-y-1/2 flex items-center gap-2">
                        <Badge className="bg-slate-900 border-slate-800 text-slate-500 text-[9px] font-mono h-5 flex items-center justify-center">
                          {log.response_time_ms}ms
                        </Badge>
                     </div>

                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Synthesis</span>
                    </div>
                    <div className="text-sm text-slate-400 leading-relaxed max-w-2xl prose prose-sm prose-invert italic opacity-85">
                      {log.ai_response}
                    </div>

                    {/* Tool Calls */}
                    {log.tools_called && log.tools_called.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-slate-800/30">
                        <div className="flex items-center gap-2 mb-3 opacity-60">
                            <Wrench className="w-3 h-3 text-slate-600" />
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Database Operations Executed</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {log.tools_called.map((tool, ti) => (
                            <div key={ti} className="p-3 rounded-xl bg-black/30 border border-slate-800/40 group hover:border-slate-700 transition-colors">
                               <div className="flex justify-between items-start mb-2">
                                  <div className="text-[11px] font-bold text-slate-200">{tool.name}</div>
                                  <Badge className={cn("text-[9px] h-4", log.tool_results?.[ti]?.success ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>
                                     {log.tool_results?.[ti]?.success ? 'SUCCESS' : 'FAILED'}
                                  </Badge>
                               </div>
                               <div className="text-[10px] text-slate-500 font-mono bg-slate-900/40 p-1.5 rounded-md overflow-x-auto whitespace-pre-wrap leading-tight max-h-[100px] custom-scrollbar">
                                  {JSON.stringify(tool.args, null, 2)}
                               </div>
                               {log.tool_results?.[ti]?.message && (
                                 <div className="mt-2 text-[9px] text-slate-400 italic font-medium px-1">
                                    → {log.tool_results[ti].message}
                                 </div>
                               )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {log.error_message && (
                      <div className="mt-4 p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-400 text-[11px] font-medium animate-pulse">
                         SYSTEM FAULT: {log.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
