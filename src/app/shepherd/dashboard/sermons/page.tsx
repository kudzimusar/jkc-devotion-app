'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { toast } from 'sonner';
import { Plus, Trash2, Youtube, Calendar, User, BookOpen, Link as LinkIcon, Star } from 'lucide-react';
import { format } from 'date-fns';

type Sermon = {
  id: string;
  title: string;
  speaker: string;
  youtube_url: string;
  series?: string;
  scripture?: string;
  date: string;
  featured: boolean;
};

import { useAdminCtx } from '../layout';

export default function SermonManagementPage() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const { orgId } = useAdminCtx();

  // Form state
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [series, setSeries] = useState('');
  const [scripture, setScripture] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [featured, setFeatured] = useState(true);
  const [issubmitting, setIsSubmitting] = useState(false);

  const fetchSermons = async () => {
    if (!orgId) return;
    try {
      const { data, error } = await supabaseAdmin
        .from('public_sermons')
        .select('*')
        .eq('org_id', orgId)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSermons(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch sermons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchSermons();
  }, [orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !speaker) {
      toast.error('Title and Speaker are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabaseAdmin
        .from('public_sermons')
        .insert({
          org_id: orgId,
          title,
          speaker,
          youtube_url: youtubeUrl,
          series: series || null,
          scripture: scripture || null,
          date,
          featured
        });

      if (error) throw error;

      toast.success('Sermon posted — homepage updated.');
      setTitle('');
      setSpeaker('');
      setYoutubeUrl('');
      setSeries('');
      setScripture('');
      setFeatured(true);
      fetchSermons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to post sermon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sermon?')) return;

    try {
      const { error } = await supabaseAdmin
        .from('public_sermons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Sermon deleted');
      fetchSermons();
    } catch (error: any) {
      toast.error('Failed to delete sermon');
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-black">Sermon Management</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
          Post sermons — updates the public website automatically
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left: Add Form */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest">Add New Sermon</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Title *</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. A Genuine Believer"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Speaker *</label>
              <input 
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="e.g. Pastor Marcel Jonte"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Featured</label>
                <div className="flex items-center h-[46px] px-4 bg-black/40 border border-white/10 rounded-xl">
                    <input 
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    <span className="ml-3 text-xs font-bold text-white/60">Mark as Featured</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">YouTube URL</label>
              <div className="relative">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Scripture (Optional)</label>
                <input 
                  value={scripture}
                  onChange={(e) => setScripture(e.target.value)}
                  placeholder="e.g. Psalms 23:1"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
                />
              </div>
            </div>

            <button 
              disabled={issubmitting}
              className="w-full bg-[var(--primary)] text-white font-black py-4 rounded-xl text-xs tracking-[0.2em] shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
            >
              {issubmitting ? 'POSTING...' : 'POST SERMON'}
            </button>
          </form>
        </div>

        {/* Right: Recent List */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest">Recent Sermons</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-20 text-center animate-pulse text-white/20 font-black text-xs tracking-widest">LOADING...</div>
            ) : sermons.length === 0 ? (
              <div className="py-20 text-center text-white/20 font-black text-xs tracking-widest">NO SERMONS POSTED</div>
            ) : (
              sermons.map((sermon) => (
                <div key={sermon.id} className="group bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[var(--primary)] transition-colors">
                      <Youtube className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white/90">{sermon.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter flex items-center gap-1">
                          <User className="w-2.5 h-2.5" /> {sermon.speaker}
                        </span>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> {format(new Date(sermon.date), 'MMM dd, yyyy')}
                        </span>
                        {sermon.featured && (
                          <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase flex items-center gap-1">
                            <Star className="w-2 h-2" /> Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(sermon.id)}
                    className="p-3 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
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
  );
}
