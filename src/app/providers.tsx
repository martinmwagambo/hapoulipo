'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('hapo-theme');
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
