"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { config } from '../config/wagmi';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChainGuard } from './components/ChainGuard';
import { AutoplayBanner } from './components/AutoplayBanner';
import { NicknameProvider } from '../context/NicknameContext';
import { AudioProvider } from '../contexts/AudioContext';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isMockRoute = pathname.startsWith('/mock-');
    if (status === 'disconnected' && pathname !== "/" && !isMockRoute) {
      router.push("/");
    }
  }, [status, pathname, router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NicknameProvider>
          <AudioProvider>
            <AutoplayBanner />
            <ChainGuard>
              <AuthGate>
                {children}
              </AuthGate>
            </ChainGuard>
          </AudioProvider>
        </NicknameProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
