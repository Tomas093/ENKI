"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJoinGame } from '@/features/player/useJoinGame';
import { useNickname } from '@/core/context/NicknameContext';
import { ArrowRight, AlertTriangle, Loader2, Wallet, ChevronLeft } from "lucide-react";

import { ArcadeButton } from '@/shared/ui/ArcadeButton';
import { BrutalField } from '@/shared/ui/BrutalField';

// ─── Main component ───────────────────────────────────────────────────────────
export function JoinGameTerminal() {
  const router = useRouter();
  const { setNickname } = useNickname();
  const {
    gameIdInput, setGameIdInput,
    searchedAddress, isReading,
    isGameFound, entryFeeFormatted,
    hasJoined, isConnected, isPending,
    handleSearch, handleJoin,
    globalNickname,
  } = useJoinGame();

  const [nicknameInput, setNicknameInput] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [error, setError] = useState<string | null>(null);
  const nicknameRef = useRef(nicknameInput);
  
  useEffect(() => {
    if (globalNickname) {
      setNicknameInput(globalNickname);
    }
  }, [globalNickname]);

  useEffect(() => { nicknameRef.current = nicknameInput; }, [nicknameInput]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nicknameInput.trim() || nicknameInput.trim().length < 2) {
      setError("Nickname must be at least 2 characters.");
      return;
    }
    if (!gameIdInput.trim()) {
      setError("Enter the Game ID from your teacher.");
      return;
    }
    setNickname(nicknameInput.trim());
    await handleSearch(e);
    setStep("confirm");
  };

  const handleJoinWithNick = async () => {
    if (hasJoined && searchedAddress) {
      router.push(`/join-waiting?game=${searchedAddress}&nick=${encodeURIComponent(nicknameRef.current)}`);
      return;
    }
    await (handleJoin as (nick?: string) => Promise<void>)(nicknameRef.current);
  };

  return (
    <div
      className="bg-white border-2 border-black flex flex-col gap-6 h-full p-7 md:p-8"
      style={{ boxShadow: "6px 6px 0px #000" }}
    >
      {/* Header */}
      <div className="border-b-2 border-black pb-5">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 bg-neo-accent border-2 border-black px-3 py-1 mb-4"
          style={{ boxShadow: "2px 2px 0px #000" }}>
          <span className="font-black text-sm uppercase tracking-wider">[ Player Entry ]</span>
        </div>
        <h2 className="font-black text-[32px] uppercase tracking-tight leading-[0.9] text-black">
          Join<br />a Game.
        </h2>
      </div>

      {/* Form Content */}
      <div className="flex-1">
        {/* ── Step 1: Form ──────────────────────────────────────────────── */}
        {step === "form" && (
          <form
            key="form"
            onSubmit={handleFormSubmit}
            className="flex flex-col gap-5"
          >
            <BrutalField
              id="game-id"
              label="// Game ID"
              value={gameIdInput}
              onChange={setGameIdInput}
              placeholder="e.g.  42"
              inputMode="numeric"
              autoFocus
              error={!!error && !gameIdInput.trim()}
            />
            <BrutalField
              id="nickname"
              label="// Your Nickname"
              value={nicknameInput}
              onChange={setNicknameInput}
              placeholder="e.g.  0xBrainBlast"
              error={!!error && nicknameInput.trim().length < 2}
            />

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border-2 border-red-500 px-3 py-2.5"
                style={{ boxShadow: "2px 2px 0px #E61919" }}>
                <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                <span className="font-bold text-[13px] text-red-700 uppercase tracking-wide">{error}</span>
              </div>
            )}

            <ArcadeButton type="submit" loading={isReading}>
              {isReading ? "Searching..." : <>Find Game <ArrowRight size={16} /></>}
            </ArcadeButton>
          </form>
        )}

        {/* ── Step 2: Confirm ───────────────────────────────────────────── */}
        {step === "confirm" && (
          <form
            key="confirm"
            onSubmit={(e) => { e.preventDefault(); handleJoinWithNick(); }}
            className="flex flex-col gap-5"
          >
            {isReading ? (
              <div className="flex items-center gap-3 text-black font-bold py-8 uppercase tracking-wide text-[13px]">
                <Loader2 size={18} className="animate-spin" />
                Resolving on-chain...
              </div>
            ) : isGameFound ? (
              <>
                {/* Game data — brutalist data table */}
                <div className="border-2 border-black" style={{ boxShadow: "4px 4px 0px #000" }}>
                  {[
                    { label: "Game ID", value: `#${gameIdInput}` },
                    { label: "Nickname", value: nicknameInput },
                    { label: "Stake", value: `${entryFeeFormatted} ETH` },
                  ].map(({ label, value }, i, arr) => (
                    <div
                      key={label}
                      className={[
                        "flex items-center justify-between px-4 py-3.5",
                        i < arr.length - 1 ? "border-b-2 border-black" : "",
                        i === 2 ? "bg-neo-accent" : "bg-white",
                      ].join(" ")}
                    >
                      <span className="font-black text-sm uppercase tracking-wider text-gray-500">{label}</span>
                      <span className="font-black text-[16px] text-black tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
                
                {nicknameInput && nicknameInput.trim() !== "" && nicknameInput !== globalNickname && (
                  <div className="flex items-start gap-2 bg-[#33CCFF]/10 border-2 border-black px-3 py-2.5 shadow-[2px_2px_0px_#33CCFF]">
                    <Wallet size={14} className="text-black shrink-0 mt-0.5" />
                    <span className="font-bold text-sm text-black uppercase tracking-wide">
                      This will also save your nickname globally on-chain (1 extra transaction).
                    </span>
                  </div>
                )}

                <ArcadeButton type="submit" loading={isPending}>
                  {isPending ? "Signing..." :
                    hasJoined ? <>Resume Game <ArrowRight size={16} /></> :
                    !isConnected ? <><Wallet size={16} /> Connect Wallet</> :
                    <>Stake {entryFeeFormatted} ETH &amp; Enter <ArrowRight size={16} /></>}
                </ArcadeButton>

                <button
                  type="button"
                  onClick={() => { setStep("form"); setError(null); }}
                  className="flex items-center justify-center gap-1 font-bold text-[13px] uppercase tracking-wide text-gray-500 hover:text-black transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3366]"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} /> Back
                </button>
              </>
            ) : (
              /* Not found */
              <div
                className="flex flex-col items-center gap-5 py-6 text-center border-2 border-red-500 p-6"
                style={{ boxShadow: "4px 4px 0px #E61919" }}
              >
                <div className="font-black text-[13px] uppercase tracking-wider text-red-600">
                  [ ERROR 404 ]
                </div>
                <div>
                  <p className="font-black text-[22px] uppercase text-black leading-tight mb-1">Game not found</p>
                  <p className="font-medium text-[14px] text-gray-500">Check the ID with your teacher.</p>
                </div>
                <button
                  onClick={() => { setStep("form"); setError(null); }}
                  className="flex items-center gap-1 font-black text-[13px] uppercase tracking-wide text-black underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3366]"
                >
                  <ChevronLeft size={14} /> Try again
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
