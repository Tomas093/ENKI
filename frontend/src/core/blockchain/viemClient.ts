import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

export const DEPLOYMENT_BLOCK = 11236783n;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.drpc.org'),
});
