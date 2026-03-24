"use client";
import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, Youtube, Calendar, User, BookOpen, Link as LinkIcon, Star, PlayCircle, Activity, RefreshCw, ShieldAlert, X, Share2, Clock, Edit3, Save, CheckCircle, BarChart3, Target, Upload, Paperclip, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

type Sermon = {
  id: string;
  title: string;
  speaker: string;
  youtube_url: string;
  series?: string;
  scripture?: string;
  date: string;
  is_featured: boolean;
  status: string;
  transcript_text?: string;
  assets?: any[];
  metrics?: any;
};

import { useAdminCtx } from '../Context';
import { ROLE_HIERARCHY, AdminRole } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';

export default function SermonManagementPage() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const { orgId, role } = useAdminCtx();
  const router = useRouter();
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [editTranscript, setEditTranscript] = useState('');
  const [editSummary, setEditSummary] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [series, setSeries] = useState('');
  const [scripture, setScripture] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [featured, setFeatured] = useState(true);
  const [issubmitting, setIsSubmitting] = useState(false);
  const [liveStream, setLiveStream] = useState<any>(null);
  const [newLiveUrl, setNewLiveUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [notesFile, setNotesFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobQueue, setJobQueue] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [usage, setUsage] = useState<{current: number, quota: number}>({current: 0, quota: 0});
  const [dlqCount, setDlqCount] = useState(0);
  const [impactStats, setImpactStats] = useState<any[]>([]);
  const [spiritualFeed, setSpiritualFeed] = useState<any[]>([]);

  const isPastor = role === 'pastor';
  const canDelete = role && ROLE_HIERARCHY[role as AdminRole] >= 70;

  const fetchLiveStatus = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from('live_streams')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();

    if (data) {
      setLiveStream(data);
      setNewLiveUrl(data.stream_url || '');
    } else {
      // Create record if none exists
      const { data: created } = await supabase
        .from('live_streams')
        .insert({ org_id: orgId, status: 'idle' })
        .select()
        .single();
      setLiveStream(created);
    }
  }, [orgId]);

  const fetchSermons = useCallback(async () => {
    if (!orgId) return;
    try {
      const { data, error } = await supabase
        .from('public_sermons')
        .select(`
          *,
          assets:media_assets(*),
          metrics:sermon_metrics(*)
        `)
        .eq('org_id', orgId)
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSermons(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch sermons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchHealthData = useCallback(async () => {
    if (!orgId) return;
    const { data: jobs } = await supabase.from('job_queue').select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(5);
    const { data: logEntries } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(5);
    const { data: orgData } = await supabase.from('organizations').select('ai_current_month_tokens, ai_monthly_token_quota').eq('id', orgId).single();
    const { count } = await supabase.from('job_queue').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'failed_permanent');
    const { data: stats } = await supabase.from('sermon_impact_stats').select('*').order('date', { ascending: false }).limit(5);
    const { data: responses } = await supabase.from('spiritual_responses').select('*, user_id').order('created_at', { ascending: false }).limit(3);
    
    setJobQueue(jobs || []);
    setLogs(logEntries || []);
    setUsage({ 
        current: orgData?.ai_current_month_tokens || 0, 
        quota: orgData?.ai_monthly_token_quota || 1000000 
    });
    setDlqCount(count || 0);
    setImpactStats(stats || []);
    setSpiritualFeed(responses || []);
  }, [orgId]);

  useEffect(() => {
    if (orgId) {
      fetchSermons();
      fetchLiveStatus();
      fetchHealthData();
    }
  }, [orgId, fetchSermons, fetchLiveStatus, fetchHealthData]);

  const toggleLive = async () => {
    if (!liveStream || !orgId) return;
    const newStatus = liveStream.status === 'live' ? 'idle' : 'live';
    const { error } = await supabase
      .from('live_streams')
      .update({ 
        status: newStatus,
        started_at: newStatus === 'live' ? new Date() : liveStream.started_at,
        ended_at: newStatus === 'idle' ? new Date() : liveStream.ended_at
      })
      .eq('id', liveStream.id);

    if (error) toast.error("Failed to update live status");
    else {
      toast.success(`Broadcasting is now ${newStatus === 'live' ? 'ACTIVE' : 'OFFLINE'}`);
      fetchLiveStatus();
    }
  };

  const finalizeStream = async () => {
    if (!liveStream || !orgId) return;
    const title = prompt("Sermon Title for this recording:", "Sunday Service");
    if (!title) return;

    setIsSubmitting(true);
    try {
      // 1. End stream
      await supabase
        .from('live_streams')
        .update({
          status: 'ended',
          ended_at: new Date()
        })
        .eq('id', liveStream.id);

      // 2. Create sermon (using the live stream URL)
      await supabase.from('public_sermons').insert({
        title,
        speaker: 'Admin', // Default or from context
        org_id: orgId,
        date: format(new Date(), 'yyyy-MM-dd'),
        is_featured: true,
        status: 'published',
        video_source_type: 'youtube',
        youtube_url: liveStream.stream_url
      });

      toast.success("Broadcast finalized and added to library!");
      fetchSermons();
      fetchLiveStatus();
    } catch (err) {
      toast.error("Failed to finalize stream");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLiveUrl = async () => {
    if (!liveStream || !orgId) return;
    const { error } = await supabase
      .from('live_streams')
      .update({ stream_url: newLiveUrl })
      .eq('id', liveStream.id);

    if (error) toast.error("Failed to update stream URL");
    else toast.success("Live stream URL updated");
  };

  const syncAnalytics = async (sermonId: string) => {
    const { error } = await supabase.rpc('aggregate_sermon_stats', { target_sermon_id: sermonId });
    if (error) toast.error("Failed to aggregate data");
    else {
      toast.success("Insights synchronized");
      fetchSermons();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !speaker) {
      toast.error('Title and Speaker are required');
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);
    try {
      // 1. Insert Sermon
      const { data: sermonData, error: sermonError } = await supabase
        .from('public_sermons')
        .insert({
          org_id: orgId,
          title,
          speaker,
          youtube_url: youtubeUrl || null,
          series: series || null,
          scripture: scripture || null,
          date,
          is_featured: featured,
          status: 'published',
          video_source_type: youtubeUrl ? 'youtube' : (videoFile ? 'storage' : null)
        })
        .select()
        .single();

      if (sermonError) throw sermonError;

      // 2. Upload Files to Storage
      const uploadFile = async (file: File, type: string) => {
        const filePath = `${orgId}/sermons/${sermonData.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('sermons')
            .upload(filePath, file);
        
        if (uploadError) {
          toast.error(`Failed to upload ${type}`);
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from('sermons').getPublicUrl(filePath);
        
        await supabase.from('media_assets').insert({
          sermon_id: sermonData.id,
          org_id: orgId,
          type,
          url: publicUrl
        });
      };

      if (videoFile) await uploadFile(videoFile, 'video');
      if (audioFile) await uploadFile(audioFile, 'audio');
      if (thumbnailFile) await uploadFile(thumbnailFile, 'thumbnail');
      if (notesFile) await uploadFile(notesFile, 'notes');

      // 3. Trigger System Event (Outbox Pattern)
      await supabase.from('system_event_outbox').insert({
        org_id: orgId,
        event_type: 'sermon_created',
        payload: {
          sermon_id: sermonData.id,
          title,
          speaker,
          has_video: !!(youtubeUrl || videoFile),
          has_audio: !!audioFile
        },
        status: 'pending'
      });

      toast.success('Sermon posted — Automation pipeline triggered.');
      setTitle('');
      setSpeaker('');
      setYoutubeUrl('');
      setSeries('');
      setScripture('');
      setFeatured(true);
      setVideoFile(null);
      setAudioFile(null);
      setThumbnailFile(null);
      fetchSermons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to post sermon');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sermon?')) return;

    try {
      const { error } = await supabase
        .from('public_sermons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Sermon deleted');
    } catch (error: any) {
      toast.error('Failed to delete sermon');
    }
  };

  const handleUpdateAISentiments = async () => {
    if (!editingSermon) return;
    try {
      const { error: sError } = await supabase
        .from('public_sermons')
        .update({ transcript_text: editTranscript })
        .eq('id', editingSermon.id);

      if (sError) throw sError;

      const { error: aError } = await supabase
        .from('media_assets')
        .update({ metadata: { ...editingSermon.assets?.find(a => a.type === 'notes')?.metadata, summary: editSummary } })
        .eq('sermon_id', editingSermon.id)
        .eq('type', 'notes');

      if (aError) throw aError;

      toast.success("AI Content updated and synchronized");
      setEditingSermon(null);
      fetchSermons();
    } catch (err: any) {
      toast.error("Failed to update content: " + err.message);
    }
  };

  return (
    <>
      <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-foreground">Sermon Management</h1>
            {isPastor && (
                <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase border border-amber-500/10 animate-pulse">
                    Pastor's HQ Override
                </span>
            )}
            <button 
                onClick={() => router.push('/manual/media-ministry')}
                className="ml-auto flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-1.5 rounded-full transition-all group"
            >
                <BookOpen size={12} className="text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Open Manual</span>
            </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Broadcast your message globally and archive history.
        </p>
      </div>

      {/* System Health Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card/50 border border-border p-4 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dlqCount > 0 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
              <Activity size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">AI Pipeline</p>
              <h3 className="text-xl font-black">
                {dlqCount > 0 ? (
                    <span className="text-red-500">{dlqCount} <span className="text-[9px] font-bold">In DLQ</span></span>
                ) : (
                    <>{jobQueue.filter(j => j.status === 'pending').length} <span className="text-[9px] text-muted-foreground font-bold">Jobs Pending</span></>
                )}
              </h3>
            </div>
          </div>
          <button onClick={fetchHealthData} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <RefreshCw size={12} className="text-muted-foreground" />
          </button>
        </div>

        <div className="bg-card/50 border border-border p-4 rounded-3xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">AI Intelligence Budget</p>
                <div className="text-[9px] font-black text-foreground">{(usage.current / usage.quota * 100).toFixed(1)}%</div>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${usage.current / usage.quota > 0.8 ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, (usage.current / usage.quota) * 100)}%` }}
                />
            </div>
            <p className="text-[7px] text-muted-foreground font-bold mt-2 uppercase tracking-tighter">
                {usage.current.toLocaleString()} / {usage.quota.toLocaleString()} Tokens Used
            </p>
        </div>

        <div className="bg-card/50 border border-border p-4 rounded-3xl col-span-1 overflow-hidden relative group">
           <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
             <Star size={10} className="text-primary" /> Decision Feed 
             <span className="ml-auto text-primary animate-pulse">Live</span>
           </p>
           <div className="space-y-2">
              {spiritualFeed.map(resp => (
                <div key={resp.id} className="bg-muted/30 border border-border/40 p-2.5 rounded-2xl flex items-center justify-between group/item">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <div>
                        <p className="text-[9px] font-black text-foreground uppercase tracking-tighter leading-none">{resp.type.replace(/_/g, ' ')}</p>
                        <p className="text-[7px] text-muted-foreground font-bold mt-0.5">{new Date(resp.created_at).toLocaleDateString()} {new Date(resp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <button className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[7px] font-black opacity-0 group-hover/item:opacity-100 transition-opacity uppercase tracking-widest">Assign</button>
                </div>
              ))}
              {spiritualFeed.length === 0 && <span className="text-[8px] font-bold text-muted-foreground/30 uppercase tracking-widest block py-2">No responses received yet</span>}
           </div>
        </div>
      </div>

      {/* Impact Heatmap (Priority 7 Preview) */}
      <div className="bg-card glass border border-border p-8 rounded-[3rem] mb-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <BarChart3 size={240} />
          </div>
          
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Ministry <span className="text-primary">Impact</span> Heatmap</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Efficiency: Decisions per 1k views</p>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                   <Target size={16} />
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Global Impact Score</p>
                   <p className="text-xl font-black">{(impactStats.reduce((acc, s) => acc + s.impact_efficiency, 0) / (impactStats.length || 1)).toFixed(1)}%</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
             {impactStats.map((s, idx) => (
               <div key={idx} className="space-y-3 p-4 bg-muted/20 border border-border/40 rounded-3xl group/bar relative overflow-hidden">
                  <div className="flex items-center justify-between">
                     <p className="text-[9px] font-black text-foreground uppercase truncate max-w-[80%]">{s.title}</p>
                     <p className="text-[8px] font-bold text-primary">{s.spiritual_decisions} 🙏</p>
                  </div>
                  <div className="h-12 flex items-end gap-1">
                      <div className="flex-1 bg-primary/30 rounded-full group-hover/bar:bg-primary transition-all overflow-hidden relative">
                         <div 
                           className="absolute bottom-0 w-full bg-primary" 
                           style={{ height: `${Math.min(100, s.impact_efficiency * 10)}%` }}
                         />
                      </div>
                  </div>
                  <p className="text-[7px] font-medium text-muted-foreground uppercase tracking-widest text-center">{s.total_views} Views</p>
               </div>
             ))}
          </div>
      </div>

      {/* Live Management Panel */}
      <div className="mb-8 p-6 bg-card border border-border rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 pointer-events-none">
          <PlayCircle size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${liveStream?.status === 'live' ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-muted'}`}>
              <PlayCircle className={liveStream?.status === 'live' ? 'text-white' : 'text-muted-foreground'} size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Global Broadcast</h2>
                {liveStream?.status === 'live' && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                Status: <span className={liveStream?.status === 'live' ? 'text-red-500 underline' : ''}>{liveStream?.status || 'OFFLINE'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
             <input
              type="text"
              placeholder="YouTube Live / RTMP URL..."
              value={newLiveUrl}
              onChange={(e) => setNewLiveUrl(e.target.value)}
              className="bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold w-full md:w-64 focus:outline-none focus:border-primary transition-all"
            />
            <button onClick={updateLiveUrl} className="p-2.5 rounded-xl border border-border bg-muted hover:bg-muted/80 transition-all">
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={toggleLive}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all uppercase shadow-lg ${liveStream?.status === 'live' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary text-white hover:bg-primary-hover'}`}
            >
              {liveStream?.status === 'live' ? 'STOP BROADCAST' : 'GO LIVE'}
            </button>
            {liveStream?.status === 'live' && (
              <button
                onClick={finalizeStream}
                className="px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all uppercase bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg"
              >
                FINALIZE & SAVE
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left: Add Form */}
        <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Add New Sermon</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Title *</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. A Genuine Believer"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary text-foreground outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Speaker *</label>
              <input 
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="e.g. Pastor Marcel Jonte"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary text-foreground outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary text-foreground outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Featured</label>
                <div className="flex items-center h-[46px] px-4 bg-muted border border-border rounded-xl">
                    <input 
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="ml-3 text-xs font-bold text-muted-foreground">Mark as Featured</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">YouTube URL</label>
              <div className="relative">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                <input 
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-muted border border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:border-primary text-foreground outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Series (Optional)</label>
                <input 
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="e.g. Identity"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary text-foreground outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Scripture (Optional)</label>
                <input 
                  value={scripture}
                  onChange={(e) => setScripture(e.target.value)}
                  placeholder="e.g. Psalms 23:1"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary text-foreground outline-none transition-colors"
                />
              </div>
            </div>

            {/* Media Uploads */}
            <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Media Assets (Storage)</h3>
                <div className="grid grid-cols-4 gap-3">
                    <div className="relative group">
                        <input type="file" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className={`p-4 rounded-2xl border border-dashed text-center transition-all ${thumbnailFile ? 'bg-primary/5 border-primary/50' : 'bg-muted border-border hover:border-primary/30'}`}>
                            <Upload size={12} className={`mx-auto mb-2 ${thumbnailFile ? 'text-primary' : 'text-muted-foreground/30'}`} />
                            <p className="text-[8px] font-black uppercase truncate">{thumbnailFile ? thumbnailFile.name : 'Thumbnail'}</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <input type="file" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className={`p-4 rounded-2xl border border-dashed text-center transition-all ${audioFile ? 'bg-indigo-500/5 border-indigo-500/50' : 'bg-muted border-border hover:border-indigo-500/30'}`}>
                            <Upload size={12} className={`mx-auto mb-2 ${audioFile ? 'text-indigo-500' : 'text-muted-foreground/30'}`} />
                            <p className="text-[8px] font-black uppercase truncate">{audioFile ? audioFile.name : 'Audio'}</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <input type="file" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className={`p-4 rounded-2xl border border-dashed text-center transition-all ${videoFile ? 'bg-emerald-500/5 border-emerald-500/50' : 'bg-muted border-border hover:border-emerald-500/30'}`}>
                            <Youtube size={12} className={`mx-auto mb-2 ${videoFile ? 'text-emerald-500' : 'text-muted-foreground/30'}`} />
                            <p className="text-[8px] font-black uppercase truncate">{videoFile ? videoFile.name : 'MP4'}</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setNotesFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className={`p-4 rounded-2xl border border-dashed text-center transition-all ${notesFile ? 'bg-orange-500/5 border-orange-500/50' : 'bg-muted border-border hover:border-orange-500/30'}`}>
                            <BookOpen size={12} className={`mx-auto mb-2 ${notesFile ? 'text-orange-500' : 'text-muted-foreground/30'}`} />
                            <p className="text-[8px] font-black uppercase truncate">{notesFile ? notesFile.name : 'Notes (PDF)'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <button 
              disabled={issubmitting}
              className="w-full bg-primary text-white font-black py-4 rounded-xl text-xs tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
            >
              {issubmitting ? 'POSTING...' : 'POST SERMON'}
            </button>
          </form>
        </div>

        {/* Right: Recent List */}
        <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Recent Sermons</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-20 text-center animate-pulse text-muted-foreground/20 font-black text-xs tracking-widest">LOADING...</div>
            ) : sermons.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground/20 font-black text-xs tracking-widest uppercase">No sermons posted yet</div>
            ) : (
              sermons.map((sermon) => (
                <div key={sermon.id} className="group bg-muted border border-border p-4 rounded-2xl flex items-center justify-between hover:border-primary/20 transition-all shadow-sm">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground/30 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                      <Youtube className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground/90">{sermon.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter flex items-center gap-1">
                          <User className="w-2.5 h-2.5" /> {sermon.speaker}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> {format(new Date(sermon.date), 'MMM dd, yyyy')}
                        </span>
                        {sermon.is_featured && (
                          <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase flex items-center gap-1">
                            <Star className="w-2 h-2" /> Featured
                          </span>
                        )}
                      </div>
                      
                      {/* Insights Bar */}
                      {sermon.metrics?.[0] ? (
                        <div className="flex items-center gap-4 mt-3 bg-card/50 p-2 rounded-xl border border-border/50">
                           <div className="flex flex-col">
                            <span className="text-[7px] font-black text-muted-foreground/40 uppercase">Completion</span>
                            <span className="text-[10px] font-black text-primary">{(sermon.metrics[0].completion_rate || 0).toFixed(1)}%</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-muted-foreground/40 uppercase">Avg. Watch</span>
                            <span className="text-[10px] font-black text-foreground">{(sermon.metrics[0].avg_watch_time_seconds / 60 || 0).toFixed(1)}m</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-muted-foreground/40 uppercase">Views</span>
                            <span className="text-[10px] font-black text-foreground">{sermon.metrics[0].total_views || 0}</span>
                          </div>
                          <button 
                            onClick={() => syncAnalytics(sermon.id)}
                            className="ml-auto p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground/40 hover:text-primary"
                          >
                            <Share2 size={10} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => syncAnalytics(sermon.id)}
                          className="mt-3 text-[8px] font-black text-primary/40 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <Clock size={8} /> Run Initial Impact Analysis
                        </button>
                      )}

                      {/* Admin Controls */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
                        <button 
                          onClick={() => {
                            setEditingSermon(sermon);
                            setEditTranscript(sermon.transcript_text || '');
                            setEditSummary(sermon.assets?.find(a => a.type === 'notes')?.metadata?.summary || '');
                          }}
                          className="text-[9px] font-black tracking-widest uppercase text-primary hover:text-primary/70 transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 size={10} /> Edit AI Insights
                        </button>
                      </div>

                      {/* Assets Management */}
                      <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar max-w-[200px] md:max-w-xs">
                        {sermon.assets?.map((asset: any) => (
                          <div key={asset.id} className="bg-card px-2 py-1 rounded-lg flex items-center gap-2 border border-border group/asset">
                            <span className="text-[8px] font-black uppercase text-muted-foreground/60">{asset.type}</span>
                            <button 
                              onClick={async () => {
                                await supabase.from('media_assets').delete().eq('id', asset.id);
                                fetchSermons();
                                toast.success("Asset removed");
                              }}
                              className="text-red-500 opacity-0 group-hover/asset:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const type = prompt("Asset Type (audio, notes, transcript, clip):", "audio");
                            const url = prompt("Public URL for asset:");
                            if (type && url) {
                              supabase.from('media_assets').insert({
                                sermon_id: sermon.id,
                                org_id: orgId,
                                type,
                                url
                              }).then(() => {
                                fetchSermons();
                                toast.success("Asset linked");
                              });
                            }
                          }}
                          className="bg-primary/5 hover:bg-primary/10 text-primary p-1.5 rounded-lg border border-primary/10 transition-colors"
                          title="Add Asset"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(sermon.id)}
                    className="p-3 text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Edit AI Dialog */}
      {editingSermon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black uppercase text-foreground">{editingSermon.title}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Human-in-the-loop: Edit AI Outputs</p>
              </div>
              <button onClick={() => setEditingSermon(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={20} className="text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">Transcript (Auto-Synced to Search)</label>
                <textarea 
                  value={editTranscript}
                  onChange={(e) => setEditTranscript(e.target.value)}
                  className="w-full h-48 bg-muted border border-border rounded-2xl p-4 text-xs font-medium focus:border-primary outline-none transition-all text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">AI Summary Override</label>
                <textarea 
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full h-24 bg-muted border border-border rounded-2xl p-4 text-xs font-medium focus:border-primary outline-none transition-all text-foreground"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/40 flex justify-end">
              <button 
                onClick={handleUpdateAISentiments}
                className="bg-primary text-white px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:scale-[1.02] active:scale-[0.95] transition-all"
              >
                <Save size={14} /> Update Assets
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
