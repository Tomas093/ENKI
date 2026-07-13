export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { parseAbiItem } from 'viem';
import { publicClient, DEPLOYMENT_BLOCK } from '@/core/blockchain/viemClient';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;




export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const resolvedParams = await params;
  const professorAddress = resolvedParams.address.toLowerCase();

  try {
    const latestBlock = await publicClient.getBlockNumber();
    
    // Fetch all games created. 
    // We fetch ALL because the index of the event maps 1:1 to the Game ID (the array index in the contract).
    // In a real production environment with 10k+ games, this would be indexed by The Graph.
    const allLogs = await publicClient.getLogs({
      address: FACTORY_ADDRESS,
      event: parseAbiItem('event GameCreated(uint256 indexed gameId, address indexed gameAddress, address indexed professor)'),
      fromBlock: DEPLOYMENT_BLOCK,
      toBlock: latestBlock
    });

    // Map logs to Game IDs, then filter by professor
    const professorGames = allLogs
      .map((log) => ({
        id: Number(log.args.gameId),
        address: log.args.gameAddress,
        professor: log.args.professor?.toLowerCase(),
      }))
      .filter((game) => game.professor === professorAddress);

    return NextResponse.json(
      { games: professorGames },
      {
        status: 200,
        headers: {
          // Cache aggressively, invalidate every 5 minutes (professors don't create games every second)
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error(`[/api/professor/${professorAddress}/games] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch professor games' }, { status: 500 });
  }
}
