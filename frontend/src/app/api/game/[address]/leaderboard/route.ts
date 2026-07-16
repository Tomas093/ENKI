import { NextResponse } from 'next/server';
import { parseAbiItem } from 'viem';
import { publicClient, DEPLOYMENT_BLOCK } from '@/core/blockchain/viemClient';
import KahootGameABI from '@/core/blockchain/abi/KahootGame.json';
import ENKIProfilesABI from '@/core/blockchain/abi/ENKIProfiles.json';


const CHUNK_SIZE = 9000n;

const PROFILES_ADDRESS = process.env.NEXT_PUBLIC_PROFILES_ADDRESS as `0x${string}`;



export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const resolvedParams = await params;
  const gameAddress = resolvedParams.address as `0x${string}`;

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

    // 2. Fetch stats for each player using multicall to prevent Vercel 10s timeouts
    const scores = await publicClient.multicall({
      contracts: wallets.map(w => ({ address: gameAddress, abi: KahootGameABI.abi as any, functionName: 'scores', args: [w] }))
    });
    
    const claims = await publicClient.multicall({
      contracts: wallets.map(w => ({ address: gameAddress, abi: KahootGameABI.abi as any, functionName: 'hasPrizeClaimed', args: [w] }))
    });
    
    const diplomaClaims = await publicClient.multicall({
      contracts: wallets.map(w => ({ address: gameAddress, abi: KahootGameABI.abi as any, functionName: 'hasClaimed', args: [w] }))
    });
    
    const nicknames = await publicClient.multicall({
      contracts: wallets.map(w => ({ address: PROFILES_ADDRESS, abi: ENKIProfilesABI.abi as any, functionName: 'nicknames', args: [w] }))
    });

    // 3. Fetch prizes
    const prizesMulticall = await publicClient.multicall({
      contracts: [0, 1, 2].map(rank => ({ address: gameAddress, abi: KahootGameABI.abi as any, functionName: 'prizePerPlayerAtRank', args: [rank] }))
    });
    const p0 = prizesMulticall[0].status === 'success' ? prizesMulticall[0].result : 0n;
    const p1 = prizesMulticall[1].status === 'success' ? prizesMulticall[1].result : 0n;
    const p2 = prizesMulticall[2].status === 'success' ? prizesMulticall[2].result : 0n;

    const players = wallets.map((w, i) => ({
      wallet: w,
      nickname: (nicknames[i].status === 'success' && nicknames[i].result) ? String(nicknames[i].result) : undefined,
      score: scores[i].status === 'success' ? Number(scores[i].result) : 0,
      claimed: claims[i].status === 'success' ? Boolean(claims[i].result) : false,
      diplomaClaimed: diplomaClaims[i].status === 'success' ? Boolean(diplomaClaims[i].result) : false
    })).sort((a, b) => b.score - a.score);

    return NextResponse.json({
      players,
      prizes: [(p0 as bigint).toString(), (p1 as bigint).toString(), (p2 as bigint).toString()],
      syncedToBlock: latestBlock.toString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[/api/game/${gameAddress}/leaderboard] Error:`, error);
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard data',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
