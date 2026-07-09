import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

export interface ProfessorGame {
  id: number;
  address: `0x${string}`;
}

export function useHostDashboard() {
  const { address } = useAccount();
  const [games, setGames] = useState<ProfessorGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) return;

    const fetchGames = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/professor/${address}/games`);
        if (res.ok) {
          const data = await res.json();
          setGames(data.games || []);
        }
      } catch (err) {
        console.error("Failed to fetch professor games", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, [address]);

  return {
    gameAddresses: games.map(g => g.address),
    games,
    hasGames: games.length > 0,
    isLoading
  };
}
