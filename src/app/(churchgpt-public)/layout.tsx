import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ChurchGPT',
  description: 'Your Christian AI companion',
  icons: {
    icon: '/cgpt-icons/icon-48x48.png',
    shortcut: '/cgpt-icons/icon-48x48.png',
    apple: '/cgpt-icons/icon-128x128.png',
    other: [
      { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/cgpt-icons/icon-48x48.png' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', url: '/cgpt-icons/icon-96x96.png' },
      { rel: 'icon', type: 'image/png', sizes: '192x192', url: '/cgpt-icons/icon-192x192.png' },
    ],
  },
}

export default function ChurchGPTPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Google Fonts for ChurchGPT design system */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div className="cgpt-root">
        {children}
      </div>
    </>
  )
}
