"use client";
import { Trophy, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalRankingPreview } from "../../hooks/useGlobalRankingPreview";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

export function GlobalRankingPreview() {
  const router = useRouter();
  const { diplomasWon, isConnected } = useGlobalRankingPreview();

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
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-1">
          Global Ranking
        </h2>
        <p className="text-slate-500 font-medium text-sm mb-5 leading-relaxed">
          Top performers across all sessions.
        </p>

        {isConnected ? (
          <Badge variant="purple">
            <Trophy size={12} />
            {diplomasWon} {diplomasWon === 1 ? "Diploma" : "Diplomas"}
          </Badge>
        ) : (
          <p className="text-sm text-slate-400 font-medium">
            Connect wallet to see your stats
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/global-ranking")}
        className="mt-6 w-full py-3.5 px-5 bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 rounded-xl flex items-center justify-between text-slate-600 hover:text-purple-700 font-bold text-sm transition-all duration-200 group/btn"
      >
        <span>View Leaderboard</span>
        <ArrowRight size={18} className="transform group-hover/btn:translate-x-1 transition-transform duration-200" />
      </button>
    </Card>
  );
}
