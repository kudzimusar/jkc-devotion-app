'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { basePath as BP } from '@/lib/utils';

export default function PlatformLogin() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`${BP}/corporate/login/`);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-400 font-bold">Redirecting to Church OS login...</p>
    </div>
  );
}
