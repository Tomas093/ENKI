'use client' // Esto le dice a Next.js que este componente corre en el navegador

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '../config'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Inicializamos el cliente de consultas una sola vez
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}