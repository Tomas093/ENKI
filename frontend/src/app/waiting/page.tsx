"use client";
import { useState, useEffect } from "react";
import { Hourglass, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";

export default function WaitingRoom() {
  const [revealed, setRevealed] = useState(false);
  const [isCorrect] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show emergency banner after 3 seconds (demo)
    const bannerTimer = setTimeout(() => setShowBanner(true), 3000);

    // Simulate professor revealing answer after 8 seconds
    const revealTimer = setTimeout(() => {
      setRevealed(true);
      setTimeout(() => router.push("/leaderboard"), 4000);
    }, 8000);

    return () => {
      clearTimeout(bannerTimer);
      clearTimeout(revealTimer);
    };
  }, [router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full z-10 relative">

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
              Answer Locked Securely!
            </h1>
            <p
              className="text-slate-500 font-bold leading-relaxed"
              style={{ fontSize: "clamp(15px, 2vw, 20px)", fontFamily: "'Nunito', sans-serif", maxWidth: 380 }}
            >
              Waiting for the Professor to reveal the correct answer on-chain...
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
            key="feedback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`fixed inset-0 z-50 flex items-center justify-center flex-col p-8 ${
              isCorrect ? "bg-[#10B981]" : "bg-red-500"
            }`}
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
              <p
                className="font-extrabold text-white"
                style={{ fontSize: 28, fontFamily: "'Nunito', sans-serif" }}
              >
                {isCorrect ? "+850 Points" : "+0 Points"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
