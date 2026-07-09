import { useAccount } from "wagmi";
import { useGlobalRanking } from "./useGlobalRanking";

export function useGlobalRankingPreview() {
  const { address, isConnected } = useAccount();
  const { data: players } = useGlobalRanking();

  const playerRow = players?.find(
    (p) => p.address.toLowerCase() === address?.toLowerCase()
  );
  const diplomasWon = playerRow ? playerRow.diplomas : 0;

  return {
    diplomasWon,
    isConnected,
  };
}
