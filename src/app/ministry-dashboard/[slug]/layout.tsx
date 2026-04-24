import { MINISTRY_SLUGS } from '@/lib/ministries';

export function generateStaticParams() {
    return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function MinistrySlugLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ padding: 0, margin: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {children}
        </div>
    );
}
