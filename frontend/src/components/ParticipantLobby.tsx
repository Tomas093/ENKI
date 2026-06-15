import React, { useState, useEffect } from "react";
import { Users, Coins, Trophy, Clock, AlertTriangle, ShieldAlert, CheckCircle2, Circle, ArrowRight } from "lucide-react";

type Phase = "waiting" | "commit" | "reveal" | "results";

const QUESTIONS = [
  {
    id: 1,
    text: "In Ethereum's Proof of Stake, what is the minimum amount of ETH required to become a validator?",
    options: ["16 ETH", "32 ETH", "64 ETH", "128 ETH"],
    correct: 1,
  },
  {
    id: 2,
    text: "Which consensus mechanism does Ethereum currently use after 'The Merge'?",
    options: ["Proof of Work", "Proof of Authority", "Proof of Stake", "Delegated PoS"],
    correct: 2,
  },
  {
    id: 3,
    text: "What is the name of Ethereum's Virtual Machine used to execute smart contracts?",
    options: ["BVM", "EVM", "SVM", "WVM"],
    correct: 1,
  },
];

const OPTION_COLORS = [
  { bg: "rgba(99,102,241,0.14)", border: "rgba(99,102,241,0.55)", glow: "rgba(99,102,241,0.3)", label: "A", accent: "#6366F1" },
  { bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.5)", glow: "rgba(6,182,212,0.3)", label: "B", accent: "#06B6D4" },
  { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.5)", glow: "rgba(249,115,22,0.3)", label: "C", accent: "#F97316" },
  { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.5)", glow: "rgba(16,185,129,0.3)", label: "D", accent: "#10B981" },
];

export function ParticipantLobby() {
  const [phase, setPhase] = useState<Phase>("commit");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(45);
  const [afkCountdown, setAfkCountdown] = useState(31 * 60); // 31 min for demo
  const [showAfk, setShowAfk] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [committed, setCommitted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const REFUND_THRESHOLD = 30 * 60; // 30 min
  const refundActive = afkCountdown <= REFUND_THRESHOLD;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (afkCountdown <= 0) return;
    const t = setTimeout(() => setAfkCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [afkCountdown]);

  const formatAfk = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const question = QUESTIONS[questionIndex];
  const timerPct = (countdown / 45) * 100;
  // Timer uses orange as alert color
  const timerColor = countdown > 20 ? "#06B6D4" : countdown > 10 ? "#F97316" : "#ef4444";

  const handleCommit = () => {
    if (selectedAnswer === null) return;
    setCommitted(true);
    setTimeout(() => setPhase("reveal"), 1500);
  };

  const handleReveal = () => {
    setRevealed(true);
    setPhase("results");
  };

  const nextQuestion = () => {
    setQuestionIndex((i) => Math.min(i + 1, QUESTIONS.length - 1));
    setPhase("commit");
    setCommitted(false);
    setRevealed(false);
    setSelectedAnswer(null);
    setCountdown(45);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="space-y-5">

      {/* AFK Circuit Breaker Banner */}
      {showAfk && (
        <div
          style={{
            background: refundActive
              ? "linear-gradient(135deg, rgba(249,115,22,0.13) 0%, rgba(22,27,38,0.9) 100%)"
              : "linear-gradient(135deg, rgba(30,37,53,0.8) 0%, rgba(22,27,38,0.8) 100%)",
            border: refundActive
              ? "1px solid rgba(249,115,22,0.45)"
              : "1px solid rgba(99,102,241,0.18)",
            boxShadow: refundActive
              ? "0 0 28px rgba(249,115,22,0.12), inset 0 0 28px rgba(249,115,22,0.04)"
              : "none",
            transition: "all 0.5s ease",
          }}
          className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              style={{
                background: refundActive ? "rgba(249,115,22,0.15)" : "rgba(99,102,241,0.08)",
                border: refundActive ? "1px solid rgba(249,115,22,0.4)" : "1px solid rgba(99,102,241,0.2)",
                transition: "all 0.5s ease",
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${refundActive ? "animate-pulse" : ""}`}
            >
              <ShieldAlert
                size={20}
                style={{ color: refundActive ? "#F97316" : "#64748b", transition: "color 0.5s ease" }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  style={{ color: refundActive ? "#fb923c" : "#94a3b8", transition: "color 0.5s ease" }}
                  className="font-semibold text-sm"
                >
                  AFK CIRCUIT BREAKER
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: refundActive ? "rgba(249,115,22,0.2)" : "rgba(99,102,241,0.1)",
                    border: refundActive ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(99,102,241,0.25)",
                    color: refundActive ? "#fdba74" : "#818cf8",
                    transition: "all 0.5s ease",
                  }}
                  className="text-xs px-2 py-0.5 rounded-full"
                >
                  {refundActive ? "TRIGGERED" : "MONITORING"}
                </span>
              </div>
              <p className="text-[#64748b] text-xs mt-0.5">
                {refundActive
                  ? "Professor inactive — refund window is now open. Claim before it closes."
                  : "Professor inactive. Refund window opens when ≤ 30 min remain."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-0 sm:ml-auto">
            {/* Countdown */}
            <div className="text-center">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: refundActive ? "#F97316" : "#94a3b8",
                  textShadow: refundActive ? "0 0 14px rgba(249,115,22,0.6)" : "none",
                  transition: "all 0.5s ease",
                }}
                className="text-2xl font-bold tabular-nums"
              >
                {formatAfk(afkCountdown)}
              </div>
              <div className="text-[#64748b] text-xs">
                {refundActive ? "until window closes" : "until refund opens"}
              </div>
            </div>

            {/* Progress bar when locked */}
            {!refundActive && (
              <div className="hidden sm:flex flex-col gap-1 w-24">
                <div className="text-[#64748b] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {Math.round(((afkCountdown - REFUND_THRESHOLD) / REFUND_THRESHOLD) * 100)}% remaining
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, ((afkCountdown - REFUND_THRESHOLD) / REFUND_THRESHOLD) * 100)}%`,
                      background: "#475569",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Claim Refund button */}
            <button
              disabled={!refundActive}
              style={
                refundActive
                  ? {
                      background: "linear-gradient(135deg, #ea6c0a 0%, #c2590a 100%)",
                      boxShadow: "0 0 22px rgba(249,115,22,0.45)",
                      border: "1px solid rgba(249,115,22,0.6)",
                      color: "#ffffff",
                      cursor: "pointer",
                    }
                  : {
                      background: "rgba(22,27,38,0.7)",
                      border: "1px solid rgba(99,102,241,0.15)",
                      color: "#374151",
                      cursor: "not-allowed",
                      boxShadow: "none",
                    }
              }
              className="px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-500"
            >
              <AlertTriangle size={14} />
              Claim Refund
            </button>

            <button
              onClick={() => setShowAfk(false)}
              className="text-[#64748b] hover:text-[#94a3b8] text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Game Info Card */}
        <div
          style={{
            background: "#161B26",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
          className="rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3
              style={{ fontFamily: "'Rajdhani', sans-serif", color: "#818cf8", letterSpacing: "0.08em" }}
              className="text-sm font-semibold uppercase"
            >
              Game Info
            </h3>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: "rgba(6,182,212,0.12)",
                border: "1px solid rgba(6,182,212,0.3)",
                color: "#06B6D4",
              }}
              className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="space-y-3">
            <StatRow
              icon={<Trophy size={14} style={{ color: "#F97316" }} />}
              label="Prize Pool"
              value="2.400 ETH"
              valueStyle={{ color: "#F97316", fontFamily: "'JetBrains Mono', monospace" }}
            />
            <StatRow
              icon={<Coins size={14} style={{ color: "#818cf8" }} />}
              label="Entry Fee"
              value="0.050 ETH"
              valueStyle={{ color: "#818cf8", fontFamily: "'JetBrains Mono', monospace" }}
            />
            <StatRow
              icon={<Users size={14} style={{ color: "#06B6D4" }} />}
              label="Players"
              value="47 / 64"
              valueStyle={{ color: "#06B6D4", fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>

          {/* Prize breakdown bars */}
          <div
            style={{ border: "1px solid rgba(99,102,241,0.15)", background: "rgba(99,102,241,0.04)" }}
            className="rounded-lg p-3 space-y-2"
          >
            <div className="text-[#64748b] text-xs mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              PRIZE DISTRIBUTION
            </div>
            {[
              { label: "1st", pct: 60, color: "#F97316" },
              { label: "2nd", pct: 20, color: "#94a3b8" },
              { label: "3rd", pct: 10, color: "#06B6D4" },
              { label: "Prof", pct: 10, color: "#6366F1" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="w-8 text-[10px] text-[#64748b]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {r.label}
                </span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${r.pct}%`, background: r.color, boxShadow: `0 0 6px ${r.color}80` }}
                  />
                </div>
                <span className="text-[10px]" style={{ color: r.color, fontFamily: "'JetBrains Mono', monospace" }}>
                  {r.pct}%
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t" style={{ borderColor: "rgba(99,102,241,0.15)" }}>
            <div className="text-[#64748b] text-xs mb-1">Your Status</div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#06B6D4]" />
              <span style={{ color: "#06B6D4" }} className="text-sm">Joined — Stake Locked</span>
            </div>
          </div>
        </div>

        {/* Live Question Panel */}
        <div
          style={{
            background: "#161B26",
            border: "1px solid rgba(99,102,241,0.25)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35), 0 0 40px rgba(99,102,241,0.07)",
          }}
          className="lg:col-span-2 rounded-xl p-5 space-y-4"
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                style={{ fontFamily: "'Rajdhani', sans-serif", color: "#818cf8", letterSpacing: "0.08em" }}
                className="text-sm font-semibold uppercase"
              >
                Question {questionIndex + 1}/{QUESTIONS.length}
              </span>
              <PhaseBadge phase={phase} committed={committed} />
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: timerColor }} />
              <div className="relative w-28">
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-1000"
                    style={{
                      width: `${timerPct}%`,
                      background: timerColor,
                      boxShadow: `0 0 8px ${timerColor}`,
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: timerColor,
                  minWidth: "2rem",
                  textShadow: `0 0 8px ${timerColor}80`,
                }}
                className="text-sm font-semibold tabular-nums"
              >
                {countdown}s
              </span>
            </div>
          </div>

          {/* Question text */}
          <div
            style={{
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.18)",
            }}
            className="rounded-lg p-4"
          >
            <p style={{ color: "#F8FAFC" }} className="text-base leading-relaxed">{question.text}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((opt, i) => {
              const col = OPTION_COLORS[i];
              const isSelected = selectedAnswer === i;
              const isCorrect = phase === "results" && i === question.correct;
              const isWrong = phase === "results" && isSelected && i !== question.correct;

              return (
                <button
                  key={i}
                  disabled={phase !== "commit" || committed}
                  onClick={() => setSelectedAnswer(i)}
                  style={{
                    background: isCorrect
                      ? "rgba(6,182,212,0.18)"
                      : isWrong
                      ? "rgba(249,115,22,0.15)"
                      : isSelected
                      ? col.bg
                      : "rgba(255,255,255,0.03)",
                    border: isCorrect
                      ? "1px solid rgba(6,182,212,0.6)"
                      : isWrong
                      ? "1px solid rgba(249,115,22,0.5)"
                      : isSelected
                      ? `1px solid ${col.border}`
                      : "1px solid rgba(255,255,255,0.07)",
                    boxShadow: isSelected && !phase.includes("result") ? `0 0 12px ${col.glow}` : "none",
                    transition: "all 0.15s ease",
                    cursor: phase !== "commit" || committed ? "not-allowed" : "pointer",
                    opacity: phase !== "commit" || committed ? (isSelected || isCorrect ? 1 : 0.45) : 1,
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-lg text-left"
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: isSelected ? col.accent : "rgba(255,255,255,0.06)",
                      color: isSelected ? "#fff" : "#64748b",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      fontSize: "11px",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {col.label}
                  </span>
                  <span style={{ color: "#F8FAFC" }} className="text-sm flex-1">{opt}</span>
                  {isCorrect && <CheckCircle2 size={16} className="text-[#06B6D4] shrink-0" />}
                  {isWrong && <Circle size={16} className="text-[#F97316] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            {phase === "commit" && !committed && (
              <button
                onClick={handleCommit}
                disabled={selectedAnswer === null}
                style={{
                  background:
                    selectedAnswer !== null
                      ? "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)"
                      : "rgba(99,102,241,0.15)",
                  boxShadow: selectedAnswer !== null ? "0 0 16px rgba(99,102,241,0.35)" : "none",
                  border: "1px solid rgba(99,102,241,0.4)",
                  color: selectedAnswer !== null ? "#fff" : "#4b5563",
                  transition: "all 0.2s ease",
                  cursor: selectedAnswer === null ? "not-allowed" : "pointer",
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                Commit Answer
                <ArrowRight size={14} />
              </button>
            )}
            {phase === "commit" && committed && (
              <div
                style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#818cf8",
                }}
                className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
              >
                <CheckCircle2 size={14} className="text-[#06B6D4]" />
                Answer committed — awaiting reveal phase…
              </div>
            )}
            {phase === "reveal" && !revealed && (
              <button
                onClick={handleReveal}
                style={{
                  background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
                  boxShadow: "0 0 16px rgba(6,182,212,0.35)",
                  border: "1px solid rgba(6,182,212,0.4)",
                  color: "#fff",
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                Reveal Answer
                <ArrowRight size={14} />
              </button>
            )}
            {phase === "results" && (
              <button
                onClick={nextQuestion}
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                  boxShadow: "0 0 16px rgba(99,102,241,0.35)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  color: "#fff",
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                Next Question
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  valueStyle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-[#64748b] text-xs">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium" style={valueStyle}>
        {value}
      </span>
    </div>
  );
}

function PhaseBadge({ phase, committed }: { phase: Phase; committed: boolean }) {
  const configs: Record<Phase, { label: string; bg: string; border: string; color: string }> = {
    waiting: { label: "WAITING", bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.4)", color: "#94a3b8" },
    commit: {
      label: committed ? "COMMITTED" : "COMMIT PHASE",
      bg: committed ? "rgba(6,182,212,0.12)" : "rgba(99,102,241,0.12)",
      border: committed ? "rgba(6,182,212,0.4)" : "rgba(99,102,241,0.4)",
      color: committed ? "#06B6D4" : "#818cf8",
    },
    reveal: { label: "REVEAL PHASE", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.4)", color: "#F97316" },
    results: { label: "RESULTS", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.4)", color: "#06B6D4" },
  };
  const c = configs[phase];
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
      }}
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
    >
      {c.label}
    </span>
  );
}
