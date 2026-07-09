import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, formatEther, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import { FACTORY_ADDRESS } from '../lib/contracts';

const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const globalPublicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

export interface GlobalPlayer {
  rank: number;
  address: string;
  ens: string;
  diplomas: number;
  gamesPlayed: number;
  totalPrize: number;
  isSelf?: boolean;
}

export interface RankingCache {
  lastSyncBlock: string;
  gameAddresses: string[];
  playerStats: [string, { diplomas: number; gamesPlayed: number; totalPrize: string }][];
}

async function getLogsInChunks(
  publicClient: any,
  params: any,
  fromBlock: bigint,
  toBlock: bigint,
  chunkSize = 100000n
) {
  let allLogs: any[] = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    let end = start + chunkSize - 1n;
    if (end > toBlock) end = toBlock;

    const logs = await publicClient.getLogs({
      ...params,
      fromBlock: start,
      toBlock: end,
    });
    allLogs = allLogs.concat(logs);
  }
  return allLogs;
}

const DEPLOYMENT_BLOCK = 11236783n; // UPDATE THIS WHEN REDEPLOYING

export function useGlobalRanking() {
  return useQuery({
    queryKey: ['globalRanking', FACTORY_ADDRESS],
    queryFn: async () => {
      const CACHE_KEY = `enki_ranking_cache_v3_${FACTORY_ADDRESS}`;
      
      let cachedLastSyncBlock = DEPLOYMENT_BLOCK - 1n;
      let cachedGameAddresses: string[] = [];
      const playerStats = new Map<string, { diplomas: number; gamesPlayed: number; totalPrize: bigint }>();

      try {
        const cacheStr = localStorage.getItem(CACHE_KEY);
        if (cacheStr) {
          const cache = JSON.parse(cacheStr) as RankingCache;
          cachedLastSyncBlock = BigInt(cache.lastSyncBlock);
          cachedGameAddresses = cache.gameAddresses;
          cache.playerStats.forEach(([address, stats]) => {
            playerStats.set(address, {
              diplomas: stats.diplomas,
              gamesPlayed: stats.gamesPlayed,
              totalPrize: BigInt(stats.totalPrize),
            });
          });
        }
      } catch (e) {
        console.warn('Failed to parse ranking cache, starting fresh', e);
        localStorage.removeItem(CACHE_KEY);
      }

      const latestBlock = await globalPublicClient.getBlockNumber();
      const fromBlock = cachedLastSyncBlock + 1n;

      if (fromBlock <= latestBlock) {
        // 1. Fetch NEW GameCreated logs
        const newGameCreatedLogs = await getLogsInChunks(
          globalPublicClient,
          {
            address: FACTORY_ADDRESS,
            event: parseAbiItem('event GameCreated(address indexed gameAddress, address indexed professor)'),
          },
          fromBlock,
          latestBlock
        );

        const newGameAddresses = newGameCreatedLogs
          .map((log) => log.args.gameAddress)
          .filter((addr): addr is `0x${string}` => !!addr);

        const allGameAddresses = Array.from(new Set([...cachedGameAddresses, ...newGameAddresses])) as `0x${string}`[];

        if (allGameAddresses.length > 0) {
          // 2. Fetch NEW game events for ALL known games in the NEW block range
          const newGameEventsLogs = await getLogsInChunks(
            globalPublicClient,
            {
              address: allGameAddresses,
              events: [
                parseAbiItem('event PlayerJoined(address indexed player, uint256 feePaid)'),
                parseAbiItem('event DiplomaClaimed(address indexed student)'),
                parseAbiItem('event PrizeClaimed(address indexed recipient, uint256 amount)')
              ]
            },
            fromBlock,
            latestBlock
          );

          const getStats = (address: string) => {
            const key = address.toLowerCase();
            if (!playerStats.has(key)) {
              playerStats.set(key, { diplomas: 0, gamesPlayed: 0, totalPrize: 0n });
            }
            return playerStats.get(key)!;
          };

          newGameEventsLogs.forEach((log) => {
            if (log.eventName === 'PlayerJoined') {
              const player = (log.args as any).player;
              if (player) getStats(player).gamesPlayed += 1;
            } else if (log.eventName === 'DiplomaClaimed') {
              const student = (log.args as any).student;
              if (student) getStats(student).diplomas += 1;
            } else if (log.eventName === 'PrizeClaimed') {
              const recipient = (log.args as any).recipient;
              if (recipient) getStats(recipient).totalPrize += (log.args as any).amount || 0n;
            }
          });
        }

        // 3. Save new state to cache
        try {
          const cacheToSave: RankingCache = {
            lastSyncBlock: latestBlock.toString(),
            gameAddresses: allGameAddresses,
            playerStats: Array.from(playerStats.entries()).map(([addr, stats]) => [
              addr,
              {
                diplomas: stats.diplomas,
                gamesPlayed: stats.gamesPlayed,
                totalPrize: stats.totalPrize.toString(),
              },
            ]),
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheToSave));
        } catch (e) {
          console.warn('Failed to save ranking cache', e);
        }
      }

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
    enabled: !!globalPublicClient,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
