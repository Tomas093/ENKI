import { useAccount, useReadContract } from "wagmi";
import KahootFactoryABI from "../abi/KahootFactory.json";

export function useHostDashboard() {
  const { address } = useAccount();

  const { data: kahoots } = useReadContract({
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: KahootFactoryABI.abi,
    functionName: "getKahootsDeProfesor",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const gameAddresses = (kahoots as `0x${string}`[]) || [];

  return {
    gameAddresses,
    hasGames: gameAddresses.length > 0,
  };
}
