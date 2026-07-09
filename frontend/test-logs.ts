import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import dotenv from 'dotenv';
dotenv.config();

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.drpc.org'),
});

async function main() {
  const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;
  console.log("Factory:", FACTORY_ADDRESS);
  const logs = await publicClient.getLogs({
    address: FACTORY_ADDRESS,
    event: parseAbiItem('event GameCreated(uint256 indexed gameId, address indexed gameAddress, address indexed professor)'),
    fromBlock: 11236783n,
    toBlock: 'latest'
  });
  console.log("Logs found:", logs.length);
  
  const oldLogs = await publicClient.getLogs({
    address: FACTORY_ADDRESS,
    event: parseAbiItem('event GameCreated(address indexed gameAddress, address indexed professor)'),
    fromBlock: 11236783n,
    toBlock: 'latest'
  });
  console.log("Old Logs found:", oldLogs.length);
}

main().catch(console.error);
