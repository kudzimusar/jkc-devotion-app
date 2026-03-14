'use client';

export default function StaffPage() {
  const staff = [
    { name: "Pastor Marcel Jonte Gadsden", role: "Senior Pastor" },
    { name: "Elder Sanna Patterson", role: "Assistant Pastor / Discipleship Director" },
    { name: "Min. Yutaka Nakamura", role: "Teacher / Fellowship Director" },
    { name: "Eri Kudo", role: "Worship Director" },
    { name: "Eiko Kuboyama", role: "Evangelism Director / Finance Leader" },
    { name: "Yurie Suzuki", role: "Welcome Director" },
    { name: "Naomi Yamamoto", role: "Youth Director" },
    { name: "Itsuki Kuboyama", role: "Language Class Director" }
  ];

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(n => n[0])
      .filter((_, i, arr) => i === 0 || i === arr.length - 1)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Strip */}
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500 blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">OUR LEADERSHIP TEAM</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
            <span className="font-serif italic font-medium pr-4 normal-case text-white/90">Staff</span> & Team
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-white/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>Leadership & Staff</span>
          </nav>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-20">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] uppercase">SERVING THE COMMUNITY</p>
          <h2 className="text-4xl md:text-5xl font-black italic font-serif">Meet the team serving Japan Kingdom Church</h2>
          <p className="text-white/40 text-sm font-medium leading-relaxed font-sans uppercase tracking-widest pt-4">
            A diverse group of leaders dedicated to fulfilling the mission of God in Japan.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {staff.map((person, idx) => (
            <div 
              key={idx} 
              className="glass rounded-[3rem] p-10 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-center flex flex-col items-center group"
            >
              <div className="relative mb-8">
                <div className="absolute -inset-2 bg-[var(--primary)]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-24 h-24 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white flex items-center justify-center text-3xl font-black transition-all">
                  {getInitials(person.name)}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-black text-white/90 uppercase tracking-widest leading-tight h-10 flex items-center justify-center">
                  {person.name}
                </h3>
                <div className="h-px w-8 bg-white/10 mx-auto" />
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest px-4 group-hover:text-[var(--primary)] transition-colors">
                  {person.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
