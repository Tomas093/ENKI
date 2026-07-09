import { useAccount, useReadContract } from "wagmi";
import KahootFactoryABI from "../abi/KahootFactory.json";

export function useGlobalRankingPreview() {
  const { address, isConnected } = useAccount();

  const { data: diplomasWon } = useReadContract({
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: KahootFactoryABI.abi,
    functionName: "totalDiplomasWon",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    diplomasWon: Number(diplomasWon || 0),
    isConnected,
  };
}
