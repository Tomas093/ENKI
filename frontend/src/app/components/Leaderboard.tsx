import React, { useState } from "react";
import { Trophy, Medal, Crown, Coins, CheckCircle2, ChevronRight, Sparkles, Star } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Player {
  rank: number;
  address: string;
  ens: string;
  score: number;
  correct: number;
  total: number;
  time: string;
  prize: number;
  isSelf?: boolean;
}

const PRIZE_POOL = 2.4;

const PLAYERS: Player[] = [
  { rank: 1, address: "0x4a2b...f391", ens: "cryptoqueen.eth", score: 9800, correct: 10, total: 10, time: "2m 14s", prize: PRIZE_POOL * 0.6,     isSelf: false },
  { rank: 2, address: "0x7e1c...a8d4", ens: "defi_wizard.eth", score: 9400, correct: 9,  total: 10, time: "3m 07s", prize: PRIZE_POOL * 0.2 / 2, isSelf: false },
  { rank: 2, address: "0xb3f0...2c19", ens: "satoshi_jr.eth",  score: 9400, correct: 9,  total: 10, time: "3m 22s", prize: PRIZE_POOL * 0.2 / 2, isSelf: false },
  { rank: 4, address: "0x1234...5678", ens: "you.eth",          score: 8900, correct: 8,  total: 10, time: "4m 55s", prize: 0,                    isSelf: true },
  { rank: 5, address: "0xd45a...8801", ens: "blockchainbob.eth",score: 8600, correct: 8,  total: 10, time: "5m 33s", prize: 0,                    isSelf: false },
  { rank: 6, address: "0xf221...9c34", ens: "nftmaxi.eth",      score: 7900, correct: 7,  total: 10, time: "6m 02s", prize: 0,                    isSelf: false },
  { rank: 7, address: "0xa09e...3d77", ens: "web3newbie.eth",   score: 7300, correct: 7,  total: 10, time: "7m 19s", prize: 0,                    isSelf: false },
];

const PIE_DATA = [
  { name: "1st Place", value: 60, color: "#F97316", eth: "1.440" },
  { name: "2nd Place", value: 20, color: "#94a3b8", eth: "0.480" },
  { name: "3rd Place", value: 10, color: "#06B6D4", eth: "0.240" },
  { name: "Professor", value: 10, color: "#6366F1", eth: "0.240" },
];

const MEDAL_ICONS: Record<number, React.ReactNode> = {
  1: <Crown size={16} style={{ color: "#F97316" }} />,
  2: <Medal size={16} style={{ color: "#94a3b8" }} />,
  3: <Medal size={16} style={{ color: "#06B6D4" }} />,
};

export function Leaderboard() {
  const [claimed, setClaimed] = useState(false);
  const [profClaimed, setProfClaimed] = useState(false);
  const selfPlayer = PLAYERS.find((p) => p.isSelf)!;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="space-y-5">
      {/* Top podium */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(99,102,241,0.07) 0%, rgba(22,27,38,0) 100%)",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
        className="rounded-xl p-6"
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <Trophy size={20} style={{ color: "#F97316" }} />
            <h2
              style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em", color: "#F8FAFC" }}
              className="text-xl font-bold uppercase"
            >
              Final Results — Olympic Ranking
            </h2>
            <Trophy size={20} style={{ color: "#F97316" }} />
          </div>
          <p className="text-[#64748b] text-xs mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            47 players · 2.400 ETH prize pool · Ties handled by score-then-time
          </p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 mb-8">
          <PodiumCard player={PLAYERS[1]} place="2nd" glowColor="#94a3b8" prize="0.240" height="h-16" />
          <PodiumCard player={PLAYERS[0]} place="1st" glowColor="#F97316" prize="1.440" height="h-24" large />
          <PodiumCard player={PLAYERS[2]} place="3rd" glowColor="#06B6D4" prize="0.240" height="h-12" />
        </div>

        {/* Tie notice */}
        <div
          style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.22)" }}
          className="rounded-lg px-4 py-2.5 flex items-center gap-2 text-xs text-[#94a3b8]"
        >
          <Star size={12} style={{ color: "#F97316" }} />
          <span>
            <span style={{ color: "#F97316" }} className="font-medium">Tie detected at 2nd place</span>
            {" "}— both players scored 9,400 pts. Prize split equally (0.240 ETH each). Olympic rule: rank 3 is skipped, next rank is 4th.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Full ranking table */}
        <div
          style={{
            background: "#161B26",
            border: "1px solid rgba(99,102,241,0.22)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
          className="lg:col-span-2 rounded-xl overflow-hidden"
        >
          <div
            style={{ borderBottom: "1px solid rgba(99,102,241,0.15)", background: "rgba(99,102,241,0.04)" }}
            className="px-5 py-3.5 flex items-center gap-2"
          >
            <Trophy size={14} className="text-[#818cf8]" />
            <h3
              style={{ fontFamily: "'Rajdhani', sans-serif", color: "#818cf8", letterSpacing: "0.08em" }}
              className="text-sm font-semibold uppercase"
            >
              Full Ranking
            </h3>
          </div>

          {/* Table header */}
          <div
            style={{
              borderBottom: "1px solid rgba(99,102,241,0.1)",
              background: "rgba(0,0,0,0.2)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
            }}
            className="grid grid-cols-12 px-5 py-2.5 text-[#64748b]"
          >
            <div className="col-span-1">RANK</div>
            <div className="col-span-4">PLAYER</div>
            <div className="col-span-2 text-right">SCORE</div>
            <div className="col-span-2 text-right">CORRECT</div>
            <div className="col-span-1 text-right">TIME</div>
            <div className="col-span-2 text-right">PRIZE</div>
          </div>

          <div>
            {PLAYERS.map((player, i) => (
              <PlayerRow key={`${player.address}-${i}`} player={player} />
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Pie chart */}
          <div
            style={{
              background: "#161B26",
              border: "1px solid rgba(99,102,241,0.22)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
            }}
            className="rounded-xl p-5"
          >
            <h3
              style={{ fontFamily: "'Rajdhani', sans-serif", color: "#818cf8", letterSpacing: "0.08em" }}
              className="text-sm font-semibold uppercase mb-4"
            >
              Prize Distribution
            </h3>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart id="prize-distribution-pie">
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    id="prize-pie-arc"
                  >
                    {PIE_DATA.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1e2535",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "8px",
                      color: "#F8FAFC",
                      fontSize: "11px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                    formatter={(v) => [`${v}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {PIE_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[#94a3b8] text-xs">{d.name}</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: d.color }} className="text-xs">
                    {d.eth} ETH
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Claim Rewards card */}
          <div
            style={{
              background: claimed
                ? "linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(22,27,38,1) 100%)"
                : "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(22,27,38,1) 100%)",
              border: claimed ? "1px solid rgba(6,182,212,0.35)" : "1px solid rgba(99,102,241,0.3)",
              boxShadow: claimed ? "0 0 24px rgba(6,182,212,0.1)" : "0 0 24px rgba(99,102,241,0.08)",
            }}
            className="rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: claimed ? "#06B6D4" : "#818cf8" }} />
              <h3
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: "0.08em",
                  color: claimed ? "#22d3ee" : "#818cf8",
                }}
                className="text-sm font-semibold uppercase"
              >
                {claimed ? "Reward Claimed!" : "Claim Your Reward"}
              </h3>
            </div>

            {claimed ? (
              <div className="space-y-3">
                <div
                  style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)" }}
                  className="rounded-lg p-3 flex items-center gap-3"
                >
                  <CheckCircle2 size={20} className="text-[#06B6D4]" />
                  <div>
                    <div style={{ color: "#22d3ee" }} className="text-sm font-semibold">Transaction Confirmed</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }} className="text-[10px]">
                      0x9f3b...a21c · 12 confirmations
                    </div>
                  </div>
                </div>
                <div className="text-[#64748b] text-xs">Funds transferred to your wallet.</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-[#64748b] text-xs">
                  Your position: <span style={{ color: "#F8FAFC" }}>#{selfPlayer.rank}</span> — no prize this round.
                </div>
                <div
                  style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
                  className="rounded-lg p-3"
                >
                  <div className="text-[#64748b] text-xs mb-1">Eligible winnings</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }} className="text-lg font-semibold">
                    0.000 ETH
                  </div>
                </div>
                <button
                  disabled
                  style={{
                    background: "rgba(30,37,53,0.7)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    color: "#374151",
                    cursor: "not-allowed",
                  }}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Coins size={14} />
                  No Reward — Not a Winner
                </button>
              </div>
            )}
          </div>

          {/* Professor Fee Card */}
          <div
            style={{
              background: profClaimed ? "rgba(6,182,212,0.06)" : "rgba(99,102,241,0.05)",
              border: profClaimed ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(99,102,241,0.2)",
            }}
            className="rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-[#6366F1]" />
              <h3
                style={{ fontFamily: "'Rajdhani', sans-serif", color: "#818cf8", letterSpacing: "0.08em" }}
                className="text-sm font-semibold uppercase"
              >
                Professor Fee
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8] text-xs">Accumulated fee (10%)</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#6366F1" }} className="text-base font-semibold">
                0.240 ETH
              </span>
            </div>
            {profClaimed ? (
              <div className="flex items-center gap-2 text-[#06B6D4] text-xs">
                <CheckCircle2 size={12} />
                Withdrawn successfully
              </div>
            ) : (
              <button
                onClick={() => setProfClaimed(true)}
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                  boxShadow: "0 0 12px rgba(99,102,241,0.3)",
                  color: "#ffffff",
                }}
                className="w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110"
              >
                Withdraw Professor Fee
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const isTop = player.rank <= 2 && player.prize > 0;
  const leftAccent = player.isSelf
    ? "#6366F1"
    : player.rank === 1
    ? "#F97316"
    : player.rank === 2
    ? "#94a3b8"
    : "transparent";

  return (
    <div
      style={{
        background: player.isSelf ? "rgba(99,102,241,0.07)" : isTop ? "rgba(249,115,22,0.03)" : "transparent",
        borderLeft: `2px solid ${leftAccent}`,
        borderBottom: "1px solid rgba(99,102,241,0.07)",
      }}
      className="grid grid-cols-12 px-5 py-3 items-center hover:bg-[rgba(99,102,241,0.04)] transition-colors"
    >
      <div className="col-span-1 flex items-center gap-1">
        {MEDAL_ICONS[player.rank] ?? (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }} className="text-xs">
            {player.rank}
          </span>
        )}
      </div>

      <div className="col-span-4">
        <div className="flex items-center gap-2">
          <div
            style={{
              background: player.isSelf ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
              border: player.isSelf ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)",
              width: 28, height: 28, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: player.isSelf ? "#818cf8" : "#64748b",
              fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
            }}
          >
            {player.ens.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: "#F8FAFC" }} className="text-xs font-medium leading-tight">
              {player.ens}
              {player.isSelf && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#818cf8", fontSize: 9 }} className="ml-1">
                  YOU
                </span>
              )}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }} className="text-[10px]">
              {player.address}
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-2 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", color: player.rank === 1 ? "#F97316" : "#F8FAFC" }}>
        <span className="text-sm">{player.score.toLocaleString()}</span>
      </div>

      <div className="col-span-2 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#06B6D4" }}>
        <span className="text-sm">{player.correct}/{player.total}</span>
      </div>

      <div className="col-span-1 text-right" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }}>
        <span className="text-xs">{player.time}</span>
      </div>

      <div className="col-span-2 text-right">
        {player.prize > 0 ? (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#F97316" }} className="text-xs font-semibold">
            {player.prize.toFixed(3)} Ξ
          </span>
        ) : (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#374151" }} className="text-xs">—</span>
        )}
      </div>
    </div>
  );
}

function PodiumCard({
  player, place, glowColor, prize, height, large,
}: {
  player: Player;
  place: string;
  glowColor: string;
  prize: string;
  height: string;
  large?: boolean;
}) {
  const size = large ? 52 : 44;
  return (
    <div className={`flex flex-col items-center gap-2 ${large ? "scale-105" : ""}`}>
      <div
        style={{
          width: size, height: size,
          background: `radial-gradient(circle, ${glowColor}28 0%, rgba(22,27,38,1) 100%)`,
          border: `2px solid ${glowColor}`,
          boxShadow: `0 0 20px ${glowColor}55`,
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: large ? 20 : 16,
          color: glowColor, fontWeight: 700,
        }}
      >
        {player.ens.charAt(0).toUpperCase()}
      </div>
      <div className="text-center">
        <div style={{ color: "#F8FAFC" }} className="text-xs font-medium">{player.ens}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }} className="text-[9px]">
          {player.score.toLocaleString()} pts
        </div>
      </div>
      <div
        style={{
          background: `linear-gradient(180deg, ${glowColor}20 0%, ${glowColor}0a 100%)`,
          border: `1px solid ${glowColor}45`,
          boxShadow: `0 0 12px ${glowColor}25`,
          width: "80px",
        }}
        className={`${height} rounded-t-lg flex flex-col items-center justify-start pt-2 gap-1`}
      >
        <span style={{ fontFamily: "'Rajdhani', sans-serif", color: glowColor, fontWeight: 700 }} className="text-sm">
          {place}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: glowColor }} className="text-[10px]">
          {prize} Ξ
        </span>
      </div>
    </div>
  );
}
