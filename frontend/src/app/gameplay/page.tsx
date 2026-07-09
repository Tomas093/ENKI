"use client";
import { motion } from "motion/react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { GlobalLoadingOverlay } from "../components/GlobalLoadingOverlay";
import { useStudentGameplay } from "../../hooks/useStudentGameplay";
import { PageBlobs } from "../../components/ui/PageBlobs";
import { OPTION_STYLES } from "../../lib/game-styles";

export default function ActiveGameplay() {
  const {
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
  } = useStudentGameplay();

  const timerUrgent = timeLeft <= 5;
  const timerPct = (timeLeft / totalTime) * 100;
  const timerColor = timerUrgent ? "var(--color-destructive)" : "var(--color-primary)";
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  const isRevealed = correctAnswerIdx !== null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col w-full max-w-5xl mx-auto gap-5 px-4 pt-6 pb-6"
    >
      {isRevealing && (
        <GlobalLoadingOverlay 
          isVisible={true} 
          message="Revealing your answers on-chain..." 
          subMessage="Please check your wallet to sign the final transaction!" 
        />
      )}

      {/* Decorative background blobs */}
      <PageBlobs primary="purple" secondary="blue" />

      {/* Progress bar */}
      <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden relative shadow-inner">
        <motion.div
          animate={{ 
            width: isRevealed ? "0%" : `${timerPct}%`, 
            backgroundColor: isRevealed ? "#cbd5e1" : timerColor 
          }}
          transition={{ duration: 1, ease: "linear" }}
          className="h-full rounded-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`font-black text-2xl tabular-nums ${timerUrgent && !isRevealed ? 'text-red-500 animate-pulse drop-shadow-sm' : 'text-purple-600'}`}>
            {isRevealed ? "00:00" : `${mm}:${ss}`}
          </div>
        </div>

        <div className="px-5 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
          <span className="font-extrabold text-slate-600 text-sm tracking-wide">
            Question {questionData ? questionData.id + 1 : "?"}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center px-8 py-10 relative z-10"
        style={{ minHeight: 180 }}
      >
        <p className="font-extrabold text-slate-800 text-center leading-snug text-2xl md:text-3xl lg:text-4xl">
          {questionData ? questionData.question : "Loading question..."}
        </p>
      </motion.div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-0 relative z-10 pb-6">
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
              opacity = 0.4;
            }
          } else {
            if (selected !== null && !isSelected) {
              opacity = 0.5;
            } else if (timeLeft <= 0 && !isSelected) {
              opacity = 0.4;
            }
            if (isSelected) scale = 0.98;
          }

          const disableClick = selected !== null || timeLeft <= 0 || isRevealed;

          return (
            <motion.button
              key={idx}
              aria-label={`Option ${["A", "B", "C", "D"][idx]}: ${optText}`}
              onClick={() => handlePick(idx)}
              disabled={disableClick}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity, scale }}
              transition={{ delay: isRevealed ? 0 : 0.12 + idx * 0.06, type: "spring", stiffness: 300, damping: 22 }}
              className="flex flex-col items-center justify-center gap-4 relative overflow-hidden rounded-2xl min-h-[140px] md:min-h-[160px]"
              style={{
                background: currentGradient,
                cursor: disableClick ? "default" : "pointer",
                boxShadow: (isSelected || (isRevealed && isActualCorrect)) ? `0 0 40px ${currentGlow}` : `0 10px 30px ${currentGlow}`,
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)",
                }}
              />

              <div className="flex items-center justify-center font-black relative z-10 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white text-2xl shadow-sm">
                {isPending && isSelected ? (
                  <Loader2 className="animate-spin text-white w-7 h-7" />
                ) : (
                  ["A", "B", "C", "D"][idx]
                )}
              </div>

              <span className="text-white font-extrabold text-center leading-snug px-6 relative z-10 text-lg md:text-xl drop-shadow-md">
                {optText}
              </span>

              {isRevealed && isActualCorrect && (
                <div className="absolute top-5 right-5 bg-white/25 p-2.5 rounded-full backdrop-blur-md shadow-sm">
                  <CheckCircle2 size={28} className="text-white drop-shadow-md" strokeWidth={3} />
                </div>
              )}
              {isRevealed && !isActualCorrect && (
                <div className="absolute top-5 right-5 bg-white/25 p-2.5 rounded-full backdrop-blur-md shadow-sm">
                  <XCircle size={28} className="text-white drop-shadow-md" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-center pb-8 mt-2">
        <span className="bg-slate-100 text-slate-500 font-bold text-sm px-4 py-2 rounded-full shadow-inner">
          Playing as: <span className="text-purple-600">{displayName}</span>
        </span>
      </div>
    </motion.div>
  );
}
