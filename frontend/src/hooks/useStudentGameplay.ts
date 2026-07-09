import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import { keccak256, encodePacked } from "viem";
import toast from "react-hot-toast";
import KahootGameABI from "../abi/KahootGame.json";
import { useDisplayName } from "./useDisplayName";

export function useStudentGameplay() {
  const [selected, setSelected] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(30);
  
  const [correctAnswerIdx, setCorrectAnswerIdx] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game") as `0x${string}`;
  const { address } = useAccount();
  const { displayName } = useDisplayName(address);
  const publicClient = usePublicClient();

  const { writeContractAsync, isPending } = useWriteContract();

  useEffect(() => {
    const qData = sessionStorage.getItem("current_question");
    if (qData) {
      const parsed = JSON.parse(qData);
      setQuestionData(parsed);
      setTimeLeft(parsed.timeLimit || 30);
      setTotalTime(parsed.timeLimit || 30);
    }
  }, []);

  useEffect(() => {
    if (selected !== null || timeLeft <= 0 || !questionData) return;
    const t = setInterval(() => setTimeLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [selected, timeLeft, questionData]);

  useEffect(() => {
    if (timeLeft <= 0 && selected === null && gameAddress) {
      setSelected(-1);
      sessionStorage.removeItem("my_answer_idx");
      sessionStorage.removeItem("my_answer_salt");
    }
  }, [timeLeft, selected, gameAddress]);

  const handlePick = async (idx: number) => {
    if (selected !== null || !gameAddress || !address) return;
    setSelected(idx);

    const studentSalt = "studentSalt_" + window.crypto.randomUUID().replace(/-/g, "");
    sessionStorage.setItem("my_answer_salt", studentSalt);
    sessionStorage.setItem("my_answer_idx", idx.toString());

    try {
      const commitHash = keccak256(
        encodePacked(['uint8', 'string', 'address'], [idx, studentSalt, address])
      );

      await writeContractAsync({
        address: gameAddress,
        abi: KahootGameABI.abi,
        functionName: 'commitAnswer',
        args: [commitHash],
      });
    } catch (e) {
      console.error(e);
      toast.error("Transaction failed. Are you connected?");
      setSelected(null);
    }
  };

  useEffect(() => {
    if (!publicClient || !gameAddress) return;

    let lastCheckedBlock = 0n;
    let isRevealingRef = false;

    const poll = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = lastCheckedBlock === 0n
          ? (currentBlock > 9000n ? currentBlock - 9000n : 0n)
          : lastCheckedBlock + 1n > currentBlock ? currentBlock : lastCheckedBlock + 1n;

        if (correctAnswerIdx === null) {
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
          }
        }

        if (correctAnswerIdx !== null) {
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

            const newQuestionData = {
              id: Number(args.questionId),
              question: actualQuestion,
              timeLimit: timeLimit,
              options: args.opciones,
            };
            sessionStorage.setItem("current_question", JSON.stringify(newQuestionData));
            
            setQuestionData(newQuestionData);
            setTimeLeft(timeLimit);
            setTotalTime(timeLimit);
            setSelected(null);
            setCorrectAnswerIdx(null);
            setIsCorrect(false);
            return;
          }

          if (!isRevealingRef) {
            const finished = await publicClient.readContract({
              address: gameAddress as `0x${string}`,
              abi: KahootGameABI.abi,
              functionName: 'isFinished'
            });

            if (finished) {
              isRevealingRef = true;
              setIsRevealing(true);
              const pendingReveals = JSON.parse(sessionStorage.getItem("pending_reveals") || "[]");
              
              if (pendingReveals.length > 0) {
                try {
                  const qIds = pendingReveals.map((r: any) => BigInt(r.qId));
                  const options = pendingReveals.map((r: any) => r.myIdx);
                  const salts = pendingReveals.map((r: any) => r.mySalt);
                  
                  const hash = await writeContractAsync({
                    address: gameAddress as `0x${string}`,
                    abi: KahootGameABI.abi,
                    functionName: 'batchRevealAnswers',
                    args: [qIds, options, salts],
                  });
                  
                  sessionStorage.removeItem("pending_reveals");
                  router.push(`/leaderboard?game=${gameAddress}&tx=${hash}`);
                  return;
                } catch (e) {
                  console.error("Batch reveal failed", e);
                  toast.error("Failed to record answers. Please try again.", { id: "batchReveal" });
                  setIsRevealing(false);
                  isRevealingRef = false; // Allow retrying if they stay on page
                  return;
                }
              } else {
                router.push(`/leaderboard?game=${gameAddress}`);
                return;
              }
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
  }, [publicClient, gameAddress, correctAnswerIdx, writeContractAsync, router]);

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
