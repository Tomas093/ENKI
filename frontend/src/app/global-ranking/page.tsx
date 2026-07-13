"use client";

import { Loader2, Globe } from "lucide-react";
import { motion } from "motion/react";
import { useAccount } from "wagmi";
import { useGlobalRanking } from '@/features/game/useGlobalRanking';
import { PlayerRow } from '@/features/game/PlayerRow';

export default function GlobalRankingPage() {
  const { address } = useAccount();
  const { data: players = [], isLoading, isError } = useGlobalRanking();

  const playersWithSelf = players.map((p) => ({
    ...p,
    isSelf: !!(address && p.address.toLowerCase() === address.toLowerCase()),
  }));

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col pt-10 pb-16 px-4 md:px-8 relative bg-[#F4F4F0] overflow-hidden">
      {/* Brutalist Dot Grid Background */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10 flex flex-col gap-8 w-full">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#FFE234] border-4 border-black p-2 shadow-[4px_4px_0px_#000]">
                <Globe size={32} strokeWidth={2.5} className="text-black" />
              </div>
              <div className="bg-black text-[#4AF626] border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-wide shadow-[2px_2px_0px_#4AF626]">
                Hall of Fame
              </div>
            </div>
            <h1 className="font-black text-5xl md:text-6xl text-black uppercase tracking-tight leading-[0.9]">
              Global<br/>Ranking
            </h1>
          </div>
          
          <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_#000] max-w-sm">
            <p className="font-bold text-sm text-gray-600 uppercase tracking-wide">
              Top performers across all sessions. Collect NFTs to climb the leaderboard.
            </p>
          </div>
        </motion.div>

        {/* Rankings Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-4 border-black shadow-[12px_12px_0px_#000] flex flex-col"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 py-4 md:px-8 bg-black text-white font-black text-sm uppercase tracking-wide border-b-4 border-black">
            <div className="col-span-3 md:col-span-2 text-center">Rank</div>
            <div className="col-span-6 md:col-span-7">Player Info</div>
            <div className="col-span-3 text-center">Score</div>
          </div>

          {/* Rows */}
          <div className="flex flex-col min-h-[400px] relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white z-20">
                <div className="w-16 h-16 border-4 border-black bg-[#00E5FF] shadow-[4px_4px_0px_#000] flex items-center justify-center">
                  <Loader2 className="animate-spin text-black" size={32} strokeWidth={3} />
                </div>
                <p className="font-black text-sm uppercase tracking-wide text-black">Syncing On-Chain Data...</p>
              </div>
            ) : isError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white z-20">
                <div className="bg-[#FF3366] text-white border-4 border-black px-6 py-4 font-black text-xl uppercase shadow-[6px_6px_0px_#000]">
                  Failed to load ranking
                </div>
              </div>
            ) : playersWithSelf.length > 0 ? (
              playersWithSelf.map((player) => (
                <PlayerRow key={player.rank} player={player} />
              ))
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white z-20">
                <div className="bg-gray-200 border-4 border-black p-6 font-black text-xl text-gray-500 uppercase tracking-wide text-center shadow-[6px_6px_0px_#000]">
                  NO PLAYERS FOUND.<br/>BE THE FIRST.
                </div>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
