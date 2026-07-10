import { useState, useEffect } from "react";
import { PublicClient } from "viem";
import KahootGameABI from "../../abi/KahootGame.json";

export function useGameSync(
  gameAddress: string | null,
  publicClient: PublicClient | undefined,
  correctAnswerIdx: number | null,
  setCorrectAnswerIdx: (val: number | null) => void,
  setIsCorrect: (val: boolean) => void,
  executeBatchReveal: () => Promise<boolean>,
  syncNewQuestion: (qData: any) => void,
  getCommit: (questionId: number) => any,
  setTimeLeft: (t: number) => void,
  setTotalTime: (t: number) => void
) {
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
          const qDataStr = localStorage.getItem("current_question"); // using raw just to read id, or we could pass questionData to hook
          const currentQId = qDataStr ? JSON.parse(qDataStr).id : null;
          
          if (currentQId !== null && data.latestQuestion?.id === currentQId) {
            const commitInfo = getCommit(currentQId);
            const myIdx = commitInfo && commitInfo.option !== undefined ? commitInfo.option : null;

            try {
              const correctAns = await publicClient.readContract({
                address: gameAddress as `0x${string}`,
                abi: KahootGameABI.abi,
                functionName: 'revealedAnswers',
                args: [BigInt(currentQId)],
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
        if (data.latestQuestion) {
          const qDataStr = localStorage.getItem("current_question");
          const currentQuestionId = qDataStr ? JSON.parse(qDataStr).id : -1;

          if (data.latestQuestion.id > currentQuestionId) {
            syncNewQuestion(data.latestQuestion);
            setTimeLeft(data.latestQuestion.timeLimit);
            setTotalTime(data.latestQuestion.timeLimit);
            setCorrectAnswerIdx(null);
            setIsCorrect(false);
            return;
          }
        }

        // 3. Game finished?
        if (!isRevealingRef && data.isFinished) {
            isRevealingRef = true;
            const success = await executeBatchReveal();
            if (!success) {
              isRevealingRef = false; // Allow retrying
            }
            return;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(poll, 3500);
    poll();
    return () => clearInterval(interval);
  }, [
    publicClient,
    gameAddress,
    correctAnswerIdx,
    executeBatchReveal,
    syncNewQuestion,
    getCommit,
    setTimeLeft,
    setTotalTime,
    setCorrectAnswerIdx,
    setIsCorrect
  ]);
}
