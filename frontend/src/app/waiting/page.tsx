"use client";
import { Hourglass, CheckCircle2, XCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useWaitingRoom } from "../../hooks/useWaitingRoom";
import { PageBlobs } from "../../components/ui/PageBlobs";
import { OPTION_STYLES } from "../../lib/game-styles";

export default function WaitingRoom() {
  const {
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
    router
  } = useWaitingRoom();

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full relative px-4">
      {/* ── EMERGENCY BANNER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBanner && !revealed && (
          <motion.div
            key="emergency-banner"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 gap-4 bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="text-3xl flex-shrink-0 drop-shadow-sm"
              >
                🚨
              </motion.span>
              <p className="text-white font-extrabold truncate text-sm md:text-base drop-shadow-sm">
                Emergency: Professor inactive for over <span className="underline decoration-2 underline-offset-2">12 hours!</span>
              </p>
            </div>
            
            <button
              onClick={() => router.push("/emergency-refund")}
              className="flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 font-black shrink-0 transition-all hover:scale-105 active:scale-95 px-5 py-2.5 rounded-xl shadow-sm text-sm"
            >
              Rescue Your Funds →
            </button>

            <button
              onClick={() => setShowBanner(false)}
              aria-label="Dismiss banner"
              className="text-white/70 hover:text-white transition-colors p-2"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative background blobs */}
      <PageBlobs primary="purple" secondary="blue" />

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="bg-white p-10 md:p-14 rounded-2xl border border-slate-200 shadow-sm max-w-2xl w-full text-center flex flex-col items-center relative z-10"
            style={{ transform: `translateY(${showBanner ? 68 : 0}px)`, transition: "transform 0.3s" }}
          >
            <motion.div
              animate={{ rotate: [0, 180, 180, 360] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.45, 0.55, 1] }}
              className="w-28 h-28 bg-blue-50 text-blue-500 rounded-[28px] flex items-center justify-center mb-8 border border-blue-100 shadow-sm"
            >
              <Hourglass size={56} strokeWidth={2} />
            </motion.div>

            <h1 className="font-extrabold text-slate-800 mb-4 tracking-tight text-3xl md:text-4xl">
              {isRevealing ? "Revealing on-chain..." : "Answer Locked Securely!"}
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed text-lg max-w-sm">
              {isRevealing 
                ? "Submitting your decryption key to the Smart Contract..."
                : "Waiting for the Professor to close the question on-chain..."}
            </p>

            <div className="flex items-center gap-2.5 mt-8">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  className="w-3.5 h-3.5 rounded-full bg-blue-400 shadow-sm"
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="feedback-gameplay-style"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col w-full max-w-4xl gap-6 relative z-10 py-8"
          >
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <div className="flex items-center gap-2 px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">
                    <CheckCircle2 className="text-emerald-500" size={20} strokeWidth={3} />
                    <span className="font-black text-emerald-600 text-sm tracking-wide">+1 Point</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-2 bg-red-50 border border-red-100 rounded-full shadow-sm">
                    <XCircle className="text-red-500" size={20} strokeWidth={3} />
                    <span className="font-black text-red-600 text-sm tracking-wide">Incorrect</span>
                  </div>
                )}
              </div>

              <div className="px-5 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
                <span className="font-extrabold text-slate-600 text-sm">Question {questionNumber}</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center px-8 py-10 min-h-[160px]"
            >
              <p className="font-extrabold text-slate-800 text-center leading-snug text-2xl md:text-3xl max-w-3xl">
                {questionText}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    aria-label={`Option ${["A", "B", "C", "D"][idx]}: ${optText}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ 
                      opacity: isDimmed ? 0.35 : 1, 
                      scale: 1 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="flex flex-col items-center justify-center gap-4 relative overflow-hidden rounded-2xl min-h-[160px]"
                    style={{
                      background: currentGradient,
                      cursor: "default",
                      boxShadow: (isSelected || isActualCorrect) ? `0 0 40px ${currentGlow}` : `0 10px 30px ${currentGlow}`,
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-overlay"
                      style={{
                         background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)",
                      }}
                    />
                    
                    <div className="flex items-center justify-center font-black relative z-10 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md text-white text-xl">
                      {["A", "B", "C", "D"][idx]}
                    </div>
                    
                    <span className="text-white font-extrabold text-center leading-snug px-6 relative z-10 text-lg md:text-xl drop-shadow-md">
                      {optText}
                    </span>

                    {isActualCorrect && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-5 right-5 bg-white/25 p-2.5 rounded-full backdrop-blur-md"
                      >
                        <CheckCircle2 size={26} className="text-white drop-shadow-md" strokeWidth={3} />
                      </motion.div>
                    )}
                    {!isActualCorrect && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-5 right-5 bg-white/25 p-2.5 rounded-full backdrop-blur-md"
                      >
                        <XCircle size={26} className="text-white drop-shadow-md" strokeWidth={3} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center pb-4 mt-6">
              <span className="text-slate-400 font-bold text-sm animate-pulse tracking-wide">Waiting for Professor to continue...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
