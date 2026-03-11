export async function generateStaticParams() {
    return [
        { slug: 'worship' }, { slug: 'ushers' }, { slug: 'childrens' },
        { slug: 'youth' }, { slug: 'evangelism' }, { slug: 'prayer' },
        { slug: 'media' }, { slug: 'hospitality' }, { slug: 'fellowship' },
        { slug: 'finance' }, { slug: 'missions' }, { slug: 'pastoral' },
    ];
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
