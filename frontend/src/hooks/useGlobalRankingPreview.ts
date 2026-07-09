import { useAccount } from "wagmi";
import { useGlobalRanking } from "./useGlobalRanking";

export function useGlobalRankingPreview() {
  const { address, isConnected } = useAccount();
  const { data: players = [], isLoading } = useGlobalRanking();

  const diplomasWon = address
    ? (players.find(
        (p) => p.address.toLowerCase() === address.toLowerCase()
      )?.diplomas ?? 0)
    : 0;

  return {
    diplomasWon,
    isConnected,
    isLoading,
  };
}
