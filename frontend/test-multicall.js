const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');
const KahootGameABI = require('./src/core/blockchain/abi/KahootGame.json');
const client = createPublicClient({ chain: sepolia, transport: http('https://eth-sepolia.g.alchemy.com/v2/0ZWWGgZx4gu7pBzt8iLIt') });

async function run() {
  const address = '0x98414E8CB99bC4439DB8174489cE5B196Be4cC58';
  const wallets = ['0x0000000000000000000000000000000000000000'];
  
  const results = await client.multicall({
    contracts: wallets.map(w => ({
      address,
      abi: KahootGameABI.abi,
      functionName: 'scores',
      args: [w]
    }))
  });
  console.log(results);
}
run().catch(console.error);
