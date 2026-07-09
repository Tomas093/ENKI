import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';

const DEPLOYMENT_BLOCK = 11236783n;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.drpc.org'),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const resolvedParams = await params;
  const gameAddress = resolvedParams.address as `0x${string}`;

  try {
    const latestBlock = await publicClient.getBlockNumber();

    // Fetch all events at once. 
    // This allows us to reconstruct the exact state of the game without calling multiple readContracts.
    const [qRevealedLogs, rPhaseLogs, endLogs, isFinished] = await Promise.all([
      publicClient.getLogs({
        address: gameAddress,
        event: parseAbiItem('event QuestionRevealed(uint256 indexed questionId, string enunciado, string[4] opciones)'),
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: latestBlock
      }),
      publicClient.getLogs({
        address: gameAddress,
        event: parseAbiItem('event RevealPhaseStarted(uint256 indexed questionId)'),
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: latestBlock
      }),
      publicClient.getLogs({
        address: gameAddress,
        event: parseAbiItem('event PrizesCalculated()'),
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: latestBlock
      }),
      publicClient.readContract({
        address: gameAddress,
        abi: parseAbi(['function isFinished() view returns (bool)']),
        functionName: 'isFinished'
      }).catch(() => false)
    ]);

    // 1. Is Game Over?
    const isGameOver = endLogs.length > 0;

    // 2. What is the latest question revealed?
    let latestQuestion = null;
    let latestQuestionId = -1;
    
    if (qRevealedLogs.length > 0) {
      // Get the last log (highest block/index)
      const lastQLog = qRevealedLogs[qRevealedLogs.length - 1];
      latestQuestionId = Number(lastQLog.args.questionId);
      
      const rawQuestion = lastQLog.args.enunciado || "";
      const parts = rawQuestion.split("||");
      const actualQuestion = parts[0];
      const timeLimit = parts.length > 1 ? Number(parts[1]) : 30;

      latestQuestion = {
        id: latestQuestionId,
        question: actualQuestion,
        timeLimit: timeLimit,
        options: lastQLog.args.opciones ? Array.from(lastQLog.args.opciones) : [],
      };
    }

    // 3. Has the reveal phase started for this latest question?
    let isRevealPhaseActive = false;
    if (latestQuestionId !== -1) {
      isRevealPhaseActive = rPhaseLogs.some(l => Number(l.args.questionId) === latestQuestionId);
    }

    return NextResponse.json(
      {
        syncedToBlock: latestBlock.toString(),
        isGameOver,
        isFinished,
        latestQuestion,
        isRevealPhaseActive,
      },
      {
        status: 200,
        headers: {
          // Extremely aggressive short-term cache to prevent Polling Storm (Riesgo B)
          // NGINX/Vercel will serve this from memory for 3 seconds. 
          // If 200 students poll every 1s, only 1 request per 3s hits the blockchain.
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=59',
        },
      }
    );
  } catch (error) {
    console.error(`[/api/game/${gameAddress}/sync] Error:`, error);
    return NextResponse.json({ error: 'Failed to sync game state' }, { status: 500 });
  }
}
