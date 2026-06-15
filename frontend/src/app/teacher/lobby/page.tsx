"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, Play, Users, Wifi } from "lucide-react";
import toast from "react-hot-toast";
import { useAccount, useReadContract, useWatchContractEvent, usePublicClient } from "wagmi";
import KahootFactoryABI from "../../../abi/KahootFactory.json";
import KahootGameABI from "../../../abi/KahootGame.json";

const AVATAR_COLORS = [
  "bg-purple-500", "bg-blue-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-indigo-500",
  "bg-pink-500", "bg-teal-500", "bg-orange-500",
  "bg-cyan-500", "bg-violet-500", "bg-lime-500",
];

export default function TeacherLobby() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionTitle = searchParams?.get("title") ?? "Trivia Session";
  const { address } = useAccount();
  const { data: kahoots } = useReadContract({
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: KahootFactoryABI.abi,
    functionName: 'getKahootsDeProfesor',
    args: address ? [address] : undefined,
  });

  const contractParam = searchParams?.get("contract");
  const CONTRACT_ADDRESS = contractParam 
    ? contractParam 
    : (kahoots && (kahoots as string[]).length > 0)
      ? (kahoots as string[])[(kahoots as string[]).length - 1]
      : "Loading address...";

  const [joined, setJoined] = useState<string[]>([]);
  const [copiedContract, setCopiedContract] = useState(false);
  const [pulse, setPulse] = useState(false);
  const publicClient = usePublicClient();

  // Cargar jugadores que ya se unieron ANTES de que el lobby abriera
  useEffect(() => {
    if (!publicClient || !CONTRACT_ADDRESS || CONTRACT_ADDRESS === "Loading address...") return;

    publicClient.getContractEvents({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: KahootGameABI.abi,
      eventName: 'PlayerJoined',
      fromBlock: 0n,
    }).then((logs: any[]) => {
      logs.forEach((log) => {
        const player = log.args?.player;
        if (player) {
          setJoined(prev => prev.includes(player) ? prev : [...prev, player]);
        }
      });
    }).catch((err: any) => {
      console.error("Error cargando eventos históricos PlayerJoined:", err);
    });
  }, [publicClient, CONTRACT_ADDRESS]);

  const publicClient = usePublicClient();

  useEffect(() => {
    if (!publicClient || CONTRACT_ADDRESS === "Loading address..." || !CONTRACT_ADDRESS) return;

    const fetchJoinedPlayers = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

        const logs = await publicClient.getContractEvents({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: KahootGameABI.abi,
          eventName: 'PlayerJoined',
          fromBlock: fromBlock,
          toBlock: 'latest'
        });

        const wallets = Array.from(
          new Set(
            logs
              .map(l => (l as any).args?.player as string)
              .filter(Boolean)
          )
        );
        
        setJoined(prev => {
          if (prev.length !== wallets.length) {
            setPulse(true);
            setTimeout(() => setPulse(false), 600);
            return wallets;
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to fetch historical players:", err);
      }
    };

    fetchJoinedPlayers();
    const interval = setInterval(fetchJoinedPlayers, 3000);
    return () => clearInterval(interval);
  }, [publicClient, CONTRACT_ADDRESS]);

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } else {
      // Fallback for non-HTTPS connections (like 192.168.x.x)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = CONTRACT_ADDRESS;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        setCopiedContract(true);
        setTimeout(() => setCopiedContract(false), 2000);
      } catch (err) {
        toast.error("Copia manual requerida (API bloqueada por usar HTTP).");
      }
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pt-8 pb-20 gap-8 relative z-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-slate-800 text-4xl tracking-tight">{sessionTitle}</h1>
          <p className="text-slate-400 font-semibold mt-1">Waiting for players to join and stake…</p>
        </div>
        <button
          onClick={() => router.push(`/teacher/play?game=${CONTRACT_ADDRESS}`)}
          disabled={joined.length < 1 || CONTRACT_ADDRESS === "Loading address..."}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black px-7 py-3.5 rounded-[16px] shadow-lg shadow-emerald-200 disabled:shadow-none transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 cursor-pointer disabled:cursor-not-allowed"
        >
          <Play size={18} fill="white" />
          Start Game
        </button>
      </motion.div>

      {/* Contract Address */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[24px] border-[3px] border-purple-200 shadow-sm p-6"
      >
        <p className="font-black text-slate-500 text-xs uppercase tracking-widest mb-3">Game Contract Address</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-[14px] px-5 py-3.5 font-mono font-bold text-slate-800 text-sm md:text-base truncate">
            {CONTRACT_ADDRESS}
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 font-black text-sm px-5 py-3.5 rounded-[14px] border-2 transition-all cursor-pointer shrink-0 ${
              copiedContract
                ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                : "bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-700"
            }`}
          >
            {copiedContract ? <Check size={16} /> : <Copy size={16} />}
            {copiedContract ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-slate-400 font-semibold text-xs mt-3">
          Share this address with your students so they can stake and join the game.
        </p>
      </motion.div>

      {/* Players joined */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm overflow-hidden"
      >
        {/* Title row */}
        <div className="px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-black text-slate-800 text-xl">Players Joined</h2>
            <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full transition-all ${pulse ? "bg-emerald-100 text-emerald-600 scale-110" : "bg-slate-100 text-slate-500"}`}>
              <Wifi size={12} />
              {joined.length} connected
            </span>
          </div>
          <Users size={20} className="text-slate-300" />
        </div>

        {/* Grid of player cards */}
        <div className="p-6">
          {joined.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-slate-300">
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center">
                <Users size={28} />
              </div>
              <p className="font-bold">Waiting for the first player…</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <AnimatePresence>
                {joined.map((wallet, i) => (
                  <motion.div
                    key={wallet || i}
                    initial={{ opacity: 0, scale: 0.7, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-[16px] px-4 py-3 hover:border-purple-200 hover:bg-purple-50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                      {wallet ? wallet.slice(2, 4).toUpperCase() : "??"}
                    </div>
                    <span className="font-bold text-slate-700 text-sm font-mono truncate">{wallet || "0x???"}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
};
