"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useWriteContract, useAccount } from "wagmi";
import { keccak256, encodePacked } from "viem";
import KahootGameABI from "../../abi/KahootGame.json";
import { GlobalLoadingOverlay } from "../components/GlobalLoadingOverlay";

import { useGameState, useWatchGameEvents } from "../../hooks/useGameContract";
import { useDisplayName } from "../../hooks/useDisplayName";

const OPTION_STYLES = [
  { gradient: "linear-gradient(135deg, #FF3B5C 0%, #E21B3C 100%)", border: "#9b0026", glow: "rgba(226,27,60,0.45)" },
  { gradient: "linear-gradient(135deg, #3B82F6 0%, #1368CE 100%)", border: "#0a4a99", glow: "rgba(19,104,206,0.45)" },
  { gradient: "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)", border: "#9a5300", glow: "rgba(217,119,6,0.45)" },
  { gradient: "linear-gradient(135deg, #34D399 0%, #059669 100%)", border: "#065f46", glow: "rgba(5,150,105,0.45)" },
];

export default function ActiveGameplay() {
  const [selected, setSelected] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(30);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game") as `0x${string}`;
  const { address } = useAccount();
  const { displayName } = useDisplayName(address);

  const { writeContractAsync, isPending } = useWriteContract();
  const { currentQuestionId } = useGameState(gameAddress);

  useWatchGameEvents(gameAddress, (args) => {
    // When a question is revealed, the host will trigger this
    if (args.questionId !== undefined) {
      setQuestionData({
        id: Number(args.questionId),
        question: args.enunciado,
        options: args.opciones,
      });
      setTimeLeft(30);
      setTotalTime(30);
      setSelected(null);
    }
  }, (args) => {
    if (args.questionId === currentQuestionId) {
       router.push(`/waiting?game=${gameAddress}`);
    }
  });

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

  // Auto-redirect if time runs out and no answer was picked
  useEffect(() => {
    if (timeLeft <= 0 && selected === null && gameAddress) {
      sessionStorage.removeItem("my_answer_idx");
      sessionStorage.removeItem("my_answer_salt");
      const t = setTimeout(() => {
        router.push(`/waiting?game=${gameAddress}`);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [timeLeft, selected, gameAddress, router]);

  const handlePick = async (idx: number) => {
    if (selected !== null || !gameAddress || !address) return;
    setSelected(idx);

    const studentSalt = "studentSalt_" + Math.random().toString(36).substring(2, 10);
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

      router.push(`/waiting?game=${gameAddress}`);
    } catch (e) {
      console.error(e);
      toast.error("Transaction failed. Are you connected?");
      setSelected(null);
    }
  };

  const timerUrgent = timeLeft <= 5;
  const timerPct = (timeLeft / totalTime) * 100;
  const timerColor = timerUrgent ? "#EF4444" : "#7C3AED";
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col w-full gap-4"
      style={{ height: "calc(100vh - 88px)" }}
    >
      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mt-2 relative">
        <motion.div
          animate={{ width: `${timerPct}%`, backgroundColor: timerColor }}
          transition={{ duration: 1, ease: "linear" }}
          className="h-full rounded-full"
        />
      </div>

      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2">
          <div className={`font-black text-xl tabular-nums ${timerUrgent ? 'text-red-500 animate-pulse' : 'text-purple-600'}`}>
            {mm}:{ss}
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
          const isDimmed = selected !== null && !isSelected;
          return (
            <motion.button
              key={idx}
              onClick={() => handlePick(idx)}
              disabled={selected !== null || timeLeft <= 0}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: isDimmed ? 0.5 : (timeLeft <= 0 && !isSelected ? 0.3 : 1), scale: isSelected ? 0.97 : 1 }}
              transition={{ delay: 0.12 + idx * 0.06, type: "spring", stiffness: 300, damping: 22 }}
              className="flex flex-col items-center justify-center gap-3 relative overflow-hidden"
              style={{
                background: opt.gradient,
                borderRadius: 24,
                borderBottom: `6px solid ${opt.border}`,
                cursor: selected !== null ? "default" : "pointer",
                boxShadow: isSelected ? `0 0 32px ${opt.glow}` : `0 4px 20px ${opt.glow}`,
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
                {isSelected && isPending ? (
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
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-center pb-1">
        <span className="text-slate-400 font-bold text-xs">Player: {displayName}</span>
      </div>

      <GlobalLoadingOverlay 
        isVisible={selected !== null} 
        message="Locking answer on-chain..." 
        subMessage="Please sign in your wallet."
      />
    </motion.div>
  );
}
;
