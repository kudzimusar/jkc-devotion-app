import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ChurchGPT',
  description: 'Your Christian AI companion',
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
