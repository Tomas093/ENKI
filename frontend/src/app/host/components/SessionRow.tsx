"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Copy } from "lucide-react";
import { useReadContract } from "wagmi";
import KahootGameABI from "../../../abi/KahootGame.json";

export function SessionRow({ gameAddress }: { gameAddress: `0x${string}` }) {
  const router = useRouter();
  const [copied, setCopied] = useState<boolean>(false);

  // Clean Architecture: Isolated Use Cases for reading game properties
  const { data: nameData } = useReadContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'gameName' });
  const { data: finishedData } = useReadContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'isFinished' });
  const { data: prizePoolData } = useReadContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'prizePool' });
  const { data: entryFeeData } = useReadContract({ address: gameAddress, abi: KahootGameABI.abi, functionName: 'entryFee' });

  const name = (nameData as string) || "Loading Session...";
  const prizePool = Number(prizePoolData) || 0;
  const entryFee = Number(entryFeeData) || 0;
  const players = entryFee > 0 ? Math.floor(prizePool / entryFee) : 0;
  const isFinished = finishedData as boolean;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(gameAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      onClick={() => router.push(`/host/dashboard/${gameAddress}`)}
      className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
          isFinished 
            ? "bg-slate-100 border-slate-200" 
            : "bg-emerald-50 border-emerald-100 text-emerald-600"
        }`}>
          {isFinished ? (
            <div className="w-3 h-3 rounded-full bg-slate-300" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>

        <div>
          <div className="font-extrabold text-slate-800 text-lg group-hover:text-purple-700 transition-colors">
            {name}
          </div>
          <div className="text-slate-500 font-medium text-sm flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-slate-400" />
              {players} players
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className={isFinished ? "text-slate-400" : "text-emerald-600 font-bold"}>
              {isFinished ? "Ended" : "Live Now"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto" onClick={e => e.stopPropagation()}>
        <button 
          onClick={handleCopy} 
          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors border border-slate-200 hover:border-purple-200 shadow-sm"
        >
          <Copy size={16} />
          {copied ? "Copied ID!" : `${gameAddress.slice(0, 6)}...${gameAddress.slice(-4)}`}
        </button>
      </div>
    </div>
  );
}
