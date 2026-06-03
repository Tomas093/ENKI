import React, { useState } from "react";
import { GeometricBackground } from "./GeometricBackground";
import { Bell, Zap, Play, Square, Trophy, Wallet, ChevronRight, AlertTriangle, X, CheckCircle2 } from "lucide-react";

const barData = [
  { name: "Q1", accuracy: 85 },
  { name: "Q2", accuracy: 72 },
  { name: "Q3", accuracy: 68 },
  { name: "Q4", accuracy: 90 },
];

function DonutChart({ correct, incorrect }: { correct: number; incorrect: number }) {
  const r = 70;
  const stroke = 22;
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * r;
  const gap = 6;
  const correctLen = (correct / 100) * circumference - gap;
  const incorrectLen = (incorrect / 100) * circumference - gap;
  const incorrectOffset = -(correctLen + gap);

  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10B981" strokeWidth={stroke}
        strokeDasharray={`${correctLen} ${circumference}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EF4444" strokeWidth={stroke}
        strokeDasharray={`${incorrectLen} ${circumference}`}
        strokeDashoffset={circumference * 0.25 + incorrectOffset}
        strokeLinecap="round" />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#0F172A" fontSize={28} fontWeight={900}>{correct}%</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#94A3B8" fontSize={11} fontWeight={700} letterSpacing={1}>CORRECT</text>
    </svg>
  );
}

function HBarChart({ data }: { data: { name: string; accuracy: number }[] }) {
  const barH = 20;
  const gap = 18;
  const labelW = 30;
  const maxW = 200;
  const totalH = data.length * (barH + gap);

  return (
    <svg width="100%" viewBox={`0 0 ${labelW + maxW + 40} ${totalH}`} style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const y = i * (barH + gap);
        const barW = (d.accuracy / 100) * maxW;
        const fill = d.accuracy > 75 ? "#8B5CF6" : "#A78BFA";
        return (
          <g key={d.name}>
            <text x={0} y={y + barH * 0.75} fill="#64748B" fontSize={12} fontWeight={700}>{d.name}</text>
            <rect x={labelW} y={y} width={maxW} height={barH} rx={4} fill="#E2E8F0" />
            <rect x={labelW} y={y} width={barW} height={barH} rx={4} fill={fill} />
            <text x={labelW + barW + 6} y={y + barH * 0.75} fill="#64748B" fontSize={11} fontWeight={700}>{d.accuracy}%</text>
          </g>
        );
      })}
    </svg>
  );
}

function FinalizeModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
      <div
        className="bg-white rounded-[24px] border-2 border-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.18)] p-8 flex flex-col gap-6 w-full max-w-md"
        style={{ animation: "popIn 0.28s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={28} className="text-amber-500" strokeWidth={2.5} />
          </div>
          <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black text-slate-900">¿Finalizar la partida?</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Esta acción enviará la transacción final al contrato inteligente. Se calcularán los premios y se distribuirán según el ranking olímpico. <strong className="text-slate-700">Esta operación no se puede deshacer.</strong>
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2.5 bg-[#1E293B] hover:bg-[#0F172A] text-white font-black text-base px-5 py-4 rounded-[16px] shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all"
          >
            <Trophy size={18} />
            Sí, estoy seguro — Finalizar partida
          </button>
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center font-bold text-slate-500 hover:text-slate-700 py-3 rounded-[16px] hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function FinalizedToast({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed top-20 right-5 z-50 bg-white border-2 border-emerald-200 rounded-[20px] shadow-[0_8px_32px_rgba(16,185,129,0.18)] p-4 flex items-center gap-3 min-w-[300px]"
      style={{ animation: "slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 size={20} className="text-emerald-500" strokeWidth={2.5} />
      </div>
      <div className="flex-1">
        <p className="font-black text-slate-800 text-sm">¡Partida finalizada!</p>
        <p className="text-xs text-slate-400 font-medium">Distribución on-chain en progreso…</p>
      </div>
      <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
        <X size={12} className="text-slate-400" />
      </button>
    </div>
  );
}

export function ProfessorDashboard() {
  const [questionPhase, setQuestionPhase] = useState<"idle" | "commit" | "reveal">("idle");
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showFinalizedToast, setShowFinalizedToast] = useState(false);
  const answered = 34;
  const total = 47;
  const progressPercent = (answered / total) * 100;

  const handleFinalize = () => {
    setShowFinalizeModal(false);
    setShowFinalizedToast(true);
    setTimeout(() => setShowFinalizedToast(false), 5000);
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-800 flex flex-col">
      <GeometricBackground />
      {showFinalizeModal && <FinalizeModal onConfirm={handleFinalize} onCancel={() => setShowFinalizeModal(false)} />}
      {showFinalizedToast && <FinalizedToast onClose={() => setShowFinalizedToast(false)} />}

      {/* Top Navbar */}
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
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 font-bold text-sm font-mono">0x...B29</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center py-10 px-6 gap-8 max-w-7xl mx-auto w-full">

        {/* Top Status Banner */}
        <div className="w-full bg-white rounded-[24px] border-2 border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Prize Pool</span>
            <div className="text-3xl font-black text-purple-600 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xl">💎</div>
              2.400 ETH
            </div>
          </div>
          <div className="h-12 w-0.5 bg-slate-100 mx-8 hidden md:block" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Question</span>
            <span className="text-3xl font-black text-slate-800">3 / 10</span>
          </div>
          <div className="h-12 w-0.5 bg-slate-100 mx-8 hidden md:block" />
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Active Players</span>
            <div className="text-3xl font-black text-slate-800 flex items-center justify-end gap-2">
              <UsersIcon />
              47 / 64
            </div>
          </div>
        </div>

        {/* 3-column grid: progress | contract controls | analytics */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Col 1: Live Question Progress */}
          <div className="bg-white rounded-[24px] border-2 border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="bg-blue-100 text-blue-700 font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-wider">
                Live Question
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm animate-pulse">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 leading-tight">
              What year did the Ethereum genesis block occur?
            </h2>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Answers received</span>
                <span>{answered} / {total}</span>
              </div>
              <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>

            {/* Answer distribution preview */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              {[
                { label: "2013", pct: 12, color: "bg-red-400" },
                { label: "2014", pct: 8, color: "bg-blue-400" },
                { label: "2015", pct: 68, color: "bg-emerald-400" },
                { label: "2016", pct: 12, color: "bg-yellow-400" },
              ].map((opt) => (
                <div key={opt.label} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>{opt.label}</span><span>{opt.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${opt.color} rounded-full`} style={{ width: `${opt.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: Game Operations & Contract Controls */}
          <div className="bg-white rounded-[24px] border-2 border-purple-100 shadow-[0_8px_30px_rgba(124,58,237,0.08)] p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Zap size={16} className="text-purple-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-black text-slate-800 leading-tight">Game Operations &<br />Contract Controls</h3>
            </div>

            {/* Section 1: Active Question Controls */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Question Controls</p>
              <button
                onClick={() => setQuestionPhase("commit")}
                className="w-full flex items-center justify-center gap-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-base px-5 py-4 rounded-[16px] shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.45)] hover:-translate-y-0.5 transition-all"
              >
                <Play size={18} fill="currentColor" strokeWidth={0} />
                Start Next Question
              </button>
              <button
                onClick={() => setQuestionPhase("reveal")}
                className="w-full flex items-center justify-center gap-2.5 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-black text-base px-5 py-4 rounded-[16px] shadow-[0_6px_20px_rgba(249,115,22,0.30)] hover:shadow-[0_8px_24px_rgba(249,115,22,0.40)] hover:-translate-y-0.5 transition-all"
              >
                <Square size={18} fill="currentColor" strokeWidth={0} />
                End Question & Reveal
              </button>
              {questionPhase !== "idle" && (
                <p className="text-center text-xs font-semibold text-slate-400">
                  Phase: <span className="text-purple-600 font-bold uppercase">{questionPhase}</span>
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Lifecycle</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Section 2: Game Lifecycle */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Game Lifecycle</p>
              <button onClick={() => setShowFinalizeModal(true)} className="w-full flex flex-col items-center justify-center gap-0.5 bg-[#1E293B] hover:bg-[#0F172A] text-white px-5 py-4 rounded-[16px] shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all">
                <span className="flex items-center gap-2 font-black text-base">
                  <Trophy size={18} />
                  Finalize Game & Calculate Prizes
                </span>
                <span className="text-xs text-slate-400 font-medium mt-0.5">Triggers Olympic Ranking distribution on-chain.</span>
              </button>
            </div>

            {/* Divider */}

          </div>

          {/* Col 3: Real-Time Analytics */}
          <div className="bg-white rounded-[24px] border-2 border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-8 flex flex-col gap-6">
            <h3 className="text-xl font-black text-slate-800">Real-Time Analytics</h3>

            <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-200 flex flex-col items-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Current Question Accuracy</h4>
              <DonutChart correct={68} incorrect={32} />
              <div className="flex items-center gap-5 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-600">Correct (68%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-slate-600">Incorrect (32%)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-200 flex flex-col">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Overall Game Accuracy</h4>
              <HBarChart data={barData} />
            </div>
          </div>

        </div>
      </main>

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(200%); } }
        @keyframes popIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
