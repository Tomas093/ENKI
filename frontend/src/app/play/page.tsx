"use client";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

const QUESTION = {
  text: "What does 'ERC-20' stand for in Ethereum?",
  correct: 0,
  options: [
    { label: "A", shape: "▲", color: "#E21B3C", text: "Ethereum Request for Comment 20" },
    { label: "B", shape: "◆", color: "#1368CE", text: "Ethereum Reserve Coin 20" },
    { label: "C", shape: "●", color: "#D97706", text: "Electronic Record Contract 20" },
    { label: "D", shape: "■", color: "#26890C", text: "Extended Runtime Code 20" },
  ],
};

const BORDER_RADII = [
  "20px 0 0 0",
  "0 20px 0 0",
  "0 0 0 20px",
  "0 0 20px 0",
];

type Phase = "pick" | "result";

export default function StudentGame() {
  const [timeLeft, setTimeLeft] = useState(20);
  const [answersIn, setAnswersIn] = useState(14);
  const [phase, setPhase] = useState<Phase>("pick");
  const [selected, setSelected] = useState<number | null>(null);

  // Tick timer and simulate incoming answers
  useEffect(() => {
    if (phase !== "pick") return;
    if (timeLeft <= 0) { setPhase("result"); return; }
    const t = setInterval(() => {
      setTimeLeft((n) => n - 1);
      setAnswersIn((n) => Math.min(n + Math.floor(Math.random() * 3), 47));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  const handlePick = (idx: number) => {
    if (phase !== "pick") return;
    setSelected(idx);
    setPhase("result");
  };

  const resetGame = () => {
    setTimeLeft(20);
    setAnswersIn(14);
    setPhase("pick");
    setSelected(null);
  };

  const isCorrect = selected === QUESTION.correct;
  const timerUrgent = timeLeft <= 5;

  // ─── RESULT PHASE ────────────────────────────────────────────────────────────
  if (phase === "result") {
    return (
      <div
        style={{
          width: "100%",
          height: "calc(100vh - 130px)",
          display: "flex",
          flexDirection: "column",
          background: "#1a1a2e",
          overflow: "hidden",
        }}
      >
        {/* 4-button result grid */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: "6px",
              padding: "6px",
              height: "100%",
            }}
          >
            {QUESTION.options.map((opt, idx) => {
              const wasSelected = selected === idx;
              const isAnswerCorrect = idx === QUESTION.correct;

              let bg: string;
              let contentColor: string;
              let showCheck = false;

              if (isCorrect) {
                if (wasSelected) {
                  bg = "#10B981";
                  contentColor = "white";
                  showCheck = true;
                } else {
                  bg = "#FFFFFF";
                  contentColor = "#9ca3af";
                }
              } else {
                if (wasSelected) {
                  bg = "#EF4444";
                  contentColor = "white";
                } else if (isAnswerCorrect) {
                  bg = "#10B981";
                  contentColor = "white";
                  showCheck = true;
                } else {
                  bg = "#FFFFFF";
                  contentColor = "#d1d5db";
                }
              }

              return (
                <div
                  key={idx}
                  style={{
                    background: bg,
                    borderRadius: BORDER_RADII[idx],
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    position: "relative",
                    border: bg === "#FFFFFF" ? "2px solid #E5E7EB" : "none",
                    transition: "background 0.4s ease",
                  }}
                >
                  <span style={{ fontSize: "clamp(28px, 4vw, 52px)", lineHeight: 1, color: contentColor, opacity: bg === "#FFFFFF" ? 0.4 : 1 }}>
                    {opt.shape}
                  </span>
                  <span
                    style={{
                      color: contentColor,
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(12px, 1.6vw, 18px)",
                      textAlign: "center",
                      padding: "0 16px",
                      maxWidth: "80%",
                      lineHeight: 1.3,
                    }}
                  >
                    {opt.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action bar */}
        <div
          style={{
            background: "#1a1a2e",
            borderTop: "2px solid rgba(255,255,255,0.08)",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            height: "56px",
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
            47 / 47 answered
          </div>
          <button
            onClick={resetGame}
            style={{
              background: "#7C3AED",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottom: "3px solid #3b0764",
              borderRadius: "10px",
              padding: "6px 20px",
              color: "white",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Next Question →
          </button>
        </div>
      </div>
    );
  }

  // ─── PICK PHASE ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh - 130px)",
        display: "flex",
        flexDirection: "column",
        background: "#1a1a2e",
        overflow: "hidden",
      }}
    >
      {/* Top header bar */}
      <div
        style={{
          background: "#1a1a2e",
          padding: "12px 24px",
          borderBottom: "2px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        {/* Timer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: timerUrgent ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
            border: timerUrgent ? "2px solid rgba(239,68,68,0.4)" : "2px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "8px 18px",
            transition: "all 0.3s ease",
          }}
        >
          <span style={{ fontSize: "18px" }}>{timerUrgent ? "🔴" : "⏱️"}</span>
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: "22px",
              color: timerUrgent ? "#EF4444" : "white",
              letterSpacing: "-0.02em",
              transition: "color 0.3s ease",
              minWidth: "60px",
            }}
          >
            {timeLeft}s left
          </span>
        </div>

        {/* Question text — center */}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            padding: "0 20px",
          }}
        >
          <p
            style={{
              color: "white",
              fontSize: "clamp(13px, 1.4vw, 17px)",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.4,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {QUESTION.text}
          </p>
        </div>

        {/* Answers in */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(16,185,129,0.12)",
            border: "2px solid rgba(16,185,129,0.3)",
            borderRadius: "14px",
            padding: "8px 18px",
          }}
        >
          <span style={{ fontSize: "18px" }}>💬</span>
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: "20px",
              color: "#10B981",
              minWidth: "80px",
              textAlign: "right",
            }}
          >
            {answersIn} In
          </span>
        </div>
      </div>

      {/* 4-button grid */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "6px",
            padding: "6px",
            height: "100%",
          }}
        >
          {QUESTION.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handlePick(idx)}
              style={{
                background: opt.color,
                borderRadius: BORDER_RADII[idx],
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "filter 0.1s ease, transform 0.1s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <span style={{ fontSize: "clamp(32px, 5vw, 64px)", lineHeight: 1, color: "rgba(255,255,255,0.95)" }}>
                {opt.shape}
              </span>
              <span
                style={{
                  color: "white",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(13px, 1.8vw, 22px)",
                  textAlign: "center",
                  padding: "0 20px",
                  textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  maxWidth: "85%",
                  lineHeight: 1.3,
                }}
              >
                {opt.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
