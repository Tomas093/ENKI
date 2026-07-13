import { NextResponse } from 'next/server';
import { parseAbiItem } from 'viem';
import { publicClient, DEPLOYMENT_BLOCK } from '@/core/blockchain/viemClient';
import KahootGameABI from '@/core/blockchain/abi/KahootGame.json';
import ENKIProfilesABI from '@/core/blockchain/abi/ENKIProfiles.json';


const CHUNK_SIZE = 100000n;

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
    const nicknames = await Promise.all(
      wallets.map(w => 
        publicClient.readContract({ 
          address: PROFILES_ADDRESS, 
          abi: ENKIProfilesABI.abi, 
          functionName: 'nicknames', 
          args: [w] 
        }).catch(() => "")
      )
    );

    // 3. Fetch prizes
    const p0 = await publicClient.readContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [0] }).catch(() => 0n);
    const p1 = await publicClient.readContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [1] }).catch(() => 0n);
    const p2 = await publicClient.readContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [2] }).catch(() => 0n);

    const players = wallets.map((w, i) => ({
      wallet: w,
      nickname: nicknames[i] || undefined,
      score: Number(scores[i]),
      claimed: Boolean(claims[i]),
      diplomaClaimed: Boolean(diplomaClaims[i])
    })).sort((a, b) => b.score - a.score);

    return NextResponse.json({
      players,
      prizes: [(p0 as bigint).toString(), (p1 as bigint).toString(), (p2 as bigint).toString()],
      syncedToBlock: latestBlock.toString(),
    });
  } catch (error) {
    console.error(`[/api/game/${gameAddress}/leaderboard] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
