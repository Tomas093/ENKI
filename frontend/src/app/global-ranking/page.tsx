"use client";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

export default function GlobalRanking() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">
          Global Ranking
        </h1>
        <div className="bg-purple-50 border-2 border-purple-200 rounded-[24px] p-8 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="text-purple-600 animate-spin" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Off-chain Indexer Syncing</h2>
          <p className="text-slate-600 font-medium leading-relaxed">
            We have migrated the global leaderboard off-chain to save you gas fees! 
            The new indexer is currently syncing the historical <b>DiplomaMinted</b> events 
            and will be available shortly.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
