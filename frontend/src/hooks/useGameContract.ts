import { useReadContract, useReadContracts, useWatchContractEvent } from "wagmi";
import KahootGameABI from "../abi/KahootGame.json";

export function useGameState(gameAddress: `0x${string}` | undefined) {
  const result = useReadContracts({
    contracts: gameAddress ? [
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "currentQuestionId" },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "isFinished" },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "isCancelled" },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "totalQuestions" },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "passingScore" },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "entryFee" },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "prizePool" },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "professor" },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "prizesCalculated" }
    ] : [],
    query: { enabled: !!gameAddress, refetchInterval: 3000 }
  });

  return {
    currentQuestionId: result.data?.[0]?.result as bigint | undefined,
    isFinished: result.data?.[1]?.result as boolean | undefined,
    isCancelled: result.data?.[2]?.result as boolean | undefined,
    totalQuestions: result.data?.[3]?.result as bigint | undefined,
    passingScore: result.data?.[4]?.result as bigint | undefined,
    entryFee: result.data?.[5]?.result as bigint | undefined,
    prizePool: result.data?.[6]?.result as bigint | undefined,
    professor: result.data?.[7]?.result as `0x${string}` | undefined,
    prizesCalculated: result.data?.[8]?.result as boolean | undefined,
    refetch: result.refetch,
    isLoading: result.isLoading
  };
}

export function usePlayerState(gameAddress: `0x${string}` | undefined, playerAddress: `0x${string}` | undefined) {
  const result = useReadContracts({
    contracts: (gameAddress && playerAddress) ? [
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "hasJoined", args: [playerAddress] },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "scores", args: [playerAddress] },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "hasClaimed", args: [playerAddress] },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "hasPrizeClaimed", args: [playerAddress] }
    ] : [],
    query: { enabled: !!(gameAddress && playerAddress), refetchInterval: 3000 }
  });

  return {
    hasJoined: result.data?.[0]?.result as boolean | undefined,
    score: result.data?.[1]?.result as bigint | undefined,
    hasClaimedDiploma: result.data?.[2]?.result as boolean | undefined,
    hasClaimedPrize: result.data?.[3]?.result as boolean | undefined,
    refetch: result.refetch,
  };
}

export function useRoundState(gameAddress: `0x${string}` | undefined, questionId: bigint | undefined) {
  const result = useReadContracts({
    contracts: (gameAddress && questionId !== undefined) ? [
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "listaDeRondas", args: [questionId] },
      { address: gameAddress, abi: KahootGameABI.abi, functionName: "revealedAnswers", args: [questionId] }
    ] : [],
    query: { enabled: !!(gameAddress && questionId !== undefined), refetchInterval: 3000 }
  });

  const roundData = result.data?.[0]?.result as { commitPhaseOpen: boolean; revealPhaseOpen: boolean } | undefined;
  
  return {
    commitPhaseOpen: roundData?.commitPhaseOpen,
    revealPhaseOpen: roundData?.revealPhaseOpen,
    correctAnswer: result.data?.[1]?.result as number | undefined,
    refetch: result.refetch
  };
}

export function useWatchGameEvents(gameAddress: `0x${string}` | undefined, onQuestionRevealed: (args: any) => void, onRevealPhase: (args: any) => void) {
  useWatchContractEvent({
    address: gameAddress,
    abi: KahootGameABI.abi,
    eventName: "QuestionRevealed",
    onLogs: (logs) => { if ((logs as any[])[0]?.args) onQuestionRevealed((logs as any[])[0].args); },
    enabled: !!gameAddress
  });

  useWatchContractEvent({
    address: gameAddress,
    abi: KahootGameABI.abi,
    eventName: "RevealPhaseStarted",
    onLogs: (logs) => { if ((logs as any[])[0]?.args) onRevealPhase((logs as any[])[0].args); },
    enabled: !!gameAddress
  });
}
