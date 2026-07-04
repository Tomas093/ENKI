"use client";
import { useState, useEffect } from "react";
import { Hourglass, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWriteContract, usePublicClient } from "wagmi";
import KahootGameABI from "../../abi/KahootGame.json";

export default function WaitingRoom() {
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [questionText, setQuestionText] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [myAnswerIdx, setMyAnswerIdx] = useState<number | null>(null);
  const [correctAnswerIdx, setCorrectAnswerIdx] = useState<number | null>(null);
  
  const OPTION_STYLES = [
    { gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", border: "#4C1D95", glow: "rgba(109,40,217,0.45)" }, // Purple
    { gradient: "linear-gradient(135deg, #3B82F6 0%, #1368CE 100%)", border: "#0a4a99", glow: "rgba(19,104,206,0.45)" }, // Blue
    { gradient: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)", border: "#7C2D12", glow: "rgba(194,65,12,0.45)" }, // Orange
    { gradient: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)", border: "#831843", glow: "rgba(190,24,93,0.45)" }, // Pink
  ];
  
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

  // Polling para detectar RevealPhaseStarted, QuestionRevealed y PrizesCalculated
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

        // 1. Buscar RevealPhaseStarted (para hacer el reveal automático)
        if (!isRevealingRef && !isRevealedRef) {
          const revealLogs = await publicClient.getContractEvents({
            address: gameAddress as `0x${string}`,
            abi: KahootGameABI.abi,
            eventName: 'RevealPhaseStarted',
            fromBlock,
            toBlock: 'latest',
          });

          // Filter by current questionId to avoid picking up stale events
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
              // Store it in pending reveals instead of sending a TX immediately!
              const pendingReveals = JSON.parse(sessionStorage.getItem("pending_reveals") || "[]");
              pendingReveals.push({ qId, myIdx: Number(myIdx), mySalt });
              sessionStorage.setItem("pending_reveals", JSON.stringify(pendingReveals));
            }

            try {
              // Fetch the correct answer directly without signing a transaction
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

        // 2. Si ya revelamos, esperar la siguiente pregunta o el fin del juego
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

          // Check if game is finished so we can batch reveal!
          const finished = await publicClient.readContract({
            address: gameAddress as `0x${string}`,
            abi: KahootGameABI.abi,
            functionName: 'isFinished'
          });

          if (finished) {
            // Trigger Batch Reveal before routing to leaderboard
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
                // Allow them to proceed even if it fails, maybe they rejected it
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
  }, [publicClient, gameAddress]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full z-10 relative" style={{ height: "calc(100vh - 88px)" }}>

      {/* ── EMERGENCY BANNER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBanner && !revealed && (
          <motion.div
            key="emergency-banner"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 gap-4"
            style={{
              background: "linear-gradient(90deg, #EA580C, #F97316)",
              boxShadow: "0 6px 32px rgba(234,88,12,0.45)",
              minHeight: 68,
            }}
          >
            {/* Left: icon + text */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                style={{ fontSize: 28, flexShrink: 0 }}
              >
                🚨
              </motion.span>
              <p
                className="text-white font-extrabold truncate"
                style={{
                  fontSize: "clamp(13px, 2vw, 17px)",
                  fontFamily: "'Nunito', sans-serif",
                  textShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              >
                Emergency: Professor inactive for over{" "}
                <span className="underline decoration-2 underline-offset-2">12 hours!</span>
              </p>
            </div>

            {/* Right: CTA button */}
            <button
              onClick={() => router.push("/emergency-refund")}
              className="flex items-center gap-2 font-black shrink-0 transition-all hover:scale-105 active:scale-95"
              style={{
                background: "white",
                color: "#EA580C",
                borderRadius: 14,
                border: "3px solid rgba(255,255,255,0.4)",
                padding: "10px 20px",
                fontSize: "clamp(13px, 1.8vw, 15px)",
                fontFamily: "'Nunito', sans-serif",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                whiteSpace: "nowrap",
              }}
            >
              Rescue Your Funds →
            </button>

            {/* Dismiss */}
            <button
              onClick={() => setShowBanner(false)}
              className="text-white/70 hover:text-white font-bold shrink-0 transition-colors"
              style={{ fontSize: 22, lineHeight: 1, padding: "4px 8px" }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
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
            <motion.div
              animate={{ rotate: 180 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              className="w-28 h-28 bg-blue-100 text-blue-500 rounded-[28px] flex items-center justify-center mb-7 border-4 border-blue-200"
            >
              <Hourglass size={56} strokeWidth={2} />
            </motion.div>

            <h1
              className="font-extrabold text-slate-800 mb-3 tracking-tight"
              style={{ fontSize: "clamp(22px, 4vw, 38px)", fontFamily: "'Nunito', sans-serif" }}
            >
              {isRevealing ? "Revealing on-chain..." : "Answer Locked Securely!"}
            </h1>
            <p
              className="text-slate-500 font-bold leading-relaxed"
              style={{ fontSize: "clamp(15px, 2vw, 20px)", fontFamily: "'Nunito', sans-serif", maxWidth: 380 }}
            >
              {isRevealing 
                ? "Submitting your decryption key to the Smart Contract..."
                : "Waiting for the Professor to close the question on-chain..."}
            </p>

            {/* Pulsing dots */}
            <div className="flex items-center gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  className="w-3 h-3 rounded-full bg-blue-400"
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="feedback-gameplay-style"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col w-full gap-4"
            style={{ height: "calc(100vh - 88px)" }}
          >
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mt-2 relative">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                className="h-full rounded-full bg-slate-400"
              />
            </div>

            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-100 border-[3px] border-emerald-200 rounded-full">
                    <CheckCircle2 className="text-emerald-600" size={18} strokeWidth={3} />
                    <span className="font-black text-emerald-600 text-sm tracking-wide">+1 Point</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-red-100 border-[3px] border-red-200 rounded-full">
                    <XCircle className="text-red-600" size={18} strokeWidth={3} />
                    <span className="font-black text-red-600 text-sm tracking-wide">Incorrect</span>
                  </div>
                )}
              </div>

              <div className="px-5 py-1.5 rounded-full bg-white border-[3px] border-slate-200 shadow-sm">
                <span className="font-black text-slate-600 text-sm">Question {questionNumber}</span>
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
                {questionText}
              </p>
            </motion.div>

            <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
              {options.map((optText: string, idx: number) => {
                const opt = OPTION_STYLES[idx] || OPTION_STYLES[0];
                const isSelected = myAnswerIdx === idx;
                const isActualCorrect = correctAnswerIdx === idx;
                const isDimmed = !isActualCorrect && !isSelected;

                let currentGradient = opt.gradient;
                let currentGlow = opt.glow;

                if (isActualCorrect) {
                  currentGradient = "linear-gradient(135deg, #10B981 0%, #059669 100%)";
                  currentGlow = "rgba(16,185,129,0.45)";
                } else if (isSelected) {
                  currentGradient = "linear-gradient(135deg, rgba(239,68,68,0.8) 0%, rgba(185,28,28,0.8) 100%)";
                  currentGlow = "rgba(239,68,68,0.35)";
                }

                return (
                  <motion.button
                    key={idx}
                    disabled
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ 
                      opacity: isDimmed ? 0.3 : 1, 
                      scale: 1 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="flex flex-col items-center justify-center gap-3 relative overflow-hidden"
                    style={{
                      background: currentGradient,
                      borderRadius: 24,
                      cursor: "default",
                      boxShadow: (isSelected || isActualCorrect) ? `0 0 32px ${currentGlow}` : `0 4px 20px ${currentGlow}`,
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
                      {["A", "B", "C", "D"][idx]}
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

                    {isActualCorrect && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-4 right-4 bg-white/25 p-2 rounded-full backdrop-blur-md"
                      >
                        <CheckCircle2 size={24} className="text-white drop-shadow-md" strokeWidth={3} />
                      </motion.div>
                    )}
                    {!isActualCorrect && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-4 right-4 bg-white/25 p-2 rounded-full backdrop-blur-md"
                      >
                        <XCircle size={24} className="text-white drop-shadow-md" strokeWidth={3} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center pb-1 mt-2 mb-4">
              <span className="text-slate-400 font-bold text-xs animate-pulse">Waiting for Professor to continue...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
