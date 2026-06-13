import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App";
import { wagmiConfig, queryClient } from "./lib/wagmi";
import { GameProvider } from "./lib/GameContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <App />
      </GameProvider>
    </QueryClientProvider>
  </WagmiProvider>
);