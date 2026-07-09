import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { formatEther, parseAbiItem } from 'viem';
import { FACTORY_ADDRESS } from '../lib/contracts';

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
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['globalRanking', FACTORY_ADDRESS],
    queryFn: async () => {
      if (!publicClient) return [];

      // 1. Fetch GameCreated logs from Factory
      const gameCreatedLogs = await publicClient.getLogs({
        address: FACTORY_ADDRESS,
        event: parseAbiItem('event GameCreated(address indexed gameAddress, address indexed professor)'),
        fromBlock: 11094381n,
        toBlock: 'latest',
      });

      const gameAddresses = gameCreatedLogs
        .map((log) => log.args.gameAddress)
        .filter((addr): addr is `0x${string}` => !!addr);

      if (gameAddresses.length === 0) return [];

      // 2. Fetch PlayerJoined logs
      const playerJoinedLogs = await publicClient.getLogs({
        address: gameAddresses,
        event: parseAbiItem('event PlayerJoined(address indexed player, uint256 feePaid)'),
        fromBlock: 11094381n,
        toBlock: 'latest',
      });

      // 3. Fetch DiplomaClaimed logs
      const diplomaClaimedLogs = await publicClient.getLogs({
        address: gameAddresses,
        event: parseAbiItem('event DiplomaClaimed(address indexed student)'),
        fromBlock: 11094381n,
        toBlock: 'latest',
      });

      // 4. Fetch PrizeClaimed logs
      const prizeClaimedLogs = await publicClient.getLogs({
        address: gameAddresses,
        event: parseAbiItem('event PrizeClaimed(address indexed recipient, uint256 amount)'),
        fromBlock: 11094381n,
        toBlock: 'latest',
      });

      // 5. Aggregate data
      const playerStats = new Map<string, { diplomas: number; gamesPlayed: number; totalPrize: bigint }>();

      const getStats = (address: string) => {
        const key = address.toLowerCase();
        if (!playerStats.has(key)) {
          playerStats.set(key, { diplomas: 0, gamesPlayed: 0, totalPrize: 0n });
        }
        return playerStats.get(key)!;
      };

      playerJoinedLogs.forEach((log) => {
        const player = log.args.player;
        if (!player) return;
        getStats(player).gamesPlayed += 1;
      });

      diplomaClaimedLogs.forEach((log) => {
        const student = log.args.student;
        if (!student) return;
        getStats(student).diplomas += 1;
      });

      prizeClaimedLogs.forEach((log) => {
        const recipient = log.args.recipient;
        if (!recipient) return;
        getStats(recipient).totalPrize += log.args.amount || 0n;
      });

      // 6. Format and sort
      const players: GlobalPlayer[] = Array.from(playerStats.entries()).map(([address, stats]) => ({
        rank: 0,
        address,
        ens: `${address.slice(0, 6)}...${address.slice(-4)}`, // Placeholder for ENS/formatting
        diplomas: stats.diplomas,
        gamesPlayed: stats.gamesPlayed,
        totalPrize: Number(formatEther(stats.totalPrize)),
      }));

      // Sort by diplomas desc, then totalPrize desc, then gamesPlayed desc
      players.sort((a, b) => {
        if (b.diplomas !== a.diplomas) return b.diplomas - a.diplomas;
        if (b.totalPrize !== a.totalPrize) return b.totalPrize - a.totalPrize;
        return b.gamesPlayed - a.gamesPlayed;
      });

      // Assign ranks
      players.forEach((p, idx) => {
        p.rank = idx + 1;
      });

      return players;
    },
    enabled: !!publicClient,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
