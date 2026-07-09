import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import KahootFactoryABI from '../abi/KahootFactory.json';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.drpc.org'),
});

export class FactoryRepository {
  /**
   * Resolves a numeric Game ID (array index) to the actual deployed KahootGame address.
   */
  static async resolveGameAddress(shortId: number): Promise<string> {
    try {
      const address = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: KahootFactoryABI.abi as any,
        functionName: 'games',
        args: [BigInt(shortId)],
      });
      return address as string;
    } catch (error) {
      console.error(`Failed to resolve Game ID ${shortId}:`, error);
      throw new Error(`Game ID ${shortId} not found`);
    }
  }
}
