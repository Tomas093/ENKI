"use client";

import React, { useState } from "react";
import { Trophy, Medal, Crown, Sparkles, ChevronLeft, Search, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useGlobalRanking, GlobalPlayer } from "../../hooks/useGlobalRanking";

const MEDAL_ICONS: Record<number, React.ReactNode> = {
  1: <Crown size={18} style={{ color: "#F97316" }} />,
  2: <Medal size={18} style={{ color: "#94a3b8" }} />,
  3: <Medal size={18} style={{ color: "#06B6D4" }} />,
};

export default function GlobalRankingPage() {
  const { address } = useAccount();
  const { data: players = [], isLoading, isError } = useGlobalRanking();

  // Flag the current user
  const playersWithSelf = players.map(p => ({
    ...p,
    isSelf: address && p.address.toLowerCase() === address.toLowerCase()
  }));

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-semibold text-sm">Back to Home</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
            Global Ranking
          </h1>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto">
            The top performers across all games. Compete, win prizes, and collect diplomas to climb the leaderboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden min-h-[400px]"
        >
          {/* Header */}
          <div className="grid grid-cols-12 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 tracking-wider uppercase">
            <div className="col-span-3 md:col-span-2 text-center">Rank</div>
            <div className="col-span-6 md:col-span-7">Player</div>
            <div className="col-span-3 md:col-span-3 text-center">Diplomas</div>
          </div>

          {/* List or Loading State */}
          <div className="divide-y divide-slate-100 relative min-h-[300px]">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="animate-spin mb-4 text-purple-500" size={32} />
                <p>Syncing blockchain data...</p>
              </div>
            ) : isError ? (
              <div className="absolute inset-0 flex items-center justify-center text-red-500">
                <p>Failed to load global ranking from the network.</p>
              </div>
            ) : playersWithSelf.length > 0 ? (
              playersWithSelf.map((player) => (
                <PlayerRow key={player.rank} player={player} />
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                <p>No ranking data available yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function PlayerRow({ player }: { player: GlobalPlayer }) {
  const isTop = player.rank <= 3;
  
  return (
    <div
      className={`grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 transition-colors ${
        player.isSelf ? "bg-purple-50/50" : ""
      }`}
    >
      <div className="col-span-3 md:col-span-2 flex justify-center">
        {isTop ? (
          <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
            {MEDAL_ICONS[player.rank]}
          </div>
        ) : (
          <span className="text-slate-400 font-bold text-sm">#{player.rank}</span>
        )}
      </div>

      <div className="col-span-6 md:col-span-7 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm
            ${player.isSelf ? "bg-purple-500" : isTop ? "bg-slate-800" : "bg-slate-300"}
          `}
        >
          {player.ens.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
            {player.ens}
            {player.isSelf && (
              <span className="bg-purple-100 text-purple-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                You
              </span>
            )}
          </div>
          <div className="text-slate-400 text-xs font-mono">{player.address}</div>
        </div>
      </div>

      <div className="col-span-3 md:col-span-3 flex justify-center items-center gap-1.5">
        <Sparkles size={14} className={isTop ? "text-amber-500" : "text-slate-400"} />
        <span className={`font-bold ${isTop ? "text-amber-600" : "text-slate-600"}`}>
          {player.diplomas}
        </span>
      </div>
    </div>
  );
}
