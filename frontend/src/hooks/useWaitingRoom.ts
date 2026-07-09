import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePublicClient } from "wagmi";
import KahootGameABI from "../abi/KahootGame.json";
import { useRevealAnswers } from "./useRevealAnswers";

export function useWaitingRoom() {
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const [options, setOptions] = useState<string[]>([]);
  const [questionText, setQuestionText] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [myAnswerIdx, setMyAnswerIdx] = useState<number | null>(null);
  const [correctAnswerIdx, setCorrectAnswerIdx] = useState<number | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game") as string | null;

  const { isRevealing, executeBatchReveal } = useRevealAnswers(gameAddress);
  const publicClient = usePublicClient();

  useEffect(() => {
    const bannerTimer = setTimeout(() => setShowBanner(true), 15000);
    const qDataStr = localStorage.getItem("current_question");
    if (qDataStr) {
       const qData = JSON.parse(qDataStr);
       setOptions(qData.options || []);
       setQuestionText(qData.question || "");
       setQuestionNumber((qData.id !== undefined ? Number(qData.id) : 0) + 1);
    }
    if (qDataStr && gameAddress) {
      const qData = JSON.parse(qDataStr);
      const storageKey = `game_commits_${gameAddress}`;
      const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const myCommit = commitsObj[qData.id];
      if (myCommit && myCommit.option !== undefined) {
        setMyAnswerIdx(Number(myCommit.option));
      }
    }
    return () => clearTimeout(bannerTimer);
  }, []);

  useEffect(() => {
    if (!publicClient || !gameAddress) return;

    let isRevealingRef = false;
    let isRevealedRef = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/game/${gameAddress}/sync`);
        if (!res.ok) return;
        const data = await res.json();

        // 1. Is Reveal Phase Active for our current question?
        if (!isRevealingRef && !isRevealedRef && data.isRevealPhaseActive) {
          isRevealingRef = true;
          const qDataStr = localStorage.getItem("current_question");
          const currentQId = qDataStr ? JSON.parse(qDataStr).id : null;
          
          if (currentQId !== null && data.latestQuestion?.id === currentQId) {
            const qId = currentQId;
            const storageKey = `game_commits_${gameAddress}`;
            const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
            const myCommit = commitsObj[qId];
            const myIdx = myCommit && myCommit.option !== undefined ? myCommit.option : null;

            try {
              const correctAns = await publicClient.readContract({
                address: gameAddress as `0x${string}`,
                abi: KahootGameABI.abi,
                functionName: 'revealedAnswers',
                args: [BigInt(qId)],
              });
              
              setCorrectAnswerIdx(Number(correctAns));
              setIsCorrect(myIdx !== null && Number(correctAns) === Number(myIdx));
            } catch (e) {
              console.error("Failed to read correct answer", e);
              setIsCorrect(false);
            }

            isRevealedRef = true;
            setRevealed(true);
          }
        }

        // 2. Are we ready for the next question?
        if (isRevealedRef && data.latestQuestion) {
          const qDataStr = localStorage.getItem("current_question");
          const currentQuestionId = qDataStr ? JSON.parse(qDataStr).id : -1;
          
          if (data.latestQuestion.id > currentQuestionId) {
            localStorage.setItem("current_question", JSON.stringify(data.latestQuestion));
            router.push(`/gameplay?game=${gameAddress}`);
            return;
          }
        }

        // 3. Is the game completely finished?
        if (data.isGameOver || data.latestQuestion === null /* handle fallback if needed */) {
          const finished = await publicClient.readContract({
            address: gameAddress as `0x${string}`,
            abi: KahootGameABI.abi,
            functionName: 'isFinished'
          });

          if (finished) {
            const success = await executeBatchReveal();
            if (!success) {
              // Retry handled by hook
            }
            return;
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(poll, 3500);
    poll();
    return () => clearInterval(interval);
  }, [publicClient, gameAddress, router, executeBatchReveal]);

  return {
    revealed,
    isCorrect,
    showBanner,
    setShowBanner,
    isRevealing,
    options,
    questionText,
    questionNumber,
    myAnswerIdx,
    correctAnswerIdx,
    gameAddress,
    router
  };
}
