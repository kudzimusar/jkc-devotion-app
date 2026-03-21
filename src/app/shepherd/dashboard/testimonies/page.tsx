"use client";
import { supabase } from "@/lib/supabase";


import { useState, useEffect } from 'react';

import { Play, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminCtx } from '../Context';

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
    const { data } = await supabase
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

    const { error } = await supabase
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
    
    const { error } = await supabase
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
          <h1 className="text-3xl font-black text-foreground italic">Testimony Management</h1>
          <p className="text-muted-foreground text-sm">Post member stories to the public website.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-[2rem] p-8 border border-border space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-foreground">Add New</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase ml-1">Title / Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-muted/50 border border-border rounded-2xl px-6 py-4 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 transition-all outline-none"
                  placeholder="e.g. Testimony — New Life"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase ml-1">YouTube URL</label>
                <input 
                  required
                  value={formData.youtube_url}
                  onChange={e => setFormData({...formData, youtube_url: e.target.value})}
                  className="w-full bg-muted/50 border border-border rounded-2xl px-6 py-4 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 transition-all outline-none"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase ml-1">Description (Optional)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full bg-muted/50 border border-border rounded-2xl px-6 py-4 text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 transition-all outline-none resize-none"
                  placeholder="A short summary..."
                />
              </div>

              <button 
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'POST TO WEBSITE'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-[2rem] p-8 border border-border space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/40 border border-border">
                <Play className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-foreground">Current Feed</h2>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                 <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : testimonies.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground/20 italic font-medium">
                 No testimonies posted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {testimonies.map(t => (
                  <div key={t.id} className="group bg-muted/30 border border-border rounded-2xl p-6 flex items-center justify-between hover:border-primary/20 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground/20">
                           <Play className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="font-black text-foreground">{t.name}</h3>
                           <p className="text-xs text-muted-foreground/60 truncate max-w-[300px]">{t.youtube_url}</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleDelete(t.id)}
                       className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
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
