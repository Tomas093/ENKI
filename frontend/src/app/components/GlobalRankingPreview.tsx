"use client";
import { useEffect, useState } from "react";
import { Trophy, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalRankingPreview } from "../../hooks/useGlobalRankingPreview";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export function GlobalRankingPreview() {
  const router = useRouter();
  const { diplomasWon, isConnected, isLoading } = useGlobalRankingPreview();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const renderStats = () => {
    // Before hydration: always show the neutral state to match SSR
    if (!mounted) {
      return (
        <p className="text-sm text-slate-400 font-medium">
          Connect wallet to see your stats
        </p>
      );
    }

    if (!isConnected) {
      return (
        <p className="text-sm text-slate-400 font-medium">
          Connect wallet to see your stats
        </p>
      );
    }

    // Wallet connected but ranking data is still loading from chain
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <Loader2 size={14} className="animate-spin text-purple-400" />
          <span>Syncing chain data…</span>
        </div>
      );
    }

    return (
      <Badge variant="purple">
        <Trophy size={12} />
        {diplomasWon} {diplomasWon === 1 ? "Diploma" : "Diplomas"}
      </Badge>
    );
  };

  return (
    <Card
      variant="elevated"
      padding="md"
      className="group hover:border-purple-100 transition-colors duration-200 flex flex-col justify-between min-h-[220px]"
    >
      {/* Header */}
      <div>
        <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-5 border border-purple-100">
          <Trophy size={22} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">
          Global Ranking
        </h2>
        <p className="text-slate-600 font-medium text-base mb-5 leading-relaxed">
          Top performers across all sessions.
        </p>

        {renderStats()}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/global-ranking")}
        className="mt-6 w-full py-4 px-5 bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 rounded-xl flex items-center justify-between text-slate-600 hover:text-purple-700 font-bold text-base transition-all duration-200 group/btn"
      >
        <span>View Leaderboard</span>
        <ArrowRight size={18} className="transform group-hover/btn:translate-x-1 transition-transform duration-200" />
      </button>
    </Card>
  );
}
