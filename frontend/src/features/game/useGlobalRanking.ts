import { useQuery } from '@tanstack/react-query';

export interface GlobalPlayer {
  rank: number;
  address: string;
  ens: string;
  diplomas: number;
  gamesPlayed: number;
  totalPrize: number;
  isSelf?: boolean;
}

export function useGlobalRanking() {
  return useQuery<GlobalPlayer[]>({
    queryKey: ['globalRanking'],
    queryFn: async () => {
      const res = await fetch('/api/ranking');
      if (!res.ok) throw new Error(`Ranking API error: ${res.status}`);
      const json = await res.json();
      return json.players as GlobalPlayer[];
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
