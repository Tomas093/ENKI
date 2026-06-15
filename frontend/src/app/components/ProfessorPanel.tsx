import React, { useState, useEffect } from "react";
import { Settings, Play, SkipForward, StopCircle, Users, Activity, Zap, CheckCircle2, AlertCircle, BarChart3, DollarSign } from "lucide-react";

const submissionData = [
  { time: "0s", count: 3 },
  { time: "5s", count: 8 },
  { time: "10s", count: 19 },
  { time: "15s", count: 31 },
  { time: "20s", count: 38 },
  { time: "25s", count: 43 },
  { time: "30s", count: 45 },
  { time: "35s", count: 47 },
];

type GameStatus = "idle" | "initialized" | "active" | "paused" | "ended";

export function ProfessorPanel() {
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [entryFee, setEntryFee] = useState("0.05");
  const [maxPlayers, setMaxPlayers] = useState("64");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [liveSubmissions, setLiveSubmissions] = useState(47);
  const [log, setLog] = useState<{ msg: string; time: string; type: "success" | "info" | "warn" }[]>([
    { msg: "Game session initialized on-chain", time: "14:32:01", type: "success" },
    { msg: "47 players joined the lobby", time: "14:33:15", type: "info" },
    { msg: "Entry fee locked: 2.35 ETH total", time: "14:33:15", type: "success" },
    { msg: "Question 1 phase started", time: "14:35:00", type: "info" },
  ]);

  useEffect(() => {
    if (gameStatus !== "active") return;
    const t = setInterval(() => {
      setLiveSubmissions((s) => Math.min(s + Math.floor(Math.random() * 2), 64));
    }, 2000);
    return () => clearInterval(t);
  }, [gameStatus]);

  const addLog = (msg: string, type: "success" | "info" | "warn") => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setLog((l) => [{ msg, time, type }, ...l.slice(0, 9)]);
  };

  const handleInit = () => {
    setGameStatus("initialized");
    addLog(`Game initialized — entry fee: ${entryFee} ETH, max: ${maxPlayers} players`, "success");
  };

  const handleStart = () => {
    setGameStatus("active");
    addLog("Game started — lobby open for participants", "success");
  };

  const handleNextQuestion = () => {
    setCurrentQuestion((q) => q + 1);
    setLiveSubmissions(0);
    addLog(`Question ${currentQuestion + 2} phase triggered`, "info");
  };

  const handleEndGame = () => {
    setGameStatus("ended");
    addLog("Game ended — prize distribution initiated on-chain", "warn");
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Control Panel */}
        <div
          style={{
            background: "#161B26",
            border: "1px solid rgba(99,102,241,0.22)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
          className="rounded-xl p-5 space-y-5"
        >
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-[#818cf8]" />
            <h3
              style={{ fontFamily: "'Rajdhani', sans-serif", color: "#818cf8", letterSpacing: "0.08em" }}
              className="text-sm font-semibold uppercase"
            >
              Game Configuration
            </h3>
          </div>

          {/* Status */}
          <div
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
            className="rounded-lg p-3 flex items-center justify-between"
          >
            <span className="text-[#64748b] text-xs">Game Status</span>
            <GameStatusBadge status={gameStatus} />
          </div>

          {/* Entry fee input */}
          <div className="space-y-1.5">
            <label className="text-[#94a3b8] text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ENTRY FEE (ETH)
            </label>
            <div className="relative">
              <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="number"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                disabled={gameStatus !== "idle"}
                style={{
                  background: "rgba(30,37,53,0.8)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  color: "#F8FAFC",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                className="w-full pl-8 pr-4 py-2.5 rounded-lg text-sm outline-none focus:border-[rgba(99,102,241,0.6)] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Max players input */}
          <div className="space-y-1.5">
            <label className="text-[#94a3b8] text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              MAX PLAYERS
            </label>
            <div className="relative">
              <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                disabled={gameStatus !== "idle"}
                style={{
                  background: "rgba(30,37,53,0.8)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  color: "#F8FAFC",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                className="w-full pl-8 pr-4 py-2.5 rounded-lg text-sm outline-none focus:border-[rgba(99,102,241,0.6)] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {gameStatus === "idle" && (
              <ActionButton
                onClick={handleInit}
                icon={<Zap size={14} />}
                label="Initialize Game On-Chain"
                gradient="linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)"
                glow="rgba(99,102,241,0.35)"
              />
            )}
            {gameStatus === "initialized" && (
              <ActionButton
                onClick={handleStart}
                icon={<Play size={14} />}
                label="Start Game & Open Lobby"
                gradient="linear-gradient(135deg, #0891b2 0%, #0e7490 100%)"
                glow="rgba(6,182,212,0.35)"
              />
            )}
            {gameStatus === "active" && (
              <>
                <ActionButton
                  onClick={handleNextQuestion}
                  icon={<SkipForward size={14} />}
                  label={`Trigger Q${currentQuestion + 2} Phase`}
                  gradient="linear-gradient(135deg, #ea6c0a 0%, #c2590a 100%)"
                  glow="rgba(249,115,22,0.35)"
                />
                <ActionButton
                  onClick={handleEndGame}
                  icon={<StopCircle size={14} />}
                  label="End Game & Distribute"
                  gradient="linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
                  glow="rgba(239,68,68,0.35)"
                />
              </>
            )}
            {gameStatus === "ended" && (
              <div
                style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}
                className="text-sm px-4 py-3 rounded-lg flex items-center gap-2"
              >
                <CheckCircle2 size={14} />
                Game ended — prizes distributed
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: "rgba(99,102,241,0.15)" }}>
            <MiniStat label="Prize Pool" value="2.400 ETH" color="#F97316" mono />
            <MiniStat label="Your Fee (10%)" value="0.240 ETH" color="#6366F1" mono />
            <MiniStat label="Active Players" value={`${liveSubmissions}`} color="#06B6D4" mono />
            <MiniStat label="Current Q" value={`Q${currentQuestion + 1}`} color="#10B981" mono />
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Submission frequency chart */}
          <div
            style={{
              background: "#161B26",
              border: "1px solid rgba(99,102,241,0.22)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
            }}
            className="rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#818cf8]" />
                <h3
                  style={{ fontFamily: "'Rajdhani', sans-serif", color: "#818cf8", letterSpacing: "0.08em" }}
                  className="text-sm font-semibold uppercase"
                >
                  Player Submission Frequency
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#06B6D4" }} className="text-xs">
                  {liveSubmissions} active
                </span>
              </div>
            </div>

            <SubmissionBarChart data={submissionData} />

            {/* Gauge row */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Submissions/min", value: "12.4", color: "#6366F1" },
                { label: "Avg response", value: "8.3s", color: "#06B6D4" },
                { label: "Drop rate", value: "2.1%", color: "#F97316" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  className="rounded-lg p-3 text-center"
                >
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color }} className="text-lg font-semibold">
                    {s.value}
                  </div>
                  <div className="text-[#64748b] text-[10px] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity log */}
          <div
            style={{
              background: "#161B26",
              border: "1px solid rgba(99,102,241,0.22)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
            }}
            className="rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-[#818cf8]" />
              <h3
                style={{ fontFamily: "'Rajdhani', sans-serif", color: "#818cf8", letterSpacing: "0.08em" }}
                className="text-sm font-semibold uppercase"
              >
                Transaction Log
              </h3>
            </div>
            <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-hide">
              {log.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${
                      entry.type === "success"
                        ? "rgba(6,182,212,0.2)"
                        : entry.type === "warn"
                        ? "rgba(249,115,22,0.2)"
                        : "rgba(99,102,241,0.14)"
                    }`,
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                >
                  {entry.type === "success" ? (
                    <CheckCircle2 size={12} className="text-[#06B6D4] shrink-0" />
                  ) : entry.type === "warn" ? (
                    <AlertCircle size={12} className="text-[#F97316] shrink-0" />
                  ) : (
                    <Activity size={12} className="text-[#818cf8] shrink-0" />
                  )}
                  <span style={{ color: "#F8FAFC" }} className="text-xs flex-1">{entry.msg}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }} className="text-[10px] shrink-0">
                    {entry.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  onClick, icon, label, gradient, glow,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  glow: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{ background: gradient, boxShadow: `0 0 16px ${glow}`, color: "#ffffff" }}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110"
    >
      {icon}
      {label}
    </button>
  );
}

function MiniStat({ label, value, color, mono }: { label: string; value: string; color: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[#64748b] text-[10px]">{label}</div>
      <div style={{ color, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }} className="text-sm font-semibold">
        {value}
      </div>
    </div>
  );
}

function GameStatusBadge({ status }: { status: GameStatus }) {
  const map: Record<GameStatus, { label: string; color: string; bg: string; border: string }> = {
    idle:        { label: "IDLE",        color: "#64748b",  bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
    initialized: { label: "INITIALIZED", color: "#818cf8",  bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)" },
    active:      { label: "ACTIVE",      color: "#06B6D4",  bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.3)" },
    paused:      { label: "PAUSED",      color: "#F97316",  bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)" },
    ended:       { label: "ENDED",       color: "#94a3b8",  bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" },
  };
  const s = map[status];
  return (
    <span
      style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
      className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1.5"
    >
      {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />}
      {s.label}
    </span>
  );
}

function SubmissionBarChart({ data }: { data: { time: string; count: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxCount = Math.max(...data.map((d) => d.count));
  const chartH = 120;
  const barW = 20;
  const gap = 8;
  const paddingLeft = 28;
  const paddingBottom = 20;
  const totalW = data.length * (barW + gap) - gap + paddingLeft;

  return (
    <div className="relative mt-2" style={{ height: chartH + paddingBottom + 8, overflowX: "auto" }}>
      <svg width="100%" height={chartH + paddingBottom} viewBox={`0 0 ${totalW} ${chartH + paddingBottom}`} preserveAspectRatio="none">
        {[0, Math.round(maxCount / 2), maxCount].map((v, i) => {
          const y = chartH - (v / maxCount) * chartH;
          return (
            <g key={`ylabel-${i}`}>
              <line x1={paddingLeft - 4} y1={y} x2={totalW} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="'JetBrains Mono', monospace">
                {v}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const barH = Math.max(4, (d.count / maxCount) * chartH);
          const x = paddingLeft + i * (barW + gap);
          const y = chartH - barH;
          const isHov = hovered === i;
          return (
            <g key={`bar-${d.time}`} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
              <rect x={x - 2} y={0} width={barW + 4} height={chartH} fill={isHov ? "rgba(99,102,241,0.06)" : "transparent"} rx={4} />
              <rect x={x} y={y} width={barW} height={barH} fill={isHov ? "#818cf8" : "#6366F1"} rx={4} />
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="'JetBrains Mono', monospace">
                {d.time}
              </text>
              {isHov && (
                <g>
                  <rect x={x - 8} y={y - 24} width={36} height={18} rx={4} fill="#1e2535" stroke="rgba(99,102,241,0.4)" strokeWidth={1} />
                  <text x={x + barW / 2} y={y - 12} textAnchor="middle" fill="#818cf8" fontSize={10} fontFamily="'JetBrains Mono', monospace" fontWeight={600}>
                    {d.count}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
