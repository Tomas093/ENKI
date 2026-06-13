import { useState, useEffect } from "react";
import { Hourglass, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { useReadContracts, useWriteContract, useWatchContractEvent, useWaitForTransactionReceipt } from "wagmi";
import { kahootGameAbi } from "../../../lib/contracts";
import { useGame } from "../../../lib/GameContext";

const INACTIVITY_TIMEOUT_SECS = 12 * 60 * 60; // 12 hours in seconds

export const WaitingRoom = () => {
  const navigate = useNavigate();
  const { gameAddress, pendingCommit, clearPendingCommit } = useGame();
  const gameAddr = gameAddress as `0x${string}` | undefined;

  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [alreadyRevealed, setAlreadyRevealed] = useState(false);

  // ── Read on-chain state as source of truth ─────────────────────────────────
  const { data, refetch } = useReadContracts({
    contracts: gameAddr
      ? [
          { address: gameAddr, abi: kahootGameAbi, functionName: "currentQuestionId" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "lastActionTime" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "isFinished" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "isCancelled" },
        ]
      : [],
    query: { enabled: !!gameAddr, refetchInterval: 5000 },
  });

  const currentQId = data?.[0]?.result as bigint | undefined;
  const lastActionTime = data?.[1]?.result as bigint | undefined;
  const isFinished = data?.[2]?.result as boolean | undefined;
  const isCancelled = data?.[3]?.result as boolean | undefined;

  // Read the current round state to detect if reveal phase is already open
  const { data: roundData, refetch: refetchRound } = useReadContracts({
    contracts:
      gameAddr && currentQId !== undefined && pendingCommit !== null
        ? [
            {
              address: gameAddr,
              abi: kahootGameAbi,
              functionName: "listaDeRondas",
              args: [BigInt(pendingCommit.questionId)],
            },
            {
              address: gameAddr,
              abi: kahootGameAbi,
              functionName: "revealedAnswers",
              args: [BigInt(pendingCommit.questionId)],
            },
          ]
        : [],
    query: { enabled: !!gameAddr && pendingCommit !== null, refetchInterval: 3000 },
  });

  const roundInfo = roundData?.[0]?.result as
    | { commitPhaseOpen: boolean; revealPhaseOpen: boolean }
    | undefined;
  const correctAnswer = roundData?.[1]?.result as number | undefined;

  // ── Check AFK timeout ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!lastActionTime) return;
    const nowSecs = Math.floor(Date.now() / 1000);
    const deadline = Number(lastActionTime) + INACTIVITY_TIMEOUT_SECS;
    if (nowSecs >= deadline) {
      setShowBanner(true);
    } else {
      const remaining = (deadline - nowSecs) * 1000;
      const t = setTimeout(() => setShowBanner(true), Math.min(remaining, 2147483647));
      return () => clearTimeout(t);
    }
  }, [lastActionTime]);

  // Navigate if game ends
  useEffect(() => {
    if (isFinished) navigate("/leaderboard");
    if (isCancelled) navigate("/emergency-refund");
  }, [isFinished, isCancelled, navigate]);

  // ── Write: revealAnswer ────────────────────────────────────────────────────
  const {
    writeContract,
    data: revealTxHash,
    isPending: isRevealPending,
    error: revealError,
    reset: resetReveal,
  } = useWriteContract();
  const { isLoading: isRevealTxLoading, isSuccess: isRevealTxSuccess } = useWaitForTransactionReceipt({
    hash: revealTxHash,
  });

  const doReveal = () => {
    if (!gameAddr || !pendingCommit || alreadyRevealed) return;
    setAlreadyRevealed(true);
    writeContract({
      address: gameAddr,
      abi: kahootGameAbi,
      functionName: "revealAnswer",
      args: [BigInt(pendingCommit.questionId), pendingCommit.selectedOption as unknown as number, pendingCommit.salt],
    });
  };

  // ── Trigger reveal when RevealPhaseStarted event fires ─────────────────────
  useWatchContractEvent({
    address: gameAddr,
    abi: kahootGameAbi,
    eventName: "RevealPhaseStarted",
    onLogs() {
      refetch();
      refetchRound();
      doReveal();
    },
    enabled: !!gameAddr && !!pendingCommit && !alreadyRevealed,
  });

  // Also trigger reveal if reveal phase is already open (in case user refreshed)
  useEffect(() => {
    if (roundInfo?.revealPhaseOpen && !alreadyRevealed && pendingCommit) {
      doReveal();
    }
  }, [roundInfo?.revealPhaseOpen]);

  // After reveal tx confirmed: check correctness and show feedback
  useEffect(() => {
    if (isRevealTxSuccess && pendingCommit !== null && correctAnswer !== undefined) {
      const correct = pendingCommit.selectedOption === correctAnswer;
      setIsCorrect(correct);
      setRevealed(true);
      clearPendingCommit();
      // Navigate to next question or leaderboard after 4s
      setTimeout(() => {
        refetch().then(() => {
          if (isFinished) navigate("/leaderboard");
          else navigate("/gameplay");
        });
      }, 4000);
    }
  }, [isRevealTxSuccess]);

  if (!gameAddr || !pendingCommit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-bold text-slate-600">No active game or pending answer found.</p>
        <button onClick={() => navigate("/student")} className="text-purple-600 font-bold underline">← Join a game</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full z-10 relative">
      {/* ── Emergency Banner ─────────────────────────────────── */}
      <AnimatePresence>
        {showBanner && !revealed && (
          <motion.div
            key="emergency-banner"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 gap-4"
            style={{ background: "linear-gradient(90deg, #EA580C, #F97316)", boxShadow: "0 6px 32px rgba(234,88,12,0.45)", minHeight: 68 }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                style={{ fontSize: 28, flexShrink: 0 }}
              >
                🚨
              </motion.span>
              <p className="text-white font-extrabold truncate"
                style={{ fontSize: "clamp(13px, 2vw, 17px)", fontFamily: "'Nunito', sans-serif" }}>
                Emergency: Professor inactive for over <span className="underline">12 hours!</span>
              </p>
            </div>
            <button
              onClick={() => navigate("/emergency-refund")}
              className="flex items-center gap-2 font-black shrink-0 transition-all hover:scale-105 active:scale-95"
              style={{ background: "white", color: "#EA580C", borderRadius: 14, border: "3px solid rgba(255,255,255,0.4)", padding: "10px 20px", fontSize: "clamp(13px, 1.8vw, 15px)", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}
            >
              Rescue Your Funds →
            </button>
            <button onClick={() => setShowBanner(false)} className="text-white/70 hover:text-white font-bold shrink-0 transition-colors"
              style={{ fontSize: 22, lineHeight: 1, padding: "4px 8px" }}>
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="bg-white p-10 md:p-14 rounded-[32px] border-4 border-slate-200 shadow-xl max-w-2xl w-full text-center flex flex-col items-center mx-4"
            style={{ marginTop: showBanner ? 68 : 0, transition: "margin-top 0.3s" }}
          >
            {isRevealPending || isRevealTxLoading ? (
              <>
                <div className="w-28 h-28 bg-purple-100 text-purple-500 rounded-[28px] flex items-center justify-center mb-7 border-4 border-purple-200">
                  <Hourglass size={56} strokeWidth={2} className="animate-pulse" />
                </div>
                <h1 className="font-extrabold text-slate-800 mb-3" style={{ fontSize: "clamp(22px, 4vw, 38px)", fontFamily: "'Nunito', sans-serif" }}>
                  {isRevealPending ? "Sign the reveal…" : "Confirming reveal…"}
                </h1>
                <p className="text-slate-500 font-bold" style={{ fontSize: "clamp(15px, 2vw, 20px)", fontFamily: "'Nunito', sans-serif" }}>
                  {isRevealPending ? "Please approve the transaction in your wallet." : "Waiting for blockchain confirmation…"}
                </p>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 180 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                  className="w-28 h-28 bg-blue-100 text-blue-500 rounded-[28px] flex items-center justify-center mb-7 border-4 border-blue-200"
                >
                  <Hourglass size={56} strokeWidth={2} />
                </motion.div>
                <h1 className="font-extrabold text-slate-800 mb-3" style={{ fontSize: "clamp(22px, 4vw, 38px)", fontFamily: "'Nunito', sans-serif" }}>
                  Answer Locked Securely!
                </h1>
                <p className="text-slate-500 font-bold leading-relaxed" style={{ fontSize: "clamp(15px, 2vw, 20px)", fontFamily: "'Nunito', sans-serif", maxWidth: 380 }}>
                  Waiting for the Professor to reveal the correct answer on-chain…
                </p>
                <div className="flex items-center gap-2 mt-6">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                      className="w-3 h-3 rounded-full bg-blue-400"
                    />
                  ))}
                </div>
                {revealError && (
                  <p className="text-red-500 text-sm font-semibold mt-4">
                    Reveal error: {(revealError as Error).message?.slice(0, 100)}
                  </p>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`fixed inset-0 z-50 flex items-center justify-center flex-col p-8 ${isCorrect ? "bg-[#10B981]" : "bg-red-500"}`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
              className="bg-white/20 p-8 rounded-full mb-8 backdrop-blur-md"
            >
              {isCorrect ? (
                <CheckCircle2 size={120} className="text-white" strokeWidth={3} />
              ) : (
                <XCircle size={120} className="text-white" strokeWidth={3} />
              )}
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-black text-white mb-4 tracking-tight text-center drop-shadow-lg"
              style={{ fontSize: "clamp(48px, 10vw, 96px)", fontFamily: "'Nunito', sans-serif" }}
            >
              {isCorrect ? "CORRECT!" : "INCORRECT"}
            </motion.h1>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-black/20 px-8 py-4 rounded-[24px] backdrop-blur-sm"
            >
              <p className="font-extrabold text-white" style={{ fontSize: 28, fontFamily: "'Nunito', sans-serif" }}>
                {isCorrect ? "+1 Point" : "+0 Points"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
