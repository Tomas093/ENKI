"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJoinGame } from "../../hooks/useJoinGame";
import { useNickname } from "../../context/NicknameContext";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, AlertTriangle, Loader2, Wallet, ChevronLeft } from "lucide-react";

// ─── Neo-Brutalist arcade button ─────────────────────────────────────────────
// Physics: solid 4px black shadow shifts to 0 on press, translating the button 4px down-right.
function ArcadeButton({
  onClick,
  loading,
  disabled,
  children,
  type = "button",
  accent = "yellow",
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  type?: "button" | "submit";
  accent?: "yellow" | "black";
}) {
  const bg = accent === "yellow" ? "bg-neo-accent" : "bg-black";
  const text = accent === "yellow" ? "text-black" : "text-white";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      // Arcade press: translate down-right 4px to "sink" into the shadow
      whileTap={{ x: 4, y: 4 }}
      transition={{ duration: 0.06 }}
      style={{
        boxShadow: "4px 4px 0px #000",
      }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        (e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0px #000";
        (e.currentTarget as HTMLElement).style.transform = "translate(2px, 2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0px #000";
        (e.currentTarget as HTMLElement).style.transform = "translate(0, 0)";
      }}
      className={[
        "w-full flex items-center justify-center gap-2.5",
        "border-2 border-black",
        "font-black text-[16px] uppercase tracking-wide",
        "px-6 py-4 min-h-[54px]",
        "transition-[box-shadow,transform] duration-75",
        disabled || loading
          ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
          : `${bg} ${text} cursor-pointer`,
      ].join(" ")}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : null}
      {children}
    </motion.button>
  );
}

// ─── Neo-Brutalist input ──────────────────────────────────────────────────────
function BrutalField({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  autoFocus = false,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoFocus?: boolean;
  error?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-black text-[11px] uppercase tracking-[0.12em] text-black ml-0.5"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        style={{
          boxShadow: error ? "3px 3px 0px #E61919" : "3px 3px 0px #000",
        }}
        className={[
          "w-full bg-white border-2 px-4 py-3.5",
          "text-[16px] font-bold text-black placeholder:text-gray-300 placeholder:font-normal",
          "outline-none transition-all duration-75",
          "focus:outline-none",
          error ? "border-red-500" : "border-black",
        ].join(" ")}
      />
    </div>
  );
}

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
  } = useJoinGame();

  const [nicknameInput, setNicknameInput] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [error, setError] = useState<string | null>(null);
  const nicknameRef = useRef(nicknameInput);
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
          <span className="font-black text-[11px] uppercase tracking-[0.1em]">[ Player Entry ]</span>
        </div>
        <h2 className="font-black text-[32px] uppercase tracking-tight leading-[0.9] text-black">
          Join<br />a Game.
        </h2>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: Form ──────────────────────────────────────────────── */}
        {step === "form" && (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 bg-red-50 border-2 border-red-500 px-3 py-2.5"
                    style={{ boxShadow: "2px 2px 0px #E61919" }}>
                    <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                    <span className="font-bold text-[13px] text-red-700 uppercase tracking-wide">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ArcadeButton type="submit" loading={isReading}>
              {isReading ? "Searching..." : <>Find Game <ArrowRight size={16} /></>}
            </ArcadeButton>
          </motion.form>
        )}

        {/* ── Step 2: Confirm ───────────────────────────────────────────── */}
        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
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
                      <span className="font-black text-[11px] uppercase tracking-[0.1em] text-gray-500">{label}</span>
                      <span className="font-black text-[16px] text-black tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>

                <ArcadeButton onClick={handleJoinWithNick} loading={isPending}>
                  {isPending ? "Signing..." :
                    hasJoined ? <>Resume Game <ArrowRight size={16} /></> :
                    !isConnected ? <><Wallet size={16} /> Connect Wallet</> :
                    <>Stake {entryFeeFormatted} ETH &amp; Enter <ArrowRight size={16} /></>}
                </ArcadeButton>

                <button
                  onClick={() => { setStep("form"); setError(null); }}
                  className="flex items-center justify-center gap-1 font-bold text-[13px] uppercase tracking-wide text-gray-500 hover:text-black transition-colors min-h-[44px]"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} /> Back
                </button>
              </>
            ) : (
              /* Not found */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-5 py-6 text-center border-2 border-red-500 p-6"
                style={{ boxShadow: "4px 4px 0px #E61919" }}
              >
                <div className="font-black text-[13px] uppercase tracking-[0.1em] text-red-600">
                  [ ERROR 404 ]
                </div>
                <div>
                  <p className="font-black text-[22px] uppercase text-black leading-tight mb-1">Game not found</p>
                  <p className="font-medium text-[14px] text-gray-500">Check the ID with your teacher.</p>
                </div>
                <button
                  onClick={() => { setStep("form"); setError(null); }}
                  className="flex items-center gap-1 font-black text-[13px] uppercase tracking-wide text-black underline"
                >
                  <ChevronLeft size={14} /> Try again
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
