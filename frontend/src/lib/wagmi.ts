import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch every 5 seconds to catch on-chain state changes
      refetchInterval: 5_000,
      staleTime: 2_000,
    },
  },
});
