export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { publicClient } from '@/core/blockchain/viemClient';
import KahootFactoryABI from '@/core/blockchain/abi/KahootFactory.json';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;



export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const shortId = parseInt(resolvedParams.id, 10);
  
  if (isNaN(shortId) || shortId < 0) {
    return NextResponse.json({ error: 'Invalid Game ID' }, { status: 400 });
  }

  try {
    const address = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: KahootFactoryABI.abi as any,
      functionName: 'getGameAddress',
      args: [BigInt(shortId)],
    });
    
    // Cache heavily because shortId -> address mapping is immutable.
    // Edge cache for 1 year, stale-while-revalidate for safety.
    return NextResponse.json(
      { gameAddress: address },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error(`Failed to resolve Game ID ${shortId}:`, error);
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
}
