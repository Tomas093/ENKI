import React, { useState, useEffect } from "react";
import { GeometricBackground } from "./GeometricBackground";
import { Zap, Play, Square, Trophy, Wallet, AlertTriangle, X, CheckCircle2, Loader2, AlertCircle, Users } from "lucide-react";
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { formatEther, encodePacked, keccak256 } from "viem";
import { kahootGameAbi } from "../../lib/contracts";
import { useGame } from "../../lib/GameContext";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StoredQuestion {
  text: string;
  options: string[];
  correctOption: number;
  salt: string;
}

// Professor stores questions in sessionStorage when creating the game
const KEY_QUESTIONS = "enki_professorQuestions";

function loadStoredQuestions(): StoredQuestion[] {
  const raw = sessionStorage.getItem(KEY_QUESTIONS);
  return raw ? (JSON.parse(raw) as StoredQuestion[]) : [];
}

function shortAddr(addr: string) {
  return addr.slice(0, 8) + "…" + addr.slice(-6);
}

// ─── Finalize Confirm Modal ────────────────────────────────────────────────────
function FinalizeModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-[24px] border-2 border-slate-100 shadow-2xl p-8 flex flex-col gap-6 w-full max-w-md">
        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
            <AlertTriangle size={28} className="text-amber-500" strokeWidth={2.5} />
          </div>
          <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Finalize the game?</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            This will call <code className="bg-slate-100 px-1 rounded">advanceToNextQuestion()</code> for the last round, marking the game as finished on-chain. Prizes can be calculated after this. <strong className="text-slate-700">This cannot be undone.</strong>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2.5 bg-[#1E293B] hover:bg-[#0F172A] text-white font-black text-base px-5 py-4 rounded-[16px] transition-all">
            <Trophy size={18} /> Yes — Finalize Game On-Chain
          </button>
          <button onClick={onCancel}
            className="w-full flex items-center justify-center font-bold text-slate-500 hover:text-slate-700 py-3 rounded-[16px] hover:bg-slate-50 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function ProfessorDashboard() {
  const { address } = useAccount();
  const { gameAddress } = useGame();
  const gameAddr = gameAddress as `0x${string}` | undefined;

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [log, setLog] = useState<{ msg: string; time: string; type: "success" | "info" | "warn" }[]>([]);

  // Questions are stored in sessionStorage when the game was created
  const questions = loadStoredQuestions();

  const addLog = (msg: string, type: "success" | "info" | "warn") => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setLog((l) => [{ msg, time, type }, ...l.slice(0, 14)]);
  };

  // ── Read game state ─────────────────────────────────────────────────────────
  const { data, refetch } = useReadContracts({
    contracts: gameAddr
      ? [
          { address: gameAddr, abi: kahootGameAbi, functionName: "currentQuestionId" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "isFinished" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "prizesCalculated" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "prizePool" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "professor" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "totalQuestions" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "professorPrizeClaimed" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "professorPrize" },
        ]
      : [],
    query: { enabled: !!gameAddr, refetchInterval: 4000 },
  });

  const currentQId = data?.[0]?.result as bigint | undefined;
  const isFinished = data?.[1]?.result as boolean | undefined;
  const prizesCalculated = data?.[2]?.result as boolean | undefined;
  const prizePool = data?.[3]?.result as bigint | undefined;
  const professorOnChain = data?.[4]?.result as string | undefined;
  const totalQuestions = data?.[5]?.result as bigint | undefined;
  const profPrizeClaimed = data?.[7]?.result as boolean | undefined;
  const profPrize = data?.[8]?.result as bigint | undefined;

  // Read current round
  const { data: roundData, refetch: refetchRound } = useReadContracts({
    contracts:
      gameAddr && currentQId !== undefined
        ? [{ address: gameAddr, abi: kahootGameAbi, functionName: "listaDeRondas", args: [currentQId] }]
        : [],
    query: { enabled: !!gameAddr && currentQId !== undefined, refetchInterval: 3000 },
  });

  const currentRound = roundData?.[0]?.result as
    | { commitPhaseOpen: boolean; revealPhaseOpen: boolean }
    | undefined;

  const isProfessor = address && professorOnChain && address.toLowerCase() === professorOnChain.toLowerCase();
  const currentQ = questions[Number(currentQId ?? 0)];
  const phase = !currentRound
    ? "idle"
    : currentRound.commitPhaseOpen
    ? "commit"
    : currentRound.revealPhaseOpen
    ? "reveal"
    : "idle";

  // ── Writes ──────────────────────────────────────────────────────────────────
  const mkWrite = () => useWriteContract();

  // startNextQuestion
  const { writeContract: writeStart, data: startTxHash, isPending: isStartPending, error: startError } = useWriteContract();
  const { isLoading: isStartTxLoading, isSuccess: isStartSuccess } = useWaitForTransactionReceipt({ hash: startTxHash });
  useEffect(() => {
    if (isStartSuccess) { addLog(`Q${Number(currentQId) + 1} commit phase opened`, "success"); refetch(); refetchRound(); }
  }, [isStartSuccess]);

  // closeQuestionAndStartReveal
  const { writeContract: writeClose, data: closeTxHash, isPending: isClosePending, error: closeError } = useWriteContract();
  const { isLoading: isCloseTxLoading, isSuccess: isCloseSuccess } = useWaitForTransactionReceipt({ hash: closeTxHash });
  useEffect(() => {
    if (isCloseSuccess) { addLog(`Q${Number(currentQId) + 1} reveal phase opened`, "info"); refetch(); refetchRound(); }
  }, [isCloseSuccess]);

  // advanceToNextQuestion
  const { writeContract: writeAdvance, data: advTxHash, isPending: isAdvPending, error: advError } = useWriteContract();
  const { isLoading: isAdvTxLoading, isSuccess: isAdvSuccess } = useWaitForTransactionReceipt({ hash: advTxHash });
  useEffect(() => {
    if (isAdvSuccess) { addLog("Advanced to next question / game ended", "info"); refetch(); refetchRound(); }
  }, [isAdvSuccess]);

  // calculatePrizes
  const { writeContract: writeCalc, data: calcTxHash, isPending: isCalcPending } = useWriteContract();
  const { isLoading: isCalcTxLoading, isSuccess: isCalcSuccess } = useWaitForTransactionReceipt({ hash: calcTxHash });
  useEffect(() => {
    if (isCalcSuccess) { addLog("Prizes calculated on-chain", "success"); refetch(); }
  }, [isCalcSuccess]);

  // claimPrize (professor)
  const { writeContract: writeClaim, data: claimTxHash, isPending: isClaimPending } = useWriteContract();
  const { isLoading: isClaimTxLoading, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ hash: claimTxHash });
  useEffect(() => {
    if (isClaimSuccess) { addLog("Professor prize claimed!", "success"); refetch(); }
  }, [isClaimSuccess]);

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleStartNextQuestion = () => {
    if (!gameAddr || !currentQ || !isProfessor) return;
    writeStart({
      address: gameAddr,
      abi: kahootGameAbi,
      functionName: "startNextQuestion",
      args: [currentQ.text, currentQ.options as [string, string, string, string], currentQ.salt],
    });
  };

  const handleCloseAndReveal = () => {
    if (!gameAddr || !currentQ || !isProfessor) return;
    writeClose({
      address: gameAddr,
      abi: kahootGameAbi,
      functionName: "closeQuestionAndStartReveal",
      args: [currentQ.correctOption as unknown as number, currentQ.salt],
    });
  };

  const handleAdvance = () => {
    if (!gameAddr || !isProfessor) return;
    if (isFinished || (totalQuestions && currentQId !== undefined && currentQId + 1n >= totalQuestions)) {
      setShowFinalizeModal(true);
    } else {
      writeAdvance({ address: gameAddr, abi: kahootGameAbi, functionName: "advanceToNextQuestion" });
    }
  };

  const handleFinalize = () => {
    if (!gameAddr) return;
    setShowFinalizeModal(false);
    writeAdvance({ address: gameAddr, abi: kahootGameAbi, functionName: "advanceToNextQuestion" });
  };

  if (!gameAddr) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle size={48} className="text-orange-500" />
        <p className="text-xl font-bold text-slate-600">No active game found.</p>
        <a href="/professor/create" className="text-purple-600 font-bold underline">← Create a game first</a>
      </div>
    );
  }

  const anyBusy = isStartPending || isStartTxLoading || isClosePending || isCloseTxLoading || isAdvPending || isAdvTxLoading || isCalcPending || isCalcTxLoading || isClaimPending || isClaimTxLoading;

  return (
    <div className="min-h-screen relative font-sans text-slate-800 flex flex-col">
      <GeometricBackground />
      {showFinalizeModal && <FinalizeModal onConfirm={handleFinalize} onCancel={() => setShowFinalizeModal(false)} />}

      <main className="relative z-10 flex-1 flex flex-col items-center py-8 px-6 gap-6 max-w-7xl mx-auto w-full">

        {/* Top Status Banner */}
        <div className="w-full bg-white rounded-[24px] border-2 border-slate-100 shadow p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Game Contract</p>
            <p className="font-mono text-slate-600 text-sm">{gameAddr}</p>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prize Pool</p>
              <p className="text-2xl font-black text-purple-600">{prizePool !== undefined ? formatEther(prizePool) : "…"} ETH</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question</p>
              <p className="text-2xl font-black text-slate-800">{currentQId !== undefined ? Number(currentQId) + 1 : "…"} / {totalQuestions?.toString() ?? "…"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phase</p>
              <p className={`text-lg font-black uppercase ${phase === "commit" ? "text-blue-600" : phase === "reveal" ? "text-orange-500" : "text-slate-400"}`}>
                {isFinished ? "ENDED" : phase}
              </p>
            </div>
            {!isProfessor && (
              <div className="bg-red-50 border-2 border-red-200 rounded-[12px] px-4 py-2 text-red-600 font-bold text-sm flex items-center gap-2">
                <AlertCircle size={16} /> Not the professor of this game
              </div>
            )}
          </div>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Col 1: Current Question Info */}
          <div className="bg-white rounded-[24px] border-2 border-slate-100 shadow p-6 flex flex-col gap-4">
            <h3 className="font-black text-slate-800 text-lg">Current Question</h3>
            {currentQ ? (
              <>
                <p className="font-bold text-slate-700 text-base leading-snug">{currentQ.text}</p>
                <div className="grid grid-cols-2 gap-2">
                  {currentQ.options.map((opt, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold ${i === currentQ.correctOption ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                      <span>{["A", "B", "C", "D"][i]}</span> {opt}
                      {i === currentQ.correctOption && <CheckCircle2 size={14} className="ml-auto text-emerald-500" />}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-mono">Salt: {currentQ.salt.slice(0, 16)}…</p>
              </>
            ) : (
              <p className="text-slate-400 font-bold">No question data found in this session.</p>
            )}
          </div>

          {/* Col 2: Contract Controls */}
          <div className="bg-white rounded-[24px] border-2 border-purple-100 shadow-[0_8px_30px_rgba(124,58,237,0.08)] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center"><Zap size={16} className="text-purple-600" /></div>
              <h3 className="font-black text-slate-800 text-base">Game Controls</h3>
            </div>

            {!isFinished ? (
              <div className="flex flex-col gap-3">
                {/* Start Next Question */}
                <button
                  onClick={handleStartNextQuestion}
                  disabled={anyBusy || !isProfessor || phase !== "idle" || !currentQ}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-slate-300 text-white font-black text-base px-5 py-4 rounded-[16px] shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.45)] hover:-translate-y-0.5 transition-all disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                  {isStartPending || isStartTxLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" strokeWidth={0} />}
                  {isStartPending ? "Sign…" : isStartTxLoading ? "Confirming…" : "Open Commit Phase (startNextQuestion)"}
                </button>

                {/* Close + Start Reveal */}
                <button
                  onClick={handleCloseAndReveal}
                  disabled={anyBusy || !isProfessor || phase !== "commit" || !currentQ}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#F97316] hover:bg-[#EA6C0A] disabled:bg-slate-300 text-white font-black text-base px-5 py-4 rounded-[16px] shadow-[0_6px_20px_rgba(249,115,22,0.30)] hover:-translate-y-0.5 transition-all disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
                >
                  {isClosePending || isCloseTxLoading ? <Loader2 size={18} className="animate-spin" /> : <Square size={18} fill="currentColor" strokeWidth={0} />}
                  {isClosePending ? "Sign…" : isCloseTxLoading ? "Confirming…" : "End Commit & Start Reveal (closeQuestionAndStartReveal)"}
                </button>

                {/* Advance / Finalize */}
                <button
                  onClick={handleAdvance}
                  disabled={anyBusy || !isProfessor || phase !== "reveal"}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#1E293B] hover:bg-[#0F172A] disabled:bg-slate-300 text-white font-black text-base px-5 py-4 rounded-[16px] transition-all disabled:cursor-not-allowed"
                >
                  {isAdvPending || isAdvTxLoading ? <Loader2 size={18} className="animate-spin" /> : <Trophy size={18} />}
                  {isAdvPending ? "Sign…" : isAdvTxLoading ? "Confirming…" :
                    (totalQuestions && currentQId !== undefined && currentQId + 1n >= totalQuestions)
                      ? "Finalize Game (advanceToNextQuestion)"
                      : "Next Question (advanceToNextQuestion)"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[16px] p-4 flex items-center gap-2 font-bold text-emerald-700">
                  <CheckCircle2 size={20} /> Game Ended!
                </div>

                {!prizesCalculated && (
                  <button
                    onClick={() => writeCalc({ address: gameAddr!, abi: kahootGameAbi, functionName: "calculatePrizes" })}
                    disabled={anyBusy}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black px-5 py-4 rounded-[16px] transition-all disabled:cursor-not-allowed"
                  >
                    {isCalcPending || isCalcTxLoading ? <Loader2 size={18} className="animate-spin" /> : "⚙️"}
                    {isCalcPending ? "Sign…" : isCalcTxLoading ? "Confirming…" : "Calculate Prizes"}
                  </button>
                )}

                {prizesCalculated && !profPrizeClaimed && profPrize !== undefined && profPrize > 0n && (
                  <button
                    onClick={() => writeClaim({ address: gameAddr!, abi: kahootGameAbi, functionName: "claimPrize" })}
                    disabled={anyBusy}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-black px-5 py-4 rounded-[16px] transition-all disabled:cursor-not-allowed"
                  >
                    {isClaimPending || isClaimTxLoading ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
                    {isClaimPending ? "Sign…" : isClaimTxLoading ? "Confirming…" : `Claim Your Fee (${formatEther(profPrize)} ETH)`}
                  </button>
                )}

                {profPrizeClaimed && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-[16px] p-4 text-purple-700 font-bold text-center">
                    ✅ Professor fee claimed!
                  </div>
                )}
              </div>
            )}

            {/* Errors */}
            {(startError || closeError || advError) && (
              <p className="text-red-500 text-xs font-semibold bg-red-50 border border-red-200 rounded-lg p-2">
                {((startError || closeError || advError) as Error)?.message?.slice(0, 150)}
              </p>
            )}
          </div>

          {/* Col 3: Activity Log */}
          <div className="bg-white rounded-[24px] border-2 border-slate-100 shadow p-6 flex flex-col gap-3">
            <h3 className="font-black text-slate-800 text-lg">Transaction Log</h3>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {log.length === 0 && (
                <p className="text-slate-400 font-semibold text-sm">No actions yet…</p>
              )}
              {log.map((entry, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                  entry.type === "success" ? "border-emerald-200 bg-emerald-50" :
                  entry.type === "warn" ? "border-orange-200 bg-orange-50" :
                  "border-slate-200 bg-slate-50"}`}>
                  {entry.type === "success" ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> :
                   entry.type === "warn" ? <AlertTriangle size={12} className="text-orange-500 shrink-0" /> :
                   <Zap size={12} className="text-blue-500 shrink-0" />}
                  <span className="flex-1 font-medium text-slate-700">{entry.msg}</span>
                  <span className="text-slate-400 font-mono text-[10px] shrink-0">{entry.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <style>{`
        @keyframes popIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
