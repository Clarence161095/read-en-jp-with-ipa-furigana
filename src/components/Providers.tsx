'use client';

import { SessionProvider } from 'next-auth/react';
import AppChromeTools from '@/components/AppChromeTools';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <AppChromeTools />
    </SessionProvider>
  );
}
