"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { config } from '@/core/blockchain/wagmi';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChainGuard } from '@/features/system/ChainGuard';
import { AutoplayBanner } from '@/shared/layout/AutoplayBanner';
import { NicknameProvider } from '@/core/context/NicknameContext';
import { AudioProvider } from '@/core/context/AudioContext';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'disconnected' && pathname !== "/") {
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
