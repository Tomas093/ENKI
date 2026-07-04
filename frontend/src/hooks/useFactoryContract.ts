import { useReadContract, useReadContracts } from "wagmi";
import KahootFactoryABI from "../abi/KahootFactory.json";

export function useFactoryState(factoryAddress: `0x${string}` | undefined) {
  const result = useReadContracts({
    contracts: factoryAddress ? [
      { address: factoryAddress, abi: KahootFactoryABI.abi, functionName: "getGamesCount" },
      { address: factoryAddress, abi: KahootFactoryABI.abi, functionName: "creationFee" }
    ] : [],
    query: { enabled: !!factoryAddress }
  });

  return {
    gamesCount: result.data?.[0]?.result as bigint | undefined,
    creationFee: result.data?.[1]?.result as bigint | undefined,
    isLoading: result.isLoading,
    refetch: result.refetch
  };
}

export function usePlayerDiplomas(factoryAddress: `0x${string}` | undefined, playerAddress: `0x${string}` | undefined) {
  const { data: totalDiplomas, refetch, isLoading } = useReadContract({
    address: factoryAddress,
    abi: KahootFactoryABI.abi,
    functionName: "totalDiplomasWon",
    args: playerAddress ? [playerAddress] : undefined,
    query: { enabled: !!(factoryAddress && playerAddress), refetchInterval: 5000 }
  });

  return { totalDiplomas: totalDiplomas as bigint | undefined, refetch, isLoading };
}
