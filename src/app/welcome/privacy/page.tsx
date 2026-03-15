'use client';
export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-32 max-w-3xl mx-auto px-6 space-y-12">
      <div className="space-y-4">
        <p className="text-[10px] font-black tracking-widest
                      text-[var(--primary)] uppercase">Legal</p>
        <h1 className="text-5xl font-black">Privacy Policy</h1>
        <p className="leading-relaxed opacity-70 text-sm">
          Last updated: March 2026
        </p>
      </div>

      {[
        {
          title: 'Information We Collect',
          body: `We collect information you provide directly to us when
          you use our website, including when you submit our contact
          form, sign up for Church OS, or make a giving inquiry. This
          may include your name, email address, and any message content
          you choose to share.`
        },
        {
          title: 'How We Use Your Information',
          body: `We use the information we collect to respond to your
          inquiries, send you updates about Japan Kingdom Church
          services and events, and improve our website and services.
          We do not sell, trade, or otherwise transfer your personal
          information to third parties.`
        },
        {
          title: 'Giving and Financial Data',
          body: `Financial transactions made through Tithe.ly, PayPal,
          Cash App, or Zelle are processed directly by those third-party
          platforms under their respective privacy policies. We do not
          store credit card or banking details on our servers.`
        },
        {
          title: 'Church OS Member Data',
          body: `If you create a Church OS account, your devotional
          progress, attendance records, and journal entries are stored
          securely in our database hosted by Supabase. This data is
          used solely to support your spiritual growth and is only
          accessible to you and authorized church leadership.`
        },
        {
          title: 'Cookies',
          body: `Our website uses minimal cookies necessary for
          authentication and user session management. We do not use
          advertising or tracking cookies.`
        },
        {
          title: 'Contact Us',
          body: `If you have questions about this privacy policy or
          your personal data, please contact us at:
          jkc.contact@gmail.com`
        },
      ].map(section => (
        <div key={section.title} className="space-y-3 border-t
                                            border-white/10 pt-8">
          <h2 className="text-xl font-black">{section.title}</h2>
          <p className="leading-relaxed opacity-70">{section.body}</p>
        </div>
      ))}
    </div>
  );
}
