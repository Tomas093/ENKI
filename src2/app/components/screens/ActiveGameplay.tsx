import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

const QUESTION = {
  text: "¿Qué significa ERC-20 en Ethereum?",
  options: [
    { label: "A", color: "#E21B3C", border: "#9b0026", text: "Ethereum Request for Comment 20" },
    { label: "B", color: "#1368CE", border: "#0a4a99", text: "Ethereum Reserve Coin 20" },
    { label: "C", color: "#D97706", border: "#9a5300", text: "Electronic Record Contract 20" },
    { label: "D", color: "#26890C", border: "#165a05", text: "Extended Runtime Code 20" },
  ],
};

export const ActiveGameplay = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answersIn, setAnswersIn] = useState(14);
  const navigate = useNavigate();

  useEffect(() => {
    if (selected !== null || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((n) => Math.max(0, n - 1));
      setAnswersIn((n) => Math.min(n + Math.floor(Math.random() * 2), 47));
    }, 1000);
    return () => clearInterval(t);
  }, [selected, timeLeft]);

  const handlePick = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => navigate("/waiting"), 3000);
  };

  const timerUrgent = timeLeft <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col w-full"
      style={{ height: "calc(100vh - 88px)" }}
    >
      {/* Question card */}
      <div className="bg-white rounded-[20px] border-4 border-slate-200 shadow-sm px-5 py-3 mb-3 flex items-center gap-4">
        {/* Timer */}
        <div
          className="flex items-center gap-2 rounded-[12px] px-4 py-2 shrink-0 transition-all"
          style={{
            background: timerUrgent ? "rgba(239,68,68,0.1)" : "rgba(124,58,237,0.08)",
            border: `2px solid ${timerUrgent ? "rgba(239,68,68,0.4)" : "rgba(124,58,237,0.25)"}`,
          }}
        >
          <span style={{ fontSize: 16 }}>{timerUrgent ? "🔴" : "⏱️"}</span>
          <span
            className="font-extrabold tabular-nums"
            style={{
              fontSize: 20,
              color: timerUrgent ? "#EF4444" : "#7C3AED",
              fontFamily: "'Nunito', sans-serif",
              minWidth: 44,
            }}
          >
            {timeLeft}s
          </span>
        </div>

        {/* Question text */}
        <p
          className="flex-1 text-center font-extrabold text-slate-800 leading-snug m-0"
          style={{ fontSize: "clamp(13px, 1.5vw, 18px)", fontFamily: "'Nunito', sans-serif" }}
        >
          {QUESTION.text}
        </p>

        {/* Answers in */}
        <div
          className="flex items-center gap-2 rounded-[12px] px-4 py-2 shrink-0"
          style={{ background: "rgba(16,185,129,0.08)", border: "2px solid rgba(16,185,129,0.3)" }}
        >
          <span style={{ fontSize: 16 }}>💬</span>
          <span
            className="font-extrabold"
            style={{ fontSize: 18, color: "#10B981", fontFamily: "'Nunito', sans-serif", minWidth: 60, textAlign: "right" }}
          >
            {answersIn} / 47
          </span>
        </div>
      </div>

      {/* 4-button grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {QUESTION.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handlePick(idx)}
            disabled={selected !== null}
            className="flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden"
            style={{
              background: opt.color,
              borderRadius: 20,
              borderBottom: `6px solid ${opt.border}`,
              cursor: selected !== null ? "default" : "pointer",
              opacity: selected !== null && selected !== idx ? 0.6 : 1,
              transform: selected === idx ? "translateY(6px)" : "translateY(0)",
            }}
            onMouseEnter={(e) => { if (selected === null) (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
          >
            {/* Label badge */}
            <div
              className="flex items-center justify-center font-black"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(255,255,255,0.25)",
                color: "white",
                fontSize: 22,
                fontFamily: "'Nunito', sans-serif",
                flexShrink: 0,
              }}
            >
              {opt.label}
            </div>

            {/* Answer text */}
            <span
              className="text-white font-extrabold text-center leading-snug px-4"
              style={{
                fontSize: "clamp(13px, 1.8vw, 20px)",
                fontFamily: "'Nunito', sans-serif",
                textShadow: "0 2px 6px rgba(0,0,0,0.2)",
                maxWidth: "90%",
              }}
            >
              {opt.text}
            </span>
          </button>
        ))}
      </div>

      {/* Web3 signing overlay */}
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
              <h2 className="font-extrabold text-slate-800 mb-2" style={{ fontSize: 26, fontFamily: "'Nunito', sans-serif" }}>
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
