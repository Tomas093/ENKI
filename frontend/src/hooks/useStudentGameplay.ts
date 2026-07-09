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
    if (!gameAddress) return;

    // Safety cleanup if we switched game sessions
    const lastGame = sessionStorage.getItem("last_game_address");
    if (lastGame && lastGame !== gameAddress) {
      sessionStorage.removeItem(`game_commits_${lastGame}`);
      sessionStorage.removeItem("current_question");
    }
    sessionStorage.setItem("last_game_address", gameAddress);

    const qData = sessionStorage.getItem("current_question");
    if (qData) {
      const parsed = JSON.parse(qData);
      setQuestionData(parsed);
      setTimeLeft(parsed.timeLimit || 30);
      setTotalTime(parsed.timeLimit || 30);

      // Restore selected index from Key-Value store
      const storageKey = `game_commits_${gameAddress}`;
      const commitsObj = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
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
      const commitsObj = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      commitsObj[questionData.id] = { option: -1, salt: "" };
      sessionStorage.setItem(storageKey, JSON.stringify(commitsObj));
    }
  }, [timeLeft, selected, gameAddress, questionData]);

  const handlePick = async (idx: number) => {
    if (selected !== null || !gameAddress || !address || !questionData) return;
    setSelected(idx);

    const studentSalt = "studentSalt_" + window.crypto.randomUUID().replace(/-/g, "");
    
    // Store in Key-Value store immediately before contract call
    const storageKey = `game_commits_${gameAddress}`;
    const commitsObj = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
    commitsObj[questionData.id] = { option: idx, salt: studentSalt };
    sessionStorage.setItem(storageKey, JSON.stringify(commitsObj));

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
      // Revert local state and storage on failure
      setSelected(null);
      const storageKey = `game_commits_${gameAddress}`;
      const commitsObj = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      delete commitsObj[questionData.id];
      sessionStorage.setItem(storageKey, JSON.stringify(commitsObj));
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
            
            // Read my index from Key-Value store to calculate correctness
            const storageKey = `game_commits_${gameAddress}`;
            const commitsObj = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
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
