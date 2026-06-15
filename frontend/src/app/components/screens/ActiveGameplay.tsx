import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { Loader2, AlertCircle } from "lucide-react";
import { useReadContracts, useWriteContract, useWatchContractEvent, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { encodePacked, keccak256 } from "viem";
import { kahootGameAbi } from "../../../lib/contracts";
import { useGame, generateSalt } from "../../../lib/GameContext";

const OPTION_COLORS = [
  { color: "#E21B3C", border: "#9b0026", label: "A" },
  { color: "#1368CE", border: "#0a4a99", label: "B" },
  { color: "#D97706", border: "#9a5300", label: "C" },
  { color: "#26890C", border: "#165a05", label: "D" },
];

export const ActiveGameplay = () => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { gameAddress, savePendingCommit } = useGame();

  const [selected, setSelected] = useState<number | null>(null);
  const [question, setQuestion] = useState<{ text: string; options: string[] } | null>(null);
  const [currentQId, setCurrentQId] = useState<bigint | null>(null);
  const [signing, setSigning] = useState(false);

  const gameAddr = gameAddress as `0x${string}` | undefined;

  // ── Read current contract state (source of truth) ──────────────────────────
  const { data, refetch } = useReadContracts({
    contracts: gameAddr
      ? [
          { address: gameAddr, abi: kahootGameAbi, functionName: "currentQuestionId" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "isFinished" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "isCancelled" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "totalQuestions" },
        ]
      : [],
    query: { enabled: !!gameAddr, refetchInterval: 3000 },
  });

  const currentQIdOnChain = data?.[0]?.result as bigint | undefined;
  const isFinished = data?.[1]?.result as boolean | undefined;
  const isCancelled = data?.[2]?.result as boolean | undefined;

  // Read round status when we have the question ID
  const { data: roundData, refetch: refetchRound } = useReadContracts({
    contracts:
      gameAddr && currentQIdOnChain !== undefined
        ? [
            {
              address: gameAddr,
              abi: kahootGameAbi,
              functionName: "listaDeRondas",
              args: [currentQIdOnChain],
            },
          ]
        : [],
    query: { enabled: !!gameAddr && currentQIdOnChain !== undefined, refetchInterval: 3000 },
  });

  const roundInfo = roundData?.[0]?.result as
    | { hashVerificacionPregunta: `0x${string}`; hashRespuestaCorrecta: `0x${string}`; commitPhaseOpen: boolean; revealPhaseOpen: boolean }
    | undefined;

  // ── Listen for QuestionRevealed event (triggers refetch + loads question) ──
  useWatchContractEvent({
    address: gameAddr,
    abi: kahootGameAbi,
    eventName: "QuestionRevealed",
    onLogs(logs) {
      const log = logs[0];
      const logAny = log as any;
      if (!logAny?.args) return;
      const { questionId, enunciado, opciones } = logAny.args as {
        questionId: bigint;
        enunciado: string;
        opciones: string[];
      };
      setCurrentQId(questionId);
      setQuestion({ text: enunciado, options: opciones });
      setSelected(null);
      refetch();
      refetchRound();
    },
    enabled: !!gameAddr,
  });

  // ── Write: commitAnswer ─────────────────────────────────────────────────────
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handlePick = async (idx: number) => {
    if (selected !== null || !gameAddr || !address || currentQIdOnChain === undefined) return;
    setSelected(idx);
    setSigning(true);

    const salt = generateSalt();
    // Must exactly match Solidity: keccak256(abi.encodePacked(uint8 option, string salt, address sender))
    const commitHash = keccak256(
      encodePacked(["uint8", "string", "address"], [idx as unknown as number, salt, address])
    );

    // Persist commit to sessionStorage BEFORE sending tx (user might F5 after signing)
    savePendingCommit({ questionId: Number(currentQIdOnChain), selectedOption: idx, salt });

    writeContract({
      address: gameAddr,
      abi: kahootGameAbi,
      functionName: "commitAnswer",
      args: [commitHash],
    });
  };

  // After tx lands, navigate to waiting room
  useEffect(() => {
    if (isTxSuccess) {
      setSigning(false);
      navigate("/waiting");
    }
    if (writeError) {
      setSigning(false);
      setSelected(null);
    }
  }, [isTxSuccess, writeError, navigate]);

  // If game finished/cancelled, go to appropriate screen
  useEffect(() => {
    if (isFinished) navigate("/leaderboard");
    if (isCancelled) navigate("/emergency-refund");
  }, [isFinished, isCancelled, navigate]);

  if (!gameAddr) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-orange-500" />
        <p className="text-xl font-bold text-slate-600">No active game found.</p>
        <button onClick={() => navigate("/student")} className="text-purple-600 font-bold underline">← Join a game first</button>
      </div>
    );
  }

  if (!question && !roundInfo?.commitPhaseOpen) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-[20px] border-4 border-blue-200 bg-blue-50 flex items-center justify-center">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
        </div>
        <p className="text-xl font-bold text-slate-600">Waiting for professor to start the question…</p>
        <p className="text-slate-400 text-sm font-mono">{gameAddr}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col w-full"
      style={{ height: "calc(100vh - 88px)" }}
    >
      {/* Question card */}
      <div className="bg-white rounded-[20px] border-4 border-slate-200 shadow-sm px-5 py-3 mb-3 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-[12px] px-4 py-2 shrink-0"
          style={{ background: "rgba(124,58,237,0.08)", border: "2px solid rgba(124,58,237,0.25)" }}>
          <span style={{ fontSize: 16 }}>❓</span>
          <span className="font-extrabold tabular-nums" style={{ fontSize: 18, color: "#7C3AED", fontFamily: "'Nunito', sans-serif", minWidth: 44 }}>
            Q{question ? Number(currentQId ?? currentQIdOnChain) + 1 : "…"}
          </span>
        </div>

        <p className="flex-1 text-center font-extrabold text-slate-800 leading-snug m-0"
          style={{ fontSize: "clamp(13px, 1.5vw, 18px)", fontFamily: "'Nunito', sans-serif" }}>
          {question?.text ?? "Loading question…"}
        </p>

        {roundInfo?.commitPhaseOpen && (
          <div className="flex items-center gap-2 rounded-[12px] px-4 py-2 shrink-0"
            style={{ background: "rgba(16,185,129,0.08)", border: "2px solid rgba(16,185,129,0.3)" }}>
            <span style={{ fontSize: 14 }}>🔓</span>
            <span className="font-extrabold" style={{ fontSize: 14, color: "#10B981", fontFamily: "'Nunito', sans-serif" }}>
              Commit Open
            </span>
          </div>
        )}
      </div>

      {/* 4-option grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {(question?.options ?? ["", "", "", ""]).map((optText, idx) => {
          const opt = OPTION_COLORS[idx];
          return (
            <button
              key={idx}
              onClick={() => handlePick(idx)}
              disabled={selected !== null || !roundInfo?.commitPhaseOpen}
              className="flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden"
              style={{
                background: opt.color,
                borderRadius: 20,
                borderBottom: `6px solid ${opt.border}`,
                cursor: selected !== null || !roundInfo?.commitPhaseOpen ? "default" : "pointer",
                opacity: selected !== null && selected !== idx ? 0.6 : !roundInfo?.commitPhaseOpen ? 0.5 : 1,
                transform: selected === idx ? "translateY(6px)" : "translateY(0)",
              }}
              onMouseEnter={(e) => { if (selected === null && roundInfo?.commitPhaseOpen) (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
            >
              <div className="flex items-center justify-center font-black"
                style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.25)", color: "white", fontSize: 22, fontFamily: "'Nunito', sans-serif", flexShrink: 0 }}>
                {opt.label}
              </div>
              <span className="text-white font-extrabold text-center leading-snug px-4"
                style={{ fontSize: "clamp(13px, 1.8vw, 20px)", fontFamily: "'Nunito', sans-serif", textShadow: "0 2px 6px rgba(0,0,0,0.2)", maxWidth: "90%" }}>
                {optText || `Option ${opt.label}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Signing overlay */}
      <AnimatePresence>
        {signing && (
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
              <h2 className="font-extrabold text-slate-800 mb-2" style={{ fontSize: 26, fontFamily: "'Nunito', sans-serif" }}>
                Locking answer on-chain…
              </h2>
              <p className="text-slate-500 font-bold mb-5" style={{ fontSize: 17 }}>
                {isWritePending ? "Please sign in your wallet." : "Waiting for confirmation…"}
              </p>
              {writeError && (
                <p className="text-red-500 text-sm font-semibold">{(writeError as Error).message?.slice(0, 100)}</p>
              )}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 30, ease: "linear" }}
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
