"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useWriteContract, useAccount, usePublicClient } from "wagmi";
import { keccak256, encodePacked } from "viem";
import KahootGameABI from "../../abi/KahootGame.json";
import { GlobalLoadingOverlay } from "../components/GlobalLoadingOverlay";

import { useDisplayName } from "../../hooks/useDisplayName";

const OPTION_STYLES = [
  { gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", border: "#4C1D95", glow: "rgba(109,40,217,0.45)" },
  { gradient: "linear-gradient(135deg, #3B82F6 0%, #1368CE 100%)", border: "#0a4a99", glow: "rgba(19,104,206,0.45)" },
  { gradient: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)", border: "#7C2D12", glow: "rgba(194,65,12,0.45)" },
  { gradient: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)", border: "#831843", glow: "rgba(190,24,93,0.45)" },
];

export default function ActiveGameplay() {
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

                  await writeContractAsync({
                    address: gameAddress as `0x${string}`,
                    abi: KahootGameABI.abi,
                    functionName: 'batchRevealAnswers',
                    args: [qIds, options, salts],
                  });
                  
                  sessionStorage.removeItem("pending_reveals");
                  router.push(`/leaderboard?game=${gameAddress}`);
                  return;
                } catch (e) {
                  console.error("Batch reveal failed", e);
                  setIsRevealing(false);
                  router.push(`/leaderboard?game=${gameAddress}`);
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

  const timerUrgent = timeLeft <= 5;
  const timerPct = (timeLeft / totalTime) * 100;
  const timerColor = timerUrgent ? "#EF4444" : "#7C3AED";
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  const isRevealed = correctAnswerIdx !== null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col w-full gap-4"
      style={{ height: "calc(100vh - 88px)" }}
    >
      {isRevealing && (
        <GlobalLoadingOverlay isVisible={true} message="Revealing your answers on-chain... Please check your wallet to sign the final transaction!" />
      )}
      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mt-2 relative">
        <motion.div
          animate={{ width: isRevealed ? "0%" : `${timerPct}%`, backgroundColor: isRevealed ? "#94a3b8" : timerColor }}
          transition={{ duration: 1, ease: "linear" }}
          className="h-full rounded-full"
        />
      </div>

      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2">
          <div className={`font-black text-xl tabular-nums ${timerUrgent && !isRevealed ? 'text-red-500 animate-pulse' : 'text-purple-600'}`}>
            {isRevealed ? "00:00" : `${mm}:${ss}`}
          </div>
        </div>

        <div className="px-5 py-1.5 rounded-full bg-white border-[3px] border-slate-200 shadow-sm">
          <span className="font-black text-slate-600 text-sm">
            Question {questionData ? questionData.id + 1 : "?"}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white rounded-[28px] border-[3px] border-slate-200 shadow-md flex items-center justify-center px-8 py-6"
        style={{ minHeight: 120 }}
      >
        <p
          className="font-black text-slate-800 text-center leading-snug"
          style={{ fontSize: "clamp(20px, 3vw, 32px)", fontFamily: "'Nunito', sans-serif" }}
        >
          {questionData ? questionData.question : "Loading question..."}
        </p>
      </motion.div>

      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {questionData && questionData.options.map((optText: string, idx: number) => {
          const opt = OPTION_STYLES[idx];
          const isSelected = selected === idx;
          const isActualCorrect = correctAnswerIdx === idx;
          
          let opacity = 1;
          let scale = 1;
          let currentGradient = opt.gradient;
          let currentGlow = opt.glow;

          if (isRevealed) {
            if (isActualCorrect) {
              scale = 1;
              currentGradient = "linear-gradient(135deg, #10B981 0%, #059669 100%)";
              currentGlow = "rgba(16,185,129,0.45)";
            } else if (isSelected) {
              scale = 1;
              currentGradient = "linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(185,28,28,0.8) 100%)";
              currentGlow = "rgba(239,68,68,0.35)";
            } else {
              opacity = 0.3;
            }
          } else {
            if (selected !== null && !isSelected) {
              opacity = 0.5;
            } else if (timeLeft <= 0 && !isSelected) {
              opacity = 0.3;
            }
            if (isSelected) scale = 0.97;
          }

          const disableClick = selected !== null || timeLeft <= 0 || isRevealed;

          return (
            <motion.button
              key={idx}
              onClick={() => handlePick(idx)}
              disabled={disableClick}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity, scale }}
              transition={{ delay: isRevealed ? 0 : 0.12 + idx * 0.06, type: "spring", stiffness: 300, damping: 22 }}
              className="flex flex-col items-center justify-center gap-3 relative overflow-hidden"
              style={{
                background: currentGradient,
                borderRadius: 24,
                cursor: disableClick ? "default" : "pointer",
                boxShadow: (isSelected || (isRevealed && isActualCorrect)) ? `0 0 32px ${currentGlow}` : `0 4px 20px ${currentGlow}`,
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
                  borderRadius: 24,
                }}
              />

              <div
                className="flex items-center justify-center font-black relative z-10"
                style={{
                  width: 48, height: 48,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.25)",
                  backdropFilter: "blur(4px)",
                  color: "white",
                  fontSize: 22,
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {isPending && isSelected ? (
                  <Loader2 className="animate-spin text-white w-6 h-6" />
                ) : (
                  ["A", "B", "C", "D"][idx]
                )}
              </div>

              <span
                className="text-white font-extrabold text-center leading-snug px-4 relative z-10"
                style={{
                  fontSize: "clamp(14px, 2vw, 22px)",
                  fontFamily: "'Nunito', sans-serif",
                  textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  maxWidth: "90%",
                }}
              >
                {optText}
              </span>

              {isRevealed && isActualCorrect && (
                <div className="absolute top-4 right-4 bg-white/25 p-2 rounded-full backdrop-blur-md">
                  <CheckCircle2 size={24} className="text-white drop-shadow-md" strokeWidth={3} />
                </div>
              )}
              {isRevealed && !isActualCorrect && (
                <div className="absolute top-4 right-4 bg-white/25 p-2 rounded-full backdrop-blur-md">
                  <XCircle size={24} className="text-white drop-shadow-md" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-center pb-1">
        <span className="text-slate-400 font-bold text-xs">Player: {displayName}</span>
      </div>

      <GlobalLoadingOverlay 
        isVisible={isRevealing} 
        message="Revealing answers on-chain..." 
        subMessage="Please sign in your wallet to compute points."
      />
    </motion.div>
  );
}
