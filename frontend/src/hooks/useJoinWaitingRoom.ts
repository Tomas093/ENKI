import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useReadContracts, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import KahootGameABI from "../abi/KahootGame.json";

export function useJoinWaitingRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game");
  const publicClient = usePublicClient();

  const { data: stats } = useReadContracts({
    contracts: gameAddress ? [
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'entryFee' },
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizePool' },
    ] : [],
    query: { refetchInterval: 2000 }
  });

  const entryFeeVal = stats?.[0]?.result as bigint;
  const prizePoolVal = stats?.[1]?.result as bigint;
  
  const totalPlayers = (prizePoolVal !== undefined && entryFeeVal !== undefined && entryFeeVal > 0n) 
    ? (prizePoolVal / entryFeeVal).toString() 
    : "0";
  const prizePoolStr = prizePoolVal !== undefined ? formatEther(prizePoolVal) : "0.0";

  useEffect(() => {
    if (!gameAddress) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/game/${gameAddress}/sync`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.latestQuestion) {
          localStorage.setItem("current_question", JSON.stringify(data.latestQuestion));
          router.push(`/gameplay?game=${gameAddress}`);
          return;
        }

        if (data.isGameOver) {
          router.push(`/leaderboard?game=${gameAddress}`);
          return;
        }

      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(poll, 3500);
    poll();
    return () => clearInterval(interval);
  }, [gameAddress, router]);

  return {
    totalPlayers,
    prizePoolStr
  };
}
