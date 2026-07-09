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
    if (!publicClient || !gameAddress) return;

    let lastCheckedBlock = 0n;

    const poll = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = lastCheckedBlock === 0n
          ? (currentBlock > 9000n ? currentBlock - 9000n : 0n)
          : lastCheckedBlock + 1n > currentBlock ? currentBlock : lastCheckedBlock + 1n;

        const questionLogs = await publicClient.getContractEvents({
          address: gameAddress as `0x${string}`,
          abi: KahootGameABI.abi,
          eventName: 'QuestionRevealed',
          fromBlock,
          toBlock: 'latest',
        });
        
        if (questionLogs.length > 0) {
          const log = questionLogs[0] as any;
          const args = log.args;
          const rawQuestion = args.enunciado;
          const parts = rawQuestion.split("||");
          const actualQuestion = parts[0];
          const timeLimit = parts.length > 1 ? Number(parts[1]) : 30;

          const questionData = {
            id: Number(args.questionId),
            question: actualQuestion,
            timeLimit: timeLimit,
            options: args.opciones,
          };
          localStorage.setItem("current_question", JSON.stringify(questionData));
          router.push(`/gameplay?game=${gameAddress}`);
          return;
        }

        const endLogs = await publicClient.getContractEvents({
          address: gameAddress as `0x${string}`,
          abi: KahootGameABI.abi,
          eventName: 'PrizesCalculated',
          fromBlock,
          toBlock: 'latest',
        });
        
        if (endLogs.length > 0) {
          router.push(`/leaderboard?game=${gameAddress}`);
          return;
        }

        lastCheckedBlock = currentBlock;
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(poll, 3500);
    poll();
    return () => clearInterval(interval);
  }, [publicClient, gameAddress, router]);

  return {
    totalPlayers,
    prizePoolStr
  };
}
