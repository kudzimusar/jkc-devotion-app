
'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Play, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminCtx } from '../layout';

export default function TestimoniesManagement() {
  const [testimonies, setTestimonies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    youtube_url: '',
    description: ''
  });
  const { orgId } = useAdminCtx();

  useEffect(() => {
    if (orgId) fetchTestimonies();
  }, [orgId]);

  async function fetchTestimonies() {
    if (!orgId) return;
    const { data } = await supabaseAdmin
      .from('public_testimonies')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    setTestimonies(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSubmitting(true);

    const { error } = await supabaseAdmin
      .from('public_testimonies')
      .insert([{ ...formData, org_id: orgId }]);

    if (error) {
      toast.error('Failed to add testimony');
    } else {
      toast.success('Testimony added successfully');
      setFormData({ name: '', youtube_url: '', description: '' });
      fetchTestimonies();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return;
    
    const { error } = await supabaseAdmin
      .from('public_testimonies')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete testimony');
    } else {
      toast.success('Testimony deleted');
      fetchTestimonies();
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic">Testimony Management</h1>
          <p className="text-white/40 text-sm">Post member stories to the public website.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <div className="glass rounded-[2rem] p-8 border border-white/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">Add New</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-white/40 uppercase ml-1">Title / Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:border-[var(--primary)]/50 transition-all outline-none"
                  placeholder="e.g. Testimony — New Life"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-white/40 uppercase ml-1">YouTube URL</label>
                <input 
                  required
                  value={formData.youtube_url}
                  onChange={e => setFormData({...formData, youtube_url: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:border-[var(--primary)]/50 transition-all outline-none"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-white/40 uppercase ml-1">Description (Optional)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:border-[var(--primary)]/50 transition-all outline-none resize-none"
                  placeholder="A short summary..."
                />
              </div>

              <button 
                disabled={submitting}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'POST TO WEBSITE'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-2">
          <div className="glass rounded-[2rem] p-8 border border-white/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                <Play className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">Current Feed</h2>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                 <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              </div>
            ) : testimonies.length === 0 ? (
              <div className="py-20 text-center text-white/20 italic">
                 No testimonies posted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {testimonies.map(t => (
                  <div key={t.id} className="group bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between hover:border-white/20 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center text-white/20">
                           <Play className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="font-black text-white">{t.name}</h3>
                           <p className="text-xs text-white/30 truncate max-w-[300px]">{t.youtube_url}</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleDelete(t.id)}
                       className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
