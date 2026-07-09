import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import KahootGameABI from '../../../../../abi/KahootGame.json';

const DEPLOYMENT_BLOCK = 11236783n;
const CHUNK_SIZE = 100000n;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.drpc.org'),
});

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const gameAddress = params.address as `0x${string}`;

  try {
    const latestBlock = await publicClient.getBlockNumber();

    // 1. Fetch all players who joined this game
    let allLogs: any[] = [];
    for (let start = DEPLOYMENT_BLOCK; start <= latestBlock; start += CHUNK_SIZE) {
      const end = start + CHUNK_SIZE - 1n > latestBlock ? latestBlock : start + CHUNK_SIZE - 1n;
      const logs = await publicClient.getLogs({
        address: gameAddress,
        event: parseAbiItem('event PlayerJoined(address indexed player, uint256 feePaid)'),
        fromBlock: start,
        toBlock: end
      });
      allLogs = allLogs.concat(logs);
    }

    const wallets = Array.from(new Set(allLogs.map(l => l.args?.player as `0x${string}`)));

    // 2. Fetch stats for each player using the contract
    const scores = await Promise.all(
      wallets.map(w => publicClient.readContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'scores', args: [w] }))
    );
    const claims = await Promise.all(
      wallets.map(w => publicClient.readContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'hasPrizeClaimed', args: [w] }))
    );
    const diplomaClaims = await Promise.all(
      wallets.map(w => publicClient.readContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'hasClaimed', args: [w] }))
    );

    // 3. Fetch prizes
    const p0 = await publicClient.readContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [0] }).catch(() => 0n);
    const p1 = await publicClient.readContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [1] }).catch(() => 0n);
    const p2 = await publicClient.readContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [2] }).catch(() => 0n);

    const players = wallets.map((w, i) => ({
      wallet: w,
      score: Number(scores[i]),
      claimed: Boolean(claims[i]),
      diplomaClaimed: Boolean(diplomaClaims[i])
    })).sort((a, b) => b.score - a.score);

    return NextResponse.json({
      players,
      prizes: [p0.toString(), p1.toString(), p2.toString()],
      syncedToBlock: latestBlock.toString(),
    });
  } catch (error) {
    console.error(`[/api/game/${gameAddress}/leaderboard] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
