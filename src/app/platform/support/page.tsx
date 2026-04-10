'use client';
import React, { useState } from 'react';
import { Church, Clock, Calendar, Zap, CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { basePath as BP } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { label: 'AI Intelligence Issue', value: 'ai_intelligence' },
  { label: 'Giving & Payments', value: 'giving_payments' },
  { label: 'Member Management', value: 'member_management' },
  { label: 'ChurchGPT', value: 'churchgpt' },
  { label: 'Account Access', value: 'account_access' },
  { label: 'Billing Question', value: 'billing' },
  { label: 'Technical Bug', value: 'technical_bug' },
  { label: 'Other', value: 'other' },
];

const SEVERITIES = [
  { label: 'Low', desc: 'General question', value: 'low' },
  { label: 'Normal', desc: 'Feature not working as expected', value: 'normal' },
  { label: 'High', desc: 'Affecting church operations', value: 'high' },
  { label: 'Critical', desc: 'Complete outage or data issue', value: 'critical' },
];

export default function SupportPage() {
  const router = useRouter();
  const [churchName, setChurchName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [ticketRef, setTicketRef] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!churchName || !contactName || !email || !category || !subject || !description) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: dbErr } = await supabase
      .from('support_tickets')
      .insert({
        church_name: churchName,
        contact_name: contactName,
        email,
        phone: phone || null,
        category,
        subject,
        description,
        severity,
      })
      .select('ticket_ref')
      .single();
    setLoading(false);
    if (dbErr) {
      setError('Something went wrong. Please try again.');
    } else {
      setTicketRef(data?.ticket_ref || null);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Navbar */}
      <nav className="border-b border-slate-100 py-4 px-6 flex items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push(`${BP}/platform/`)}
        >
          <div className="bg-emerald-600 p-2 rounded-2xl shadow-lg shadow-emerald-500/30">
            <Church className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900">Church<span className="text-emerald-600">OS</span></span>
        </div>
        <button
          onClick={() => router.push(`${BP}/platform/`)}
          className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} /> Back to Platform
        </button>
      </nav>

      <div className="container mx-auto px-6 py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <span className="inline-flex items-center rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
            Church OS Support
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900">How can we help?</h1>
          <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Technical support for Church OS software clients. Submit a ticket and our team will respond within 24 hours.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: <Clock size={20} className="text-emerald-600" />, label: 'Response Time', value: 'Under 24 hours' },
            { icon: <Calendar size={20} className="text-indigo-600" />, label: 'Support Hours', value: 'Mon–Fri, 9am–6pm JST' },
            { icon: <Zap size={20} className="text-amber-500" />, label: 'Emergency', value: 'Critical issues: same day' },
          ].map((card, i) => (
            <div key={i} className="rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mx-auto shadow-sm">
                {card.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <p className="text-lg font-black text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Ticket form */}
        <div className="max-w-2xl mx-auto mb-20">
          {ticketRef !== null ? (
            <div className="text-center space-y-6 py-16 rounded-3xl border border-slate-100 bg-slate-50 px-12">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Ticket submitted.</h2>
              <div className="space-y-2">
                {ticketRef && (
                  <p className="text-emerald-600 font-black text-lg">Your reference: {ticketRef}</p>
                )}
                <p className="text-slate-500 font-medium">We will respond to <strong>{email}</strong> within 24 hours.</p>
              </div>
              <button
                onClick={() => router.push(`${BP}/platform/`)}
                className="inline-flex items-center gap-2 text-sm font-black text-emerald-600 hover:text-emerald-700"
              >
                <ArrowLeft size={16} /> Back to Platform
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-10 space-y-6">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Submit a Support Ticket</h2>

              {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}

              <div className="space-y-4">
                <input
                  placeholder="Church / Organisation Name *"
                  value={churchName}
                  onChange={e => setChurchName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400 text-sm"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Your Name *"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400 text-sm"
                  />
                  <input
                    placeholder="Email Address *"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400 text-sm"
                  />
                </div>
                <input
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400 text-sm"
                />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-500 focus:outline-none focus:border-emerald-400 text-sm"
                >
                  <option value="">Issue Category *</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <input
                  placeholder="Subject / Brief Description *"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400 text-sm"
                />
                <textarea
                  placeholder="Describe the issue in detail. Include any error messages, steps to reproduce, and when it started."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400 text-sm resize-none"
                />

                {/* Severity */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Severity</p>
                  <div className="space-y-2">
                    {SEVERITIES.map(s => (
                      <label key={s.value} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="severity"
                          value={s.value}
                          checked={severity === s.value}
                          onChange={() => setSeverity(s.value)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-black text-sm text-slate-900">{s.label}</span>
                        <span className="text-slate-400 text-xs font-medium">— {s.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-13 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Self-service section */}
        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 text-center">Common Solutions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Church OS Documentation',
                desc: 'Setup guides, feature walkthroughs, and FAQs.',
                link: 'https://docs.churchos.ai',
              },
              {
                title: 'Video Tutorials',
                desc: 'Step-by-step video guides for every feature.',
                link: 'https://docs.churchos.ai/videos',
              },
              {
                title: 'Community Forum',
                desc: 'Connect with other Church OS administrators and leaders.',
                link: 'https://community.churchos.ai',
              },
            ].map((card, i) => (
              <div key={i} className="rounded-3xl border border-slate-100 bg-slate-50 p-8 space-y-3 group cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all">
                <h3 className="font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{card.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{card.desc}</p>
                <a
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                >
                  Visit <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
