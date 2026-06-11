"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useWriteContract, useAccount } from "wagmi";
import { keccak256, encodePacked } from "viem";
import KahootGameABI from "../../abi/KahootGame.json";

const OPTION_STYLES = [
  { gradient: "linear-gradient(135deg, #FF3B5C 0%, #E21B3C 100%)", border: "#9b0026", glow: "rgba(226,27,60,0.45)" },
  { gradient: "linear-gradient(135deg, #3B82F6 0%, #1368CE 100%)", border: "#0a4a99", glow: "rgba(19,104,206,0.45)" },
  { gradient: "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)", border: "#9a5300", glow: "rgba(217,119,6,0.45)" },
  { gradient: "linear-gradient(135deg, #34D399 0%, #059669 100%)", border: "#065f46", glow: "rgba(5,150,105,0.45)" },
];

const TOTAL_TIME = 30;

export default function ActiveGameplay() {
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [questionData, setQuestionData] = useState<any>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game");
  const { address } = useAccount();

  const { writeContractAsync, isPending } = useWriteContract();

  useEffect(() => {
    const qData = sessionStorage.getItem("current_question");
    if (qData) {
      setQuestionData(JSON.parse(qData));
    }
  }, []);

  useEffect(() => {
    if (selected !== null || timeLeft <= 0 || !questionData) return;
    const t = setInterval(() => setTimeLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [selected, timeLeft, questionData]);

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

      const tx = await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: 'commitAnswer',
        args: [commitHash],
      });

      router.push(`/waiting?game=${gameAddress}`);
    } catch (e) {
      console.error(e);
      alert("Transaction failed. Are you connected?");
      setSelected(null);
    }
  };

  const timerUrgent = timeLeft <= 5;
  const timerPct = (timeLeft / TOTAL_TIME) * 100;
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

      {/* ── 1. Header: Timer + Question pill ─────────────────────────── */}
      <div className="flex items-center justify-center gap-4 pt-2">

        {/* Circular timer */}
        <div className="relative flex items-center justify-center">
          <svg width="72" height="72" className="-rotate-90">
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="6" />
            <motion.circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke={timerColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={2 * Math.PI * 30 * (1 - timerPct / 100)}
              style={{ filter: `drop-shadow(0 0 6px ${timerColor})`, transition: "stroke 0.4s" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-black tabular-nums"
              style={{ fontSize: 16, color: timerColor, fontFamily: "'Nunito', sans-serif" }}
            >
              {mm}:{ss}
            </span>
          </div>
        </div>

        {/* Question pill */}
        <div className="px-5 py-2 rounded-full bg-white border-[3px] border-slate-200 shadow-sm">
          <span className="font-black text-slate-600 text-sm">
            Question {questionData ? questionData.id + 1 : "?"}
          </span>
        </div>
      </div>

      {/* ── 2. Question card ──────────────────────────────────────────── */}
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

      {/* ── 3 & 4. 2×2 answer grid ───────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {questionData && questionData.options.map((optText: string, idx: number) => {
          const opt = OPTION_STYLES[idx];
          const isSelected = selected === idx;
          const isDimmed = selected !== null && !isSelected;
          return (
            <motion.button
              key={idx}
              onClick={() => handlePick(idx)}
              disabled={selected !== null}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: isDimmed ? 0.5 : 1, scale: isSelected ? 0.97 : 1 }}
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
              {/* Glassy shimmer overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
                  borderRadius: 24,
                }}
              />

              {/* Label badge */}
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

              {/* Answer text */}
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

      {/* ── 5. Footer ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center pb-1">
        <span className="text-slate-400 font-bold text-xs">Player: 0xAbc...def</span>
      </div>

      {/* ── Web3 signing overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-8 rounded-[32px] max-w-md w-full text-center shadow-2xl border-4 border-slate-200 flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-purple-100 rounded-[20px] flex items-center justify-center mb-5 border-4 border-purple-200">
                <Loader2 size={40} className="text-purple-600 animate-spin" strokeWidth={3} />
              </div>
              <h2 className="font-black text-slate-800 mb-2" style={{ fontSize: 26, fontFamily: "'Nunito', sans-serif" }}>
                Locking answer on-chain...
              </h2>
              <p className="text-slate-500 font-bold mb-5" style={{ fontSize: 17 }}>
                Please sign in your wallet.
              </p>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="h-full bg-purple-500 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
