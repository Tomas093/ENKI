import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWriteContract, usePublicClient } from "wagmi";
import KahootGameABI from "../abi/KahootGame.json";

export function useWaitingRoom() {
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [questionText, setQuestionText] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [myAnswerIdx, setMyAnswerIdx] = useState<number | null>(null);
  const [correctAnswerIdx, setCorrectAnswerIdx] = useState<number | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game");

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  useEffect(() => {
    const bannerTimer = setTimeout(() => setShowBanner(true), 15000);
    const qDataStr = sessionStorage.getItem("current_question");
    if (qDataStr) {
       const qData = JSON.parse(qDataStr);
       setOptions(qData.options || []);
       setQuestionText(qData.question || "");
       setQuestionNumber((qData.id !== undefined ? Number(qData.id) : 0) + 1);
    }
    const myIdx = sessionStorage.getItem("my_answer_idx");
    if (myIdx !== null) {
       setMyAnswerIdx(Number(myIdx));
    }
    return () => clearTimeout(bannerTimer);
  }, []);

  useEffect(() => {
    if (!publicClient || !gameAddress) return;

    let lastCheckedBlock = 0n;
    let isRevealingRef = false;
    let isRevealedRef = false;

    const poll = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = lastCheckedBlock === 0n
          ? (currentBlock > 9000n ? currentBlock - 9000n : 0n)
          : lastCheckedBlock + 1n > currentBlock ? currentBlock : lastCheckedBlock + 1n;

        if (!isRevealingRef && !isRevealedRef) {
          const revealLogs = await publicClient.getContractEvents({
            address: gameAddress as `0x${string}`,
            abi: KahootGameABI.abi,
            eventName: 'RevealPhaseStarted',
            fromBlock,
            toBlock: 'latest',
          });

          const qDataStr = sessionStorage.getItem("current_question");
          const currentQId = qDataStr ? JSON.parse(qDataStr).id : null;
          const matchingLog = currentQId !== null
            ? revealLogs.find((l: any) => Number(l.args.questionId) === currentQId)
            : revealLogs[0];

          if (matchingLog) {
            isRevealingRef = true;
            const log = matchingLog as any;
            const qId = Number(log.args.questionId);
            const myIdx = sessionStorage.getItem("my_answer_idx");
            const mySalt = sessionStorage.getItem("my_answer_salt");
            
            if (myIdx !== null && mySalt) {
              const pendingReveals = JSON.parse(sessionStorage.getItem("pending_reveals") || "[]");
              pendingReveals.push({ qId, myIdx: Number(myIdx), mySalt });
              sessionStorage.setItem("pending_reveals", JSON.stringify(pendingReveals));
            }

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

        if (isRevealedRef) {
          const nextQLogs = await publicClient.getContractEvents({
            address: gameAddress as `0x${string}`,
            abi: KahootGameABI.abi,
            eventName: 'QuestionRevealed',
            fromBlock,
            toBlock: 'latest',
          });

          const qDataStr = sessionStorage.getItem("current_question");
          const currentQuestionId = qDataStr ? JSON.parse(qDataStr).id : -1;
          const validNextLog = nextQLogs.find((log: any) => Number(log.args.questionId) > currentQuestionId);

          if (validNextLog) {
            const log = validNextLog as any;
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
            sessionStorage.setItem("current_question", JSON.stringify(questionData));
            router.push(`/gameplay?game=${gameAddress}`);
            return;
          }

          const finished = await publicClient.readContract({
            address: gameAddress as `0x${string}`,
            abi: KahootGameABI.abi,
            functionName: 'isFinished'
          });

          if (finished) {
            setIsRevealing(true);
            const storageKey = `game_commits_${gameAddress}`;
            const commitsObj = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
            
            // Map dictionary to lists, filtering out any timeouts (option === -1)
            const qIds: bigint[] = [];
            const options: number[] = [];
            const salts: string[] = [];

            Object.keys(commitsObj).forEach((qIdStr) => {
              const qId = Number(qIdStr);
              const info = commitsObj[qIdStr];
              if (info && info.option !== -1 && info.salt) {
                qIds.push(BigInt(qId));
                options.push(info.option);
                salts.push(info.salt);
              }
            });
            
            if (qIds.length > 0) {
              try {
                const hash = await writeContractAsync({
                  address: gameAddress as `0x${string}`,
                  abi: KahootGameABI.abi,
                  functionName: 'batchRevealAnswers',
                  args: [qIds, options, salts],
                });
                
                sessionStorage.removeItem(storageKey);
                router.push(`/leaderboard?game=${gameAddress}&tx=${hash}`);
                return;
              } catch (e) {
                console.error("Batch reveal failed", e);
                setIsRevealing(false);
              }
            } else {
              router.push(`/leaderboard?game=${gameAddress}`);
              return;
            }
          }
        }

        lastCheckedBlock = currentBlock;
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(poll, 3500);
    poll();
    return () => clearInterval(interval);
  }, [publicClient, gameAddress, router, writeContractAsync]);

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
