"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { config } from '../config/wagmi';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChainGuard } from './components/ChainGuard';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isConnected, isReconnecting } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReconnecting && !isConnected && pathname !== "/") {
      router.push("/");
    }
  }, [isConnected, isReconnecting, pathname, router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ChainGuard>
          <AuthGate>
            {children}
          </AuthGate>
        </ChainGuard>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
