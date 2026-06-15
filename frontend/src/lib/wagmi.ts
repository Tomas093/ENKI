import { createConfig, http } from "wagmi";
import { hardhat } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";

// Local Hardhat node (chain-31337)
export const wagmiConfig = createConfig({
  chains: [hardhat],
  connectors: [injected()],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
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
