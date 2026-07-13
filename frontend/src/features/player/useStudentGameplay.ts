import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import toast from "react-hot-toast";
import KahootGameABI from '@/core/blockchain/abi/KahootGame.json';
import { useDisplayName } from '@/features/system/useDisplayName';
import { computeCommitHash } from '@/core/domain/commitReveal';
import { useRevealAnswers } from '@/features/host/useRevealAnswers';
import { useGameTimer } from '@/features/player/useGameTimer';
import { useGameStorage } from '@/features/player/useGameStorage';
import { useGameSync } from '@/features/game/useGameSync';

export function useStudentGameplay() {
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game") as `0x${string}`;
  
  const { isRevealing, executeBatchReveal } = useRevealAnswers(gameAddress);
  const { address } = useAccount();
  const { displayName } = useDisplayName(address);
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const [correctAnswerIdx, setCorrectAnswerIdx] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  const {
    questionData,
    selected,
    initStorage,
    saveCommit,
    removeCommit,
    getCommit,
    syncNewQuestion
  } = useGameStorage(gameAddress);

  const handleTimeout = () => {
    if (gameAddress && questionData && selected === null) {
      saveCommit(questionData.id, -1, "");
    }
  };

  const { timeLeft, setTimeLeft, totalTime, setTotalTime } = useGameTimer(questionData, selected, handleTimeout);

  useEffect(() => {
    const { initialTime, totalTime: tTotal } = initStorage();
    if (initialTime !== undefined && tTotal !== undefined) {
      setTimeLeft(initialTime);
      setTotalTime(tTotal);
    }
  }, [initStorage, setTimeLeft, setTotalTime]);

  useGameSync(
    gameAddress,
    publicClient,
    correctAnswerIdx,
    setCorrectAnswerIdx,
    setIsCorrect,
    executeBatchReveal,
    syncNewQuestion,
    getCommit,
    setTimeLeft,
    setTotalTime
  );

  const handlePick = async (idx: number) => {
    if (selected !== null || !gameAddress || !address || !questionData) return;
    
    const studentSalt = "studentSalt_" + window.crypto.randomUUID().replace(/-/g, "");
    saveCommit(questionData.id, idx, studentSalt);

    try {
      const commitHash = computeCommitHash(idx, studentSalt, address as `0x${string}`);

      await writeContractAsync({
        address: gameAddress,
        abi: KahootGameABI.abi,
        functionName: 'commitAnswer',
        args: [commitHash],
      });
    } catch (e) {
      console.error(e);
      toast.error("Transaction failed. Are you connected?");
      removeCommit(questionData.id);
    }
  };

  return {
    selected,
    questionData,
    timeLeft,
    totalTime,
    correctAnswerIdx,
    isRevealing,
    isCorrect,
    displayName,
    isPending,
    handlePick
  };
}
