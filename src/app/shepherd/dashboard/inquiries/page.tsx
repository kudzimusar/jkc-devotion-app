'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { format } from 'date-fns';
import { Mail, ChevronDown, ChevronUp, User, AtSign, Clock } from 'lucide-react';
import { useAdminCtx } from '../layout';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { orgId } = useAdminCtx();

  useEffect(() => {
    async function fetchInquiries() {
      if (!orgId) return;
      try {
        const { data, error } = await supabaseAdmin
          .from('public_inquiries')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setInquiries(data || []);
      } catch (err) {
        console.error('Error fetching inquiries:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInquiries();
  }, []);

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-black">Website Inquiries</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
          Contact form submissions from the public website
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-white/20 font-black text-xs tracking-widest">
            LOADING INQUIRIES...
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-20 text-center bg-white/5 border border-white/5 rounded-[2rem]">
            <p className="text-white/20 font-black text-xs tracking-widest uppercase">No inquiries received yet.</p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <div 
              key={inquiry.id}
              className={`bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden transition-all ${expandedId === inquiry.id ? 'ring-1 ring-[var(--primary)]/30' : ''}`}
            >
              <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedId(expandedId === inquiry.id ? null : inquiry.id)}
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white/90">
                      {inquiry.first_name} {inquiry.last_name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-1">
                        <AtSign className="w-2.5 h-2.5" /> {inquiry.email}
                      </span>
                      <span className="text-[10px] font-bold text-white/40 uppercase flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {format(new Date(inquiry.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                   <p className="hidden md:block text-[11px] text-white/30 font-medium italic max-w-xs truncate">
                     "{inquiry.message.substring(0, 60)}..."
                   </p>
                   <div className="text-white/20 group-hover:text-white transition-colors">
                     {expandedId === inquiry.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                   </div>
                </div>
              </div>

              {expandedId === inquiry.id && (
                <div className="px-6 pb-8 pt-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-black/40 rounded-2xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Full Name</p>
                         <p className="text-xs font-bold text-white/80">{inquiry.first_name} {inquiry.last_name}</p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Email Address</p>
                         <p className="text-xs font-bold text-white/80">{inquiry.email}</p>
                       </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Message</p>
                      <p className="text-sm text-white/70 leading-relaxed font-medium whitespace-pre-wrap">
                        {inquiry.message}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <a 
                      href={`mailto:${inquiry.email}`}
                      className="text-[10px] font-black tracking-widest text-[var(--primary)] uppercase hover:text-white transition-colors"
                    >
                      REPLY VIA EMAIL →
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
