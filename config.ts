import { http, createConfig } from 'wagmi'
import { hardhat, sepolia, polygonAmoy } from 'wagmi/chains'

export const config = createConfig({
  chains: [hardhat, sepolia, polygonAmoy],
  transports: {
    [hardhat.id]: http(),
    [sepolia.id]: http(),
    [polygonAmoy.id]: http(),
  },
})