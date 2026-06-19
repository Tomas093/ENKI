"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Plus, RotateCcw, Users, Copy, Trash2 } from "lucide-react";

import { useAccount, useReadContract } from "wagmi";
import KahootFactoryABI from "../../../abi/KahootFactory.json";
import KahootGameABI from "../../../abi/KahootGame.json";

function SessionRow({ gameAddress }: { gameAddress: `0x${string}` }) {
  const router = useRouter();
  const [copied, setCopied] = useState<boolean>(false);

  const { data: nameData } = useReadContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'gameName' });
  const { data: finishedData } = useReadContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'isFinished' });
  const { data: prizePoolData } = useReadContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'prizePool' });
  const { data: entryFeeData } = useReadContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'entryFee' });

  const name = (nameData as string) || "Loading...";
  const prizePool = Number(prizePoolData) || 0;
  const entryFee = Number(entryFeeData) || 0;
  const players = entryFee > 0 ? Math.floor(prizePool / entryFee) : 0;
  const isFinished = finishedData as boolean;

  const handleCopy = (e: any) => {
    e.stopPropagation();
    navigator.clipboard.writeText(gameAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => router.push(`/teacher/session/${gameAddress}`)}
      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full shrink-0 ${!isFinished ? "bg-emerald-400 shadow-md shadow-emerald-200 animate-pulse" : "bg-slate-300"}`} />
        <div>
          <div className="font-black text-slate-800 text-base">{name}</div>
          <div className="text-slate-400 font-semibold text-sm flex items-center gap-2 mt-0.5">
            <Users size={13} />
            {players} players · {isFinished ? "Ended" : "Live"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
        <button onClick={handleCopy} className="flex items-center gap-1.5 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 font-black text-sm px-3 py-1.5 rounded-[10px] transition-colors cursor-pointer">
          <Copy size={13} />
          {copied ? "Copied!" : `${gameAddress.slice(0, 6)}...${gameAddress.slice(-4)}`}
        </button>
      </div>
    </motion.div>
  );
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { address } = useAccount();

  const { data: kahoots } = useReadContract({
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: KahootFactoryABI.abi,
    functionName: 'getKahootsDeProfesor',
    args: address ? [address] : undefined,
  });

  const gameAddresses = (kahoots as `0x${string}`[]) || [];


  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pt-8 pb-20 gap-8 relative z-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-slate-800 text-4xl tracking-tight">Host Dashboard</h1>
          <p className="text-slate-400 font-semibold mt-1">Manage your live trivia sessions</p>
        </div>
        <button
          onClick={() => router.push("/teacher/create")}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-3 rounded-[16px] shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={20} />
          New Session
        </button>
      </motion.div>

      {/* Sessions list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-800 text-xl">Your Sessions</h2>
          <span className="bg-slate-100 text-slate-500 font-bold text-xs px-3 py-1 rounded-full">{gameAddresses.length} total</span>
        </div>

        <div className="divide-y-2 divide-slate-50">
          {gameAddresses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-bold">No sessions yet. Create one!</div>
          ) : (
            gameAddresses.slice().reverse().map((addr, i) => (
              <SessionRow key={addr} gameAddress={addr} />
            ))
          )}
        </div>
      </motion.div>


    </div>
  );
};
