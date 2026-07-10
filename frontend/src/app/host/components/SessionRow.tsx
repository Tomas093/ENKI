"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Copy } from "lucide-react";
import { useReadContract } from "wagmi";
import KahootGameABI from "../../../abi/KahootGame.json";

export function SessionRow({ gameAddress, gameId }: { gameAddress: `0x${string}`; gameId?: number }) {
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
    const copyValue = gameId !== undefined ? gameId.toString() : gameAddress;
    navigator.clipboard.writeText(copyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      onClick={() => router.push(`/host/dashboard/${gameAddress}`)}
      className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:bg-neo-bg transition-colors cursor-pointer border-b-2 border-black last:border-b-0"
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 border-2 border-black bg-white flex items-center justify-center shrink-0 shadow-[4px_4px_0px_#000]">
          {isFinished ? (
            <div className="w-3.5 h-3.5 bg-black border border-black" />
          ) : (
            <div className="w-3.5 h-3.5 bg-[#39FF14] border border-black animate-pulse shadow-[0_0_14px_#39FF14]" />
          )}
        </div>

        <div>
          <div className="font-black text-xl uppercase tracking-[-0.03em] text-black flex flex-wrap items-center gap-3">
            {name}
            {gameId !== undefined && (
              <span className="bg-neo-accent border-2 border-black px-2 py-1 font-black text-xs shadow-[2px_2px_0px_#000] uppercase tracking-wide no-underline">
                ID: {gameId}
              </span>
            )}
          </div>
          <div className="font-mono text-sm uppercase tracking-wide flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 text-black">
              <Users size={14} strokeWidth={2.5} />
              {players} players
            </span>
            <span className="w-1.5 h-1.5 bg-black" />
            {isFinished ? (
              <span className="text-gray-500 font-bold">Ended</span>
            ) : (
              <span className="bg-[#4AF626] text-black border-2 border-black px-2 py-0.5 font-black shadow-[2px_2px_0px_#000] leading-none">
                Live Now
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto" onClick={e => e.stopPropagation()}>
        <button 
          onClick={handleCopy} 
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 border-2 border-black font-black text-sm uppercase tracking-wider px-4 py-3 shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${
            copied ? "bg-[#4AF626] text-black" : "bg-white hover:bg-neo-accent text-black"
          }`}
        >
          <Copy size={16} strokeWidth={2.5} />
          {copied 
            ? "Copied ID!" 
            : gameId !== undefined 
              ? `Game ID: ${gameId}` 
              : `${gameAddress.slice(0, 6)}...${gameAddress.slice(-4)}`
          }
        </button>
      </div>
    </div>
  );
}
