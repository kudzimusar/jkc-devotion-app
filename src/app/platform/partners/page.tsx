'use client';
import React, { useState } from 'react';
import { Church, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { basePath as BP } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const PARTNERSHIP_TYPES = [
  { label: 'Denominational Body', value: 'denominational_body' },
  { label: 'NGO / Aid Organisation', value: 'ngo_aid_organisation' },
  { label: 'Tech Company', value: 'tech_company' },
  { label: 'Mission Network', value: 'mission_network' },
  { label: 'Media Ministry', value: 'media_ministry' },
  { label: 'Education Institution', value: 'education_institution' },
  { label: 'Government Body', value: 'government_body' },
  { label: 'Other', value: 'other' },
];

export default function PartnersPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!orgName || !contactName || !email || !country || !type || !description) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: dbErr } = await supabase.from('partnership_inquiries').insert({
      organisation_name: orgName,
      contact_name: contactName,
      email,
      phone: phone || null,
      website: website || null,
      country,
      partnership_type: type,
      description,
      proposed_value: value || null,
    });
    setLoading(false);
    if (dbErr) {
      setError('Something went wrong. Please try again.');
    } else {
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans antialiased">
      {/* Left panel */}
      <div className="md:w-5/12 bg-emerald-600 p-12 md:p-16 text-white flex flex-col justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push(`${BP}/platform/`)}
        >
          <div className="bg-white/20 p-2 rounded-2xl">
            <Church className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter">Church<span className="text-emerald-200">OS</span></span>
        </div>

        <div className="space-y-10">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
            Partner With the Global Sanctuary.
          </h1>
          <p className="text-emerald-100 font-medium leading-relaxed text-lg">
            Church OS connects faith communities across 16 countries. We partner with denominations,
            aid organisations, mission networks, and technology companies to amplify our collective impact.
          </p>
          <div className="space-y-6">
            {[
              { title: 'Denominational Bodies', desc: 'Bring your member churches onto the platform' },
              { title: 'NGO & Aid Organisations', desc: 'Connect your relief programs with verified churches' },
              { title: 'Mission Networks', desc: 'Coordinate global outreach through our registry' },
              { title: 'Technology Partners', desc: 'Integrate your tools with the Church OS ecosystem' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5 text-emerald-300" />
                <div>
                  <p className="font-black text-sm">{item.title}</p>
                  <p className="text-emerald-200 text-sm font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
          Church OS · Global Partnership Programme
        </p>
      </div>

      {/* Right panel */}
      <div className="md:w-7/12 p-8 md:p-16 flex items-center justify-center">
        <div className="w-full max-w-xl">
          {done ? (
            <div className="text-center space-y-6 py-16">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Proposal received.</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                Our partnerships team will review your submission and be in touch within 5 business days.
              </p>
              <button
                onClick={() => router.push(`${BP}/platform/`)}
                className="inline-flex items-center gap-2 text-sm font-black text-emerald-600 hover:text-emerald-700"
              >
                <ArrowLeft size={16} /> Back to Platform
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Start a Partnership Conversation</h2>
                <p className="text-slate-400 font-medium mt-2">Tell us about your organisation and how we can work together.</p>
              </div>

              {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}

              <div className="space-y-4">
                <input
                  placeholder="Organisation Name *"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400"
                />
                <input
                  placeholder="Your Name *"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400"
                />
                <input
                  placeholder="Email Address *"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400"
                  />
                  <input
                    placeholder="Website (optional)"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <input
                  placeholder="Country *"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400"
                />
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-500 focus:outline-none focus:border-emerald-400"
                >
                  <option value="">Partnership Type *</option>
                  {PARTNERSHIP_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
                <textarea
                  placeholder="How would this partnership benefit churches? *"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400 resize-none"
                />
                <textarea
                  placeholder="What value do you bring? (optional)"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  rows={3}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:border-emerald-400 resize-none"
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Partnership Proposal'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
