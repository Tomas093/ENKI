"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useReadContracts, useAccount } from "wagmi";
import { formatEther } from "viem";
import { motion, AnimatePresence } from "motion/react";
import { Users, Zap, Check, Copy } from "lucide-react";
import KahootGameABI from "../../abi/KahootGame.json";
import { useNickname } from "../../context/NicknameContext";

// ─── Neo-Brutalist copy button with microinteraction ─────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (copied || !value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ x: 2, y: 2 }}
      transition={{ duration: 0.06 }}
      style={{
        boxShadow: copied ? "2px 2px 0px #16a34a" : "2px 2px 0px #000",
      }}
      onMouseEnter={(e) => {
        if (copied) return;
        (e.currentTarget as HTMLElement).style.boxShadow = "1px 1px 0px #000";
        (e.currentTarget as HTMLElement).style.transform = "translate(1px,1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = copied ? "2px 2px 0px #16a34a" : "2px 2px 0px #000";
        (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
      }}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 border-2 font-black text-[11px] uppercase tracking-[0.08em]",
        "transition-all duration-75",
        copied ? "bg-green-50 border-green-600 text-green-700" : "bg-neo-accent border-black text-black",
      ].join(" ")}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5">
            <Check size={12} strokeWidth={3} /> Copied!
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5">
            <Copy size={12} /> Copy ID
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Player row ───────────────────────────────────────────────────────────────
function PlayerRow({ name, index, isYou }: { name: string; index: number; isYou: boolean }) {
  // Deterministic color from name
  const colors = [
    { bg: "#000000", text: "#000" }, // yellow
    { bg: "#E8D5FF", text: "#5b21b6" }, // lilac
    { bg: "#FFD5D5", text: "#b91c1c" }, // pink-red
    { bg: "#D5F0FF", text: "#0369a1" }, // blue
    { bg: "#D5FFE8", text: "#15803d" }, // green
  ];
  const color = colors[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.18 }}
      className="flex items-center gap-3 py-3 border-b-2 border-black last:border-b-0"
    >
      {/* Initials avatar — brutalist square, not circle */}
      <div
        className="w-9 h-9 border-2 border-black flex items-center justify-center text-[13px] font-black shrink-0"
        style={{ backgroundColor: color.bg, color: color.text, boxShadow: "2px 2px 0px #000" }}
      >
        {initials}
      </div>

      <span className="font-bold text-[15px] text-black flex-1 truncate">{name}</span>

      <div className="flex items-center gap-2 shrink-0">
        {isYou && (
          <span className="font-black text-[10px] uppercase tracking-[0.08em] bg-neo-accent border border-black px-1.5 py-0.5">
            You
          </span>
        )}
        {/* Live dot — terminal green */}
        <motion.div
          className="w-2.5 h-2.5 border border-black"
          style={{ backgroundColor: "#4AF626" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.8 + index * 0.15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

// ─── Waiting indicator — 3 blocks bouncing ───────────────────────────────────
function BlockBounce() {
  return (
    <div className="flex items-end gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-black"
          animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function JoinWaitingRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game");
  const nickParam = searchParams.get("nick");
  const gameIdParam = searchParams.get("id");
  const { nickname, setNickname } = useNickname();
  const { address } = useAccount();

  useEffect(() => {
    if (nickParam && !nickname) setNickname(decodeURIComponent(nickParam));
  }, [nickParam, nickname, setNickname]);

  const displayName = nickname || (nickParam ? decodeURIComponent(nickParam) : "Player");

  const { data: stats } = useReadContracts({
    contracts: gameAddress ? [
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: "entryFee" },
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: "prizePool" },
    ] : [],
    query: { refetchInterval: 2000 },
  });

  const entryFeeVal = stats?.[0]?.result as bigint | undefined;
  const prizePoolVal = stats?.[1]?.result as bigint | undefined;
  const totalPlayers = (prizePoolVal !== undefined && entryFeeVal !== undefined && entryFeeVal > 0n)
    ? Number(prizePoolVal / entryFeeVal) : 0;
  const prizePoolStr = prizePoolVal !== undefined ? formatEther(prizePoolVal) : "0.0";

  interface LobbyPlayer {
    wallet: string;
    nickname?: string;
  }
  const [playerList, setPlayerList] = useState<LobbyPlayer[]>([]);

  useEffect(() => {
    if (!gameAddress) return;
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`/api/game/${gameAddress}/leaderboard`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.players) {
          setPlayerList(data.players);
        }
      } catch (err) {
        console.error("Lobby players fetch:", err);
      }
    };
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 4000);
    return () => clearInterval(interval);
  }, [gameAddress]);

  const poll = useCallback(async () => {
    if (!gameAddress) return;
    try {
      const res = await fetch(`/api/game/${gameAddress}/sync`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.latestQuestion) {
        localStorage.setItem("last_game_address", gameAddress as string);
        localStorage.setItem("current_question", JSON.stringify(data.latestQuestion));
        localStorage.setItem("current_question_start_time", Date.now().toString());
        router.push(`/gameplay?game=${gameAddress}`);
        return;
      }
      if (data.isGameOver) router.push(`/leaderboard?game=${gameAddress}`);
    } catch (err) {
      console.error("Lobby poll:", err);
    }
  }, [gameAddress, router]);

  useEffect(() => {
    const interval = setInterval(poll, 3500);
    poll();
    return () => clearInterval(interval);
  }, [poll]);

  const shareId = gameIdParam || gameAddress || "";

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 md:px-8 lg:px-12 py-8 relative">

      <div className="w-full max-w-sm mx-auto flex flex-col gap-5 relative z-10">

        {/* ── Status header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white border-2 border-black p-6"
          style={{ boxShadow: "6px 6px 0px #000" }}
        >
          {/* Top tag row */}
          <div className="flex items-center justify-between mb-5">
            <div
              className="flex items-center gap-2 bg-neo-accent border-2 border-black px-3 py-1.5"
              style={{ boxShadow: "2px 2px 0px #000" }}
            >
              <BlockBounce />
              <span className="font-black text-[11px] uppercase tracking-[0.1em]">Standby</span>
            </div>
            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
              REV 2.0
            </span>
          </div>

          {/* Title */}
          <h1 className="font-black text-[34px] uppercase tracking-tight leading-[0.9] text-black mb-2">
            You&apos;re<br />Locked In.
          </h1>
          <p className="font-bold text-[14px] text-gray-500 uppercase tracking-wide">
            Playing as <span className="text-black">{displayName}</span>
          </p>

          {/* Thick divider */}
          <div className="border-t-2 border-black mt-5 mb-4" />

          {/* Stats — brutalist data row */}
          <div className="grid grid-cols-2 gap-0 border-2 border-black">
            <div className="p-4 border-r-2 border-black">
              <div className="font-black text-[10px] uppercase tracking-[0.12em] text-gray-400 flex items-center gap-1.5 mb-1.5">
                <Users size={10} /> Players
              </div>
              <motion.div
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="font-black text-[32px] text-black tabular-nums leading-none"
              >
                {totalPlayers}
              </motion.div>
            </div>
            <div className="p-4 bg-neo-accent">
              <div className="font-black text-[10px] uppercase tracking-[0.12em] text-gray-600 flex items-center gap-1.5 mb-1.5">
                <Zap size={10} /> Pool
              </div>
              <div className="font-black text-[32px] text-black tabular-nums leading-none">
                {prizePoolStr}
                <span className="font-black text-[13px] ml-1">ETH</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Player list ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07, duration: 0.2 }}
          className="bg-white border-2 border-black"
          style={{ boxShadow: "6px 6px 0px #000" }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-black bg-black">
            <span className="font-black text-[11px] uppercase tracking-[0.1em] text-white">
              [ Connected Players ]
            </span>
            {shareId && <CopyButton value={shareId} />}
          </div>

          {/* Rows */}
          <div className="px-5">
            <AnimatePresence>
              {playerList.length === 0 ? (
                <p className="font-bold text-[13px] uppercase tracking-wide text-gray-400 py-6 text-center">
                  Awaiting players...
                </p>
              ) : (
                playerList.map((player, i) => {
                  const isYou = !!(address && player.wallet.toLowerCase() === address.toLowerCase());
                  const displayName = player.nickname || `${player.wallet.slice(0, 6)}...${player.wallet.slice(-4)}`;
                  return (
                    <PlayerRow key={player.wallet} name={displayName} index={i} isYou={isYou} />
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Bottom system note ─────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="font-mono text-[11px] text-gray-400 uppercase tracking-[0.08em] text-center"
        >
          // Game starts when host launches Q1
        </motion.p>

      </div>
    </div>
  );
}
