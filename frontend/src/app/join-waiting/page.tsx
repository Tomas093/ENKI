"use client";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Users, Coins } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useReadContracts, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import KahootGameABI from "../../abi/KahootGame.json";

export default function JoinWaitingRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game");
  const publicClient = usePublicClient();

  // Read Live Stats
  const { data: stats } = useReadContracts({
    contracts: gameAddress ? [
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'entryFee' },
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizePool' },
    ] : [],
    query: { refetchInterval: 2000 }
  });

  const entryFeeVal = stats?.[0]?.result as bigint;
  const prizePoolVal = stats?.[1]?.result as bigint;
  
  const totalPlayers = (prizePoolVal !== undefined && entryFeeVal !== undefined && entryFeeVal > 0n) 
    ? (prizePoolVal / entryFeeVal).toString() 
    : "0";
  const prizePoolStr = prizePoolVal !== undefined ? formatEther(prizePoolVal) : "0.0";

  // Polling para detectar QuestionRevealed y PrizesCalculated
  useEffect(() => {
    if (!publicClient || !gameAddress) return;

    let lastCheckedBlock = 0n;

    const poll = async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = lastCheckedBlock === 0n
          ? (currentBlock > 9000n ? currentBlock - 9000n : 0n)
          : lastCheckedBlock + 1n > currentBlock ? currentBlock : lastCheckedBlock + 1n;

        // Buscar QuestionRevealed (el profe lanzó la primera pregunta)
        const questionLogs = await publicClient.getContractEvents({
          address: gameAddress as `0x${string}`,
          abi: KahootGameABI.abi,
          eventName: 'QuestionRevealed',
          fromBlock,
          toBlock: 'latest',
        });
        if (questionLogs.length > 0) {
          const log = questionLogs[0] as any;
          const args = log.args;
          const rawQuestion = args.enunciado;
          const parts = rawQuestion.split("||");
          const actualQuestion = parts[0];
          const timeLimit = parts.length > 1 ? Number(parts[1]) : 30;

          const questionData = {
            id: Number(args.questionId),
            question: actualQuestion,
            timeLimit: timeLimit,
            options: args.opciones,
          };
          sessionStorage.setItem("current_question", JSON.stringify(questionData));
          router.push(`/gameplay?game=${gameAddress}`);
          return;
        }

        // Buscar fin del juego
        const endLogs = await publicClient.getContractEvents({
          address: gameAddress as `0x${string}`,
          abi: KahootGameABI.abi,
          eventName: 'PrizesCalculated',
          fromBlock,
          toBlock: 'latest',
        });
        if (endLogs.length > 0) {
          router.push(`/leaderboard?game=${gameAddress}`);
          return;
        }

        lastCheckedBlock = currentBlock;
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(poll, 3500);
    poll();
    return () => clearInterval(interval);
  }, [publicClient, gameAddress]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4 gap-10"
    >

      {/* Success icon */}
      <div className="flex flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.1 }}
          className="relative"
        >
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-400/25"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-200 relative z-10">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 18 }}
              className="text-white text-6xl"
            >
              ✓
            </motion.span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="font-black text-slate-800 text-5xl md:text-6xl tracking-tight mb-3">
            Stand by!
          </h1>
          <p className="text-slate-400 font-semibold text-lg max-w-sm">
            Look at the host screen.
            <br />Waiting for the Professor...
          </p>
        </motion.div>
      </div>

      {/* Live stats card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 200, damping: 24 }}
        className="w-full max-w-sm"
      >
        <div
          className="rounded-[24px] border-[3px] border-white/60 p-6 flex flex-col gap-4"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 40px rgba(124,58,237,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <p className="font-black text-slate-400 text-xs uppercase tracking-widest">Live Stats</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-blue-100 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <span className="font-black text-slate-700">Players Joined</span>
            </div>
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="font-black text-2xl text-blue-600"
            >
              {totalPlayers}
            </motion.span>
          </div>

          <div className="h-[2px] bg-slate-100 rounded-full" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-purple-100 flex items-center justify-center">
                <Coins size={20} className="text-purple-600" />
              </div>
              <span className="font-black text-slate-700">Prize Pool</span>
            </div>
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="font-black text-2xl text-purple-600"
            >
              {prizePoolStr} ETH
            </motion.span>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};
