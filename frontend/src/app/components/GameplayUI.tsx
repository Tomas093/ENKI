"use client";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Clock, Loader2, LifeBuoy } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalLoadingOverlay } from "./GlobalLoadingOverlay";

const OPTION_COLORS = [
  { bg: "#FF6B00", label: "A" }, // Brutalist Orange
  { bg: "#33CCFF", label: "B" }, // Cyan
  { bg: "#FFE234", label: "C" }, // Yellow
  { bg: "#B05BFF", label: "D" }, // Purple
];

export interface GameplayUIProps {
  selected: number | null;
  questionData: {
    id: number;
    question: string;
    options: string[];
  } | null;
  timeLeft: number;
  totalTime: number;
  correctAnswerIdx: number | null;
  isRevealing: boolean;
  isCorrect: boolean;
  displayName: string;
  isPending?: boolean;
  handlePick: (idx: number) => void;
}

export function GameplayUI({
  selected,
  questionData,
  timeLeft,
  totalTime,
  correctAnswerIdx,
  isRevealing,
  isCorrect,
  displayName,
  isPending = false,
  handlePick,
  gameAddress,
}: GameplayUIProps & { gameAddress?: string }) {
  const router = useRouter();
  const hasAnswered = selected !== null && selected !== undefined;
  const isRevealed = correctAnswerIdx !== null;
  const timerPct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const timerUrgent = timeLeft <= 5 && !hasAnswered;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user has already answered, or is typing in some potential input elsewhere (though unlikely here)
      if (hasAnswered || isRevealed) return;
      
      const key = e.key.toLowerCase();
      let pickedIdx = -1;
      
      if (key === "a" || key === "1") pickedIdx = 0;
      if (key === "b" || key === "2") pickedIdx = 1;
      if (key === "c" || key === "3") pickedIdx = 2;
      if (key === "d" || key === "4") pickedIdx = 3;

      if (pickedIdx >= 0 && questionData?.options && pickedIdx < questionData.options.length) {
        handlePick(pickedIdx);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasAnswered, isRevealed, questionData, handlePick]);

  return (
    <div className="flex-1 flex flex-col w-full bg-[#F4F4F0] min-h-0 relative">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }}
      />

      {isRevealing && (
        <GlobalLoadingOverlay
          isVisible={true}
          message="Revealing your answers on-chain..."
          subMessage="Please check your wallet to sign the final transaction!"
        />
      )}

      <div className="relative z-10 flex flex-col h-full w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-4 pb-8 gap-6">
        {/* ── TOP BAR: Timer + Question counter ── */}
        <div className="flex items-center gap-4">
          {/* Timer block */}
          <div
            aria-live={timerUrgent ? "assertive" : "polite"}
            aria-atomic="true"
            className={`flex items-center gap-2 border-2 border-black px-4 py-2 font-black text-[22px] tabular-nums shadow-[3px_3px_0px_#000] transition-colors ${
              hasAnswered
                ? "bg-gray-200 text-gray-400"
                : timerUrgent
                ? "bg-[#FF3366] text-white animate-pulse"
                : "bg-white text-black"
            }`}
          >
            <Clock size={18} strokeWidth={3} />
            <span className="sr-only">
              {hasAnswered ? "Answer submitted" : timerUrgent ? `${timeLeft} seconds left, hurry!` : `${timeLeft} seconds remaining`}
            </span>
            <span aria-hidden="true">{hasAnswered ? "—:——" : `${mm}:${ss}`}</span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 h-5 bg-white border-2 border-black shadow-[3px_3px_0px_#000] overflow-hidden">
            <motion.div
              className="h-full transition-colors"
              animate={{
                width: hasAnswered ? "100%" : `${timerPct}%`,
                backgroundColor: hasAnswered ? "#39FF14" : timerUrgent ? "#FF3366" : "#000",
              }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>

          {/* Q counter */}
          <div className="bg-black text-white border-2 border-black px-4 py-2 font-black text-[14px] uppercase tracking-wide shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
            Q {questionData ? questionData.id + 1 : "?"}
          </div>
        </div>

        {/* ── QUESTION CARD ── */}
        <motion.div
          key={questionData?.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] px-8 py-10 md:py-14 relative mx-auto w-full max-w-5xl"
        >
          <div className="absolute -top-4 -left-4 bg-[#FFE234] border-2 border-black px-3 py-1 font-black text-sm uppercase tracking-wide shadow-[2px_2px_0px_#000]">
            Question
          </div>
          <p className="font-black text-black text-center leading-snug text-2xl md:text-3xl">
            {questionData ? questionData.question : "Loading..."}
          </p>
        </motion.div>

        {/* ── ANSWER OPTIONS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2 gap-4 md:gap-6 flex-1 w-full min-h-[400px]">
          {questionData &&
            questionData.options.map((optText: string, idx: number) => {
              const opt = OPTION_COLORS[idx];
              const isSelected = selected === idx;
              const isActualCorrect = correctAnswerIdx === idx;
              const isWrongSelected = isRevealed && isSelected && !isActualCorrect;
              const isCorrectOption = isRevealed && isActualCorrect;
              const isNeutral = isRevealed && !isActualCorrect && !isSelected;
              const isDisabled = hasAnswered || isRevealed;

              return (
                <motion.button
                  key={idx}
                  onClick={() => handlePick(idx)}
                  disabled={!!isDisabled}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{
                    opacity: isNeutral ? 0.3 : 1,
                    scale: isSelected && !isRevealed ? 0.97 : 1,
                  }}
                  transition={{ delay: 0.05 + idx * 0.06, type: "spring", stiffness: 400, damping: 28 }}
                  whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isDisabled ? { scale: 0.97 } : {}}
                  className="relative flex items-center gap-6 border-4 border-black px-6 md:px-10 py-6 md:py-10 text-left transition-all h-full min-h-[140px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3366]"
                  style={{
                    backgroundColor: isCorrectOption
                      ? "#39FF14" // Correct stays bright green
                      : isWrongSelected
                      ? "#FF3366" // Wrong stays bright red
                      : isSelected && !isRevealed
                      ? opt.bg
                      : opt.bg,
                    boxShadow: isSelected || isCorrectOption
                      ? "none"
                      : isDisabled
                      ? "none"
                      : "8px 8px 0px #000",
                    transform:
                      isSelected || isCorrectOption ? "translate(6px, 6px)" : undefined,
                    cursor: isDisabled ? "default" : "pointer",
                  }}
                >
                  {/* Letter badge (Original Style, White Background) */}
                  <div className="w-14 h-14 md:w-20 md:h-20 border-4 border-black bg-white text-black font-black text-[24px] md:text-[36px] flex items-center justify-center shrink-0 shadow-[4px_4px_0px_#000]">
                    {isPending && isSelected ? (
                      <Loader2 className="animate-spin w-8 h-8 md:w-10 md:h-10" />
                    ) : (
                      opt.label
                    )}
                  </div>

                  {/* Text (Original Style) */}
                  <span className="font-black text-black text-[22px] md:text-[36px] lg:text-[44px] leading-[1.1] flex-1 break-words">
                    {optText}
                  </span>

                  {/* Result icons */}
                  {isCorrectOption && (
                    <div className="shrink-0">
                      <CheckCircle2 size={40} strokeWidth={4} className="text-black" />
                    </div>
                  )}
                  {isWrongSelected && (
                    <div className="shrink-0">
                      <XCircle size={40} strokeWidth={4} className="text-black" />
                    </div>
                  )}
                </motion.button>
              );
            })}
        </div>

        {/* ── STATUS OVERLAY ── */}
        <AnimatePresence mode="wait">
          {isRevealed ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className={`border-4 border-black p-5 flex items-center justify-center gap-4 shadow-[6px_6px_0px_#000] ${
                isCorrect ? "bg-[#39FF14]" : "bg-[#FF3366]"
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 size={32} strokeWidth={3} className="text-black shrink-0" />
                  <div>
                    <p className="font-black text-black text-[20px] uppercase tracking-tight leading-none">Correct!</p>
                    <p className="font-bold text-black/80 text-[13px] uppercase tracking-wide mt-1">Waiting for the next question...</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={32} strokeWidth={3} className="text-black shrink-0" />
                  <div>
                    <p className="font-black text-black text-[20px] uppercase tracking-tight leading-none">
                      {selected === -1 || selected === null ? "Time's Up!" : "Wrong!"}
                    </p>
                    <p className="font-bold text-black/80 text-[13px] uppercase tracking-wide mt-1">Waiting for the next question...</p>
                  </div>
                </>
              )}
            </motion.div>
          ) : hasAnswered ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="border-4 border-black bg-white p-4 flex items-center justify-center gap-3 shadow-[6px_6px_0px_#000]"
            >
              <div className="flex items-end gap-1 shrink-0">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 border-2 border-black bg-black"
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </div>
              <p className="font-black text-black text-[15px] uppercase tracking-wide">
                Answer locked in — waiting for host
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>


        {/* ── EMERGENCY REFUND LINK ── */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
          <button
            onClick={() => router.push(gameAddress ? `/emergency-refund?game=${gameAddress}` : "/emergency-refund")}
            className="flex items-center gap-2 font-black text-[11px] uppercase tracking-widest text-black/40 hover:text-black hover:bg-[#FFE234] border-2 border-transparent hover:border-black hover:shadow-[3px_3px_0px_#000] px-3 py-1.5 transition-all"
            title="Host Abandoned? Claim Refund"
          >
            <LifeBuoy size={14} strokeWidth={3} />
            <span className="hidden md:inline">Emergency Refund</span>
          </button>
        </div>

      </div>
    </div>
  );
}
