import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import { keccak256, encodePacked } from "viem";
import toast from "react-hot-toast";
import KahootGameABI from "../abi/KahootGame.json";
import { useDisplayName } from "./useDisplayName";
import { computeCommitHash } from "../domain/commitReveal";
import { useRevealAnswers } from "./useRevealAnswers";

export function useStudentGameplay() {
  const [selected, setSelected] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(30);
  
  const [correctAnswerIdx, setCorrectAnswerIdx] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game") as `0x${string}`;
  
  const { isRevealing, executeBatchReveal } = useRevealAnswers(gameAddress);
  const { address } = useAccount();
  const { displayName } = useDisplayName(address);
  const publicClient = usePublicClient();

  const { writeContractAsync, isPending } = useWriteContract();

  useEffect(() => {
    if (!gameAddress) return;

    // Safety cleanup if we switched game sessions
    const lastGame = localStorage.getItem("last_game_address");
    if (lastGame && lastGame !== gameAddress) {
      localStorage.removeItem(`game_commits_${lastGame}`);
      localStorage.removeItem("current_question");
    }
    localStorage.setItem("last_game_address", gameAddress);

    const qData = localStorage.getItem("current_question");
    if (qData) {
      const parsed = JSON.parse(qData);
      setQuestionData(parsed);
      setTimeLeft(parsed.timeLimit || 30);
      setTotalTime(parsed.timeLimit || 30);

      // Restore selected index from Key-Value store
      const storageKey = `game_commits_${gameAddress}`;
      const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const commitInfo = commitsObj[parsed.id];
      if (commitInfo && commitInfo.option !== undefined) {
        setSelected(Number(commitInfo.option));
      }
    }
  }, [gameAddress]);

  useEffect(() => {
    if (selected !== null || timeLeft <= 0 || !questionData) return;
    const t = setInterval(() => setTimeLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [selected, timeLeft, questionData]);

  useEffect(() => {
    if (timeLeft <= 0 && selected === null && gameAddress && questionData) {
      setSelected(-1);
      const storageKey = `game_commits_${gameAddress}`;
      const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
      commitsObj[questionData.id] = { option: -1, salt: "" };
      localStorage.setItem(storageKey, JSON.stringify(commitsObj));
    }
  }, [timeLeft, selected, gameAddress, questionData]);

  const handlePick = async (idx: number) => {
    if (selected !== null || !gameAddress || !address || !questionData) return;
    setSelected(idx);

    const studentSalt = "studentSalt_" + window.crypto.randomUUID().replace(/-/g, "");
    
    // Store in Key-Value store immediately before contract call
    const storageKey = `game_commits_${gameAddress}`;
    const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
    commitsObj[questionData.id] = { option: idx, salt: studentSalt };
    localStorage.setItem(storageKey, JSON.stringify(commitsObj));

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
      // Revert local state and storage on failure
      setSelected(null);
      const storageKey = `game_commits_${gameAddress}`;
      const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
      delete commitsObj[questionData.id];
      localStorage.setItem(storageKey, JSON.stringify(commitsObj));
    }
  };

  useEffect(() => {
    if (!publicClient || !gameAddress) return;

    let isRevealingRef = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/game/${gameAddress}/sync`);
        if (!res.ok) return;
        const data = await res.json();

        // 1. Check Reveal Phase for current question
        if (correctAnswerIdx === null && data.isRevealPhaseActive) {
          const qDataStr = localStorage.getItem("current_question");
          const currentQId = qDataStr ? JSON.parse(qDataStr).id : null;
          
          if (currentQId !== null && data.latestQuestion?.id === currentQId) {
            const qId = currentQId;
            const storageKey = `game_commits_${gameAddress}`;
            const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
            const commitInfo = commitsObj[qId];
            const myIdx = commitInfo && commitInfo.option !== undefined ? commitInfo.option : null;

            try {
              const correctAns = await publicClient.readContract({
                address: gameAddress as `0x${string}`,
                abi: KahootGameABI.abi,
                functionName: 'revealedAnswers',
                args: [BigInt(qId)],
              });
              
              setCorrectAnswerIdx(Number(correctAns));
              setIsCorrect(myIdx !== null && myIdx !== -1 && Number(correctAns) === Number(myIdx));
            } catch (e) {
              console.error("Failed to read correct answer", e);
              setIsCorrect(false);
            }
          }
        }

        // 2. Are we ready for the next question?
        if (correctAnswerIdx !== null && data.latestQuestion) {
          const qDataStr = localStorage.getItem("current_question");
          const currentQuestionId = qDataStr ? JSON.parse(qDataStr).id : -1;

          if (data.latestQuestion.id > currentQuestionId) {
            localStorage.setItem("current_question", JSON.stringify(data.latestQuestion));
            setQuestionData(data.latestQuestion);
            setTimeLeft(data.latestQuestion.timeLimit);
            setTotalTime(data.latestQuestion.timeLimit);
            setSelected(null);
            setCorrectAnswerIdx(null);
            setIsCorrect(false);
            return;
          }

          // 3. Game finished?
          if (!isRevealingRef && data.isGameOver) {
            const finished = await publicClient.readContract({
              address: gameAddress as `0x${string}`,
              abi: KahootGameABI.abi,
              functionName: 'isFinished'
            });

            if (finished) {
              isRevealingRef = true;
              const success = await executeBatchReveal();
              if (!success) {
                isRevealingRef = false; // Allow retrying
              }
              return;
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(poll, 3500);
    poll();
    return () => clearInterval(interval);
  }, [publicClient, gameAddress, correctAnswerIdx, executeBatchReveal]);

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
