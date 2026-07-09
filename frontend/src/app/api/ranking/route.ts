import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem';
import { sepolia } from 'viem/chains';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;
const DEPLOYMENT_BLOCK = 11236783n;
const CHUNK_SIZE = 100000n; // drpc supports large block ranges — no restrictions

// Public Sepolia RPC — no API key, no block-range limits
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.drpc.org'),
});

// In-memory cache to avoid re-scanning on every request
interface PlayerStats {
  diplomas: number;
  gamesPlayed: number;
  totalPrize: bigint;
}

let cachedGameAddresses: string[] = [];
let cachedPlayerStats = new Map<string, PlayerStats>();
let cachedLastBlock = DEPLOYMENT_BLOCK - 1n;
let cacheTimestamp = 0;

const CACHE_TTL_MS = 30_000; // 30 seconds

async function getLogsInChunks(params: any, fromBlock: bigint, toBlock: bigint) {
  let allLogs: any[] = [];
  for (let start = fromBlock; start <= toBlock; start += CHUNK_SIZE) {
    const end = start + CHUNK_SIZE - 1n > toBlock ? toBlock : start + CHUNK_SIZE - 1n;
    const logs = await publicClient.getLogs({ ...params, fromBlock: start, toBlock: end });
    allLogs = allLogs.concat(logs);
  }
  return allLogs;
}

export async function GET() {
  try {
    const now = Date.now();
    const latestBlock = await publicClient.getBlockNumber();

    // Serve from cache if it's fresh enough
    if (now - cacheTimestamp < CACHE_TTL_MS && cachedLastBlock >= latestBlock) {
      return buildResponse(latestBlock);
    }

    const fromBlock = cachedLastBlock + 1n;

    if (fromBlock <= latestBlock) {
      // 1. Find new games created by the factory
      const newGameLogs = await getLogsInChunks(
        {
          address: FACTORY_ADDRESS,
          event: parseAbiItem('event GameCreated(uint256 indexed gameId, address indexed gameAddress, address indexed professor)'),
        },
        fromBlock,
        latestBlock
      );

      const newGameAddresses = newGameLogs
        .map((log: any) => log.args.gameAddress as string)
        .filter(Boolean);

      const allGameAddresses = Array.from(
        new Set([...cachedGameAddresses, ...newGameAddresses])
      ) as `0x${string}`[];

      cachedGameAddresses = allGameAddresses;

      // 2. Fetch player events from all known game contracts
      if (allGameAddresses.length > 0) {
        const eventLogs = await getLogsInChunks(
          {
            address: allGameAddresses,
            events: [
              parseAbiItem('event PlayerJoined(address indexed player, uint256 feePaid)'),
              parseAbiItem('event DiplomaClaimed(address indexed student)'),
              parseAbiItem('event PrizeClaimed(address indexed recipient, uint256 amount)'),
            ],
          },
          fromBlock,
          latestBlock
        );

        const getStats = (address: string): PlayerStats => {
          const key = address.toLowerCase();
          if (!cachedPlayerStats.has(key)) {
            cachedPlayerStats.set(key, { diplomas: 0, gamesPlayed: 0, totalPrize: 0n });
          }
          return cachedPlayerStats.get(key)!;
        };

        for (const log of eventLogs) {
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
        }
      }

      cachedLastBlock = latestBlock;
      cacheTimestamp = now;
    }

    return buildResponse(latestBlock);
  } catch (error) {
    console.error('[/api/ranking] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch ranking data' }, { status: 500 });
  }
}

function buildResponse(latestBlock: bigint) {
  const players = Array.from(cachedPlayerStats.entries()).map(([address, stats], idx) => ({
    rank: 0,
    address,
    ens: `${address.slice(0, 6)}...${address.slice(-4)}`,
    diplomas: stats.diplomas,
    gamesPlayed: stats.gamesPlayed,
    totalPrize: Number(formatEther(stats.totalPrize)),
  }));

  players.sort((a, b) => {
    if (b.diplomas !== a.diplomas) return b.diplomas - a.diplomas;
    if (b.totalPrize !== a.totalPrize) return b.totalPrize - a.totalPrize;
    return b.gamesPlayed - a.gamesPlayed;
  });

  players.forEach((p, idx) => { p.rank = idx + 1; });

  return NextResponse.json({
    players,
    syncedToBlock: latestBlock.toString(),
    gameCount: cachedGameAddresses.length,
  });
}
