'use client';
export default function TermsPage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      body: 'By accessing and using the Japan Kingdom Church website, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our site.'
    },
    {
      title: 'Use of the Website',
      body: 'This website is provided for informational purposes about Japan Kingdom Church and to facilitate community engagement. You may not use this site for any unlawful purpose or in any way that could damage the reputation or operation of Japan Kingdom Church.'
    },
    {
      title: 'Church OS Account',
      body: 'When you create a Church OS account, you are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and to notify us immediately of any unauthorized use of your account.'
    },
    {
      title: 'Giving and Donations',
      body: 'All donations made through this website are voluntary and non-refundable unless otherwise required by law. Donations to Kingdom Garden International Ministries (USA 501c3) are tax-deductible to the full extent allowed by US law.'
    },
    {
      title: 'Intellectual Property',
      body: 'All content on this website including text, images, logos, and videos are the property of Japan Kingdom Church or Japan Kingdom Builders, Inc. and may not be reproduced without permission.'
    },
    {
      title: 'Contact',
      body: 'Questions about these terms may be directed to: jkc.contact@gmail.com · 042-519-4940'
    }
  ];

  return (
    <div className="pt-24 pb-32 max-w-3xl mx-auto px-6 space-y-12">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-widest text-[var(--primary)] uppercase">Legal</p>
        <h1 className="text-5xl font-black">Terms of Service</h1>
        <p className="leading-relaxed opacity-70 text-sm">
          Last updated: March 2026
        </p>
      </div>

      {sections.map(section => (
        <div key={section.title} className="space-y-3 border-t border-white/10 pt-8">
          <h2 className="text-xl font-black">{section.title}</h2>
          <p className="leading-relaxed opacity-70">{section.body}</p>
        </div>
      ))}
    </div>
  );
}
