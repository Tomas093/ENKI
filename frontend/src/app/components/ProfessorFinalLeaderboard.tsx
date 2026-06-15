import React, { useState } from "react";
import { Bell, Zap, Wallet, ChevronRight, Trophy, Medal, Award } from "lucide-react";

// ─── Background ──────────────────────────────────────────────────────────────
function FinalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F4F6FA]">
      {/* Top-left: massive gold/yellow arc */}
      <svg className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3 opacity-[0.07]"
        width="900" height="900" viewBox="0 0 100 100" fill="#F59E0B">
        <circle cx="0" cy="0" r="80" />
      </svg>
      {/* Bottom-right: giant purple diamond */}
      <svg className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-[0.06]"
        width="950" height="950" viewBox="0 0 100 100" fill="#7C3AED">
        <polygon points="50,0 100,50 50,100 0,50" />
      </svg>
      {/* Bottom-left: emerald triangle */}
      <svg className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 opacity-[0.05]"
        width="700" height="700" viewBox="0 0 100 100" fill="#10B981">
        <polygon points="0,100 100,100 0,0" />
      </svg>
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────
// isPodium = uses the full colored card format; false = plain row
const tiers = [
  {
    key: "1a",
    label: "1st Place",
    players: ["0x4A3f...C21B"],
    prize: "0.72 ETH",
    prizeRaw: 0.72,
    color: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-300",
    badge: "bg-amber-400",
    medal: "🥇",
    isPodium: true,
  },
  {
    key: "1b",
    label: "1st Place",
    players: ["0x9B7e...F44A"],
    prize: "0.72 ETH",
    prizeRaw: 0.72,
    color: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-300",
    badge: "bg-amber-400",
    medal: "🥇",
    isPodium: true,
  },
  {
    key: "3",
    label: "3rd Place",
    players: ["0x2C8d...88FF"],
    prize: "0.48 ETH",
    prizeRaw: 0.48,
    color: "#CD7C2F",
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-400",
    medal: "🥉",
    isPodium: true,
  },
  {
    key: "4",
    label: "4th Place",
    players: ["0x7F1a...003C"],
    prize: "",
    prizeRaw: 0,
    color: "#6B7280",
    bg: "",
    border: "",
    badge: "",
    medal: "4",
    isPodium: false,
  },
  {
    key: "5",
    label: "5th – 8th Place (Consolation)",
    players: ["0xAA2b...1234", "0xBB3c...5678", "0xCC4d...9ABC", "0xDD5e...DEF0"],
    prize: "",
    prizeRaw: 0,
    color: "#94A3B8",
    bg: "",
    border: "",
    badge: "",
    medal: "—",
    isPodium: false,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export function ProfessorFinalLeaderboard() {
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  const handleWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setWithdrawn(true);
    }, 2200);
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-800 flex flex-col">
      <FinalBackground />

      {/* ── Navbar ── */}
      <header className="relative z-10 bg-white h-[72px] border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl w-10 h-10 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={20} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-black text-2xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            ENKI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <Bell size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-200 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 font-bold text-sm font-mono">0x...B29</span>
          </div>
        </div>
      </header>

      {/* ── Closed Banner ── */}
      <div className="relative z-10 w-full bg-[#1E293B] px-6 py-4 flex items-center justify-center gap-3 shadow-lg">
        <span className="text-2xl">🏁</span>
        <p className="text-white font-black text-lg tracking-wide">Game Officially Closed & Prizes Calculated</p>
        <span className="ml-4 hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-white/70 uppercase tracking-widest">
          Block confirmed
        </span>
      </div>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center py-10 px-4 gap-8 max-w-7xl mx-auto w-full">

        {/* Summary strip */}
        <div className="w-full grid grid-cols-3 gap-4">
          {[
            { label: "Total Players", value: "47" },
            { label: "Total Prize Pool", value: "2.400 ETH" },
            { label: "Questions Asked", value: "10" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-[20px] border-2 border-slate-100 shadow-[0_4px_16px_rgb(0,0,0,0.03)] p-5 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</span>
              <span className="text-2xl font-black text-slate-900">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Split: Leaderboard | Treasury */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ── LEFT: Leaderboard ── */}
          <div className="bg-white rounded-[24px] border-2 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Trophy size={24} className="text-amber-400" strokeWidth={2.5} />
                Final Tournament Results
              </h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-wider">Olympic Ranking</span>
            </div>

            <div className="flex flex-col gap-4">
              {tiers.map((tier) =>
                tier.isPodium ? (
                  /* ── Podium card ── */
                  <div
                    key={tier.key}
                    className={`flex items-start gap-4 ${tier.bg} border-2 ${tier.border} rounded-[20px] p-5 transition-transform hover:scale-[1.01]`}
                  >
                    <div className="text-3xl leading-none mt-0.5 select-none">{tier.medal}</div>
                    <div className="flex-1 flex flex-col gap-2">
                      <span className="font-black text-slate-800">{tier.label}</span>
                      <div className="flex flex-wrap gap-2">
                        {tier.players.map((p) => (
                          <span key={p} className="font-mono text-sm font-bold text-slate-600 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-lg">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    {tier.prizeRaw > 0 && (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Prize</span>
                        <span className="font-black text-lg" style={{ color: tier.color }}>{tier.prize}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Plain row (4th, consolation) ── */
                  <div
                    key={tier.key}
                    className="flex items-center gap-4 px-5 py-3 rounded-[16px] border border-slate-100 bg-slate-50/50"
                  >
                    <span className="text-base font-black text-slate-400 w-6 text-center select-none">{tier.medal}</span>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="font-bold text-slate-600 text-sm">{tier.label}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {tier.players.map((p) => (
                          <span key={p} className="font-mono text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    {tier.prizeRaw > 0 && (
                      <span className="font-bold text-sm text-slate-500 shrink-0">{tier.prize}</span>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Distribution note */}
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-400 border-t border-slate-100 pt-4">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              Note: Tied players split the combined prize for their tied positions.&nbsp;
              <span className="text-slate-300">(1st + 2nd pool → split equally)</span>
            </div>
          </div>

          {/* ── RIGHT: Treasury ── */}
          <div className="relative overflow-hidden bg-white rounded-[24px] border-2 border-emerald-200 shadow-[0_8px_40px_rgba(16,185,129,0.12)] p-8 flex flex-col gap-6">
            {/* Decorative confetti blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-100 opacity-50 pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-teal-100 opacity-40 pointer-events-none" />
            <div className="absolute top-1/2 right-4 w-6 h-6 rounded-full bg-amber-200 opacity-60 pointer-events-none" />
            <div className="absolute top-1/3 left-6 w-4 h-4 rounded-sm rotate-45 bg-purple-200 opacity-50 pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                <Wallet size={24} className="text-emerald-600" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Instructor Treasury</p>
                <h3 className="font-black text-slate-800 text-lg leading-tight">Your Earnings</h3>
              </div>
            </div>

            {/* Fee display */}
            <div className="relative flex flex-col items-center text-center bg-emerald-50 border-2 border-emerald-200 rounded-[20px] py-8 px-4 gap-2">
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Your Accumulated Instructor Fee:</p>
              <p className="text-6xl font-black text-emerald-600 tracking-tight leading-none">
                0.240
                <span className="text-3xl ml-2 text-emerald-400">ETH</span>
              </p>
              <p className="text-xs font-semibold text-emerald-500 mt-1">≈ $612.00 USD</p>
            </div>

            {/* Breakdown */}
            <div className="relative flex flex-col gap-2">
              {[
                { label: "Base instructor fee (10%)", value: "0.240 ETH" },
                { label: "Smart contract remainders", value: "~0.000 ETH" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">{row.label}</span>
                  <span className="font-black text-slate-700 font-mono">{row.value}</span>
                </div>
              ))}
              <div className="h-px bg-slate-100 my-1" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700">Total claimable</span>
                <span className="font-black text-emerald-600 font-mono">0.240 ETH</span>
              </div>
            </div>

            {/* CTA */}
            <div className="relative flex flex-col gap-3">
              {withdrawn ? (
                <div className="w-full flex items-center justify-center gap-2.5 bg-slate-100 border-2 border-slate-200 text-slate-500 font-black text-lg px-5 py-5 rounded-[18px]">
                  ✅ Fee withdrawn successfully
                </div>
              ) : (
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="relative w-full flex items-center justify-center gap-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-70 text-white font-black text-xl px-5 py-5 rounded-[18px] shadow-[0_8px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.45)] hover:-translate-y-1 transition-all overflow-hidden"
                >
                  {withdrawing ? (
                    <>
                      <span className="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
                      Sending to Wallet…
                    </>
                  ) : (
                    <>
                      <Wallet size={22} />
                      Withdraw Fee to Wallet
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              )}
              <p className="text-center text-xs font-semibold text-slate-400 leading-relaxed">
                Includes base 10% fee + smart contract division remainders.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
