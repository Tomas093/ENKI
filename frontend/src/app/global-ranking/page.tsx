"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useAccount } from "wagmi";
import { useGlobalRanking } from "../../hooks/useGlobalRanking";
import { PlayerRow } from "./components/PlayerRow";
import { PageBlobs } from "../../components/ui/PageBlobs";

export default function GlobalRankingPage() {
  const { address } = useAccount();
  const { data: players = [], isLoading, isError } = useGlobalRanking();

  const playersWithSelf = players.map((p) => ({
    ...p,
    isSelf: !!(address && p.address.toLowerCase() === address.toLowerCase()),
  }));

  return (
    <div className="w-full min-h-full flex flex-col pt-10 pb-16 px-4 md:px-8 relative">
      <PageBlobs primary="purple" secondary="blue" />

      <div className="max-w-3xl mx-auto relative z-10 flex flex-col gap-8">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
            Global Ranking
          </h1>
          <p className="text-slate-500 font-medium mt-3 max-w-md mx-auto leading-relaxed">
            Top performers across all sessions. Collect diplomas to climb the leaderboard.
          </p>
        </motion.div>

        {/* Rankings Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          {/* Table Column Headers */}
          <div className="grid grid-cols-12 px-6 py-4 bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-400 tracking-widest uppercase">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-7">Player</div>
            <div className="col-span-3 text-center">Diplomas</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50 min-h-[280px] relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-purple-500" size={28} strokeWidth={2} />
                <p className="font-medium text-sm">Syncing blockchain data...</p>
              </div>
            ) : isError ? (
              <div className="absolute inset-0 flex items-center justify-center text-red-400 font-medium text-sm">
                Failed to load ranking. Please try again.
              </div>
            ) : playersWithSelf.length > 0 ? (
              playersWithSelf.map((player) => (
                <PlayerRow key={player.rank} player={player} />
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium text-sm">
                No ranking data available yet.
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
