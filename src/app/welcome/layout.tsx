import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import { PublicThemeWrapper } from '@/components/public/PublicThemeWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Japan Kingdom Church — Tokyo',
  description: 'Building a Strong Christian Community that Represents Christ to Japanese Society.',
  openGraph: {
    title: 'Japan Kingdom Church',
    description: 'A Christian community in Tokyo, Japan.',
    url: 'https://kudzimusar.github.io/jkc-devotion-app/welcome/',
    siteName: 'Japan Kingdom Church',
  },
};

export default function PublicLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <PublicThemeWrapper>
      <PublicNav />
      <main>{children}</main>
      <PublicFooter />
    </PublicThemeWrapper>
  );
}
