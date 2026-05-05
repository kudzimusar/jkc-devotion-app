import { Metadata } from 'next';
import WelcomeClient from '@/app/(public)/WelcomeClient';
import { supabase } from '@/lib/supabase';

type Props = {
  params: Promise<{ church_slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { church_slug } = await params;
  
  if (!church_slug || church_slug === 'jkc') {
    return {
      title: 'Japan Kingdom Church — Tokyo',
      description: 'Building a Strong Christian Community that Represents Christ to Japanese Society. Join us Sundays at 10:30AM in Akishima, Tokyo.',
    };
  }

  try {
    const fetchPromise = supabase
      .from('organizations')
      .select('name, description')
      .eq('church_slug', church_slug)
      .single();

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 5000)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    const data = result && 'data' in result ? result.data : null;

    return {
      title: data?.name ? `${data.name} | Church OS` : 'Church OS Tenant',
      description: data?.description || 'Welcome to our church community.',
    };
  } catch {
    return {
      title: 'Church OS Tenant',
      description: 'Welcome to our church community.',
    };
  }
}

export default function ChurchSlugWelcomePage() {
  return <WelcomeClient />;
}
