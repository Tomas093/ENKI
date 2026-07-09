"use client";
import { useEffect, useState } from "react";
import { Trophy, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalRankingPreview } from "../../hooks/useGlobalRankingPreview";

export function GlobalRankingPreview() {
  const router = useRouter();
  const { diplomasWon, isConnected, isLoading } = useGlobalRankingPreview();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const renderStats = () => {
    if (!mounted || !isConnected) {
      return (
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
          // Connect wallet to see your stats
        </p>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
          <Loader2 size={12} className="animate-spin text-black" />
          <span>// Syncing chain data…</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-2 py-1 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_#000]">
        <Trophy size={12} strokeWidth={3} />
        {diplomasWon} {diplomasWon === 1 ? "Diploma" : "Diplomas"}
      </div>
    );
  };

  return (
    <div className="border-2 border-black bg-white shadow-[6px_6px_0px_#000] p-6 flex flex-col justify-between min-h-[220px]">
      {/* Header */}
      <div>
        <div className="w-11 h-11 border-2 border-black bg-white shadow-[3px_3px_0px_#000] flex items-center justify-center mb-5 text-black">
          <Trophy size={20} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-[-0.03em] leading-[0.88] text-black mb-2">
          Global Ranking
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-gray-500 mb-5">
          // Top performers across all sessions
        </p>

        {renderStats()}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/global-ranking")}
        className="mt-6 w-full py-4 px-5 bg-white border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-neo-accent active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-between text-black font-black text-[11px] uppercase tracking-[0.1em] transition-all group/btn"
      >
        <span>View Leaderboard</span>
        <ArrowRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
