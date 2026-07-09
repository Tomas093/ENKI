import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWriteContract } from "wagmi";
import toast from "react-hot-toast";
import KahootGameABI from "../abi/KahootGame.json";
import { buildRevealBatch } from "../domain/commitReveal";

export function useRevealAnswers(gameAddress: string | null) {
  const [isRevealing, setIsRevealing] = useState(false);
  const router = useRouter();
  const { writeContractAsync } = useWriteContract();

  const executeBatchReveal = useCallback(async () => {
    if (!gameAddress) return false;
    
    setIsRevealing(true);
    const storageKey = `game_commits_${gameAddress}`;
    const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
    
    const batch = buildRevealBatch(commitsObj);
    
    if (batch.questionIds.length > 0) {
      try {
        const hash = await writeContractAsync({
          address: gameAddress as `0x${string}`,
          abi: KahootGameABI.abi,
          functionName: 'batchRevealAnswers',
          args: [batch.questionIds, batch.options, batch.salts],
          gas: 1500000n, // Bypass gas estimation to handle RPC sync lag
        });
        
        localStorage.removeItem(storageKey);
        router.push(`/leaderboard?game=${gameAddress}&tx=${hash}`);
        return true;
      } catch (e) {
        console.error("Batch reveal failed", e);
        toast.error("Failed to record answers. Please try again.", { id: "batchReveal" });
        setIsRevealing(false);
        return false;
      }
    } else {
      router.push(`/leaderboard?game=${gameAddress}`);
      return true;
    }
  }, [gameAddress, router, writeContractAsync]);

  return {
    isRevealing,
    setIsRevealing,
    executeBatchReveal
  };
}
