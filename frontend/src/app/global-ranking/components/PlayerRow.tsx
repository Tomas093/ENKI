import React from "react";
import { Medal, Crown, Sparkles } from "lucide-react";
import { GlobalPlayer } from "../../../hooks/useGlobalRanking";

const MEDAL_ICONS: Record<number, React.ReactNode> = {
  1: <Crown size={18} style={{ color: "#F97316" }} />,
  2: <Medal size={18} style={{ color: "#94a3b8" }} />,
  3: <Medal size={18} style={{ color: "#06B6D4" }} />,
};

export function PlayerRow({ player }: { player: GlobalPlayer }) {
  const isTop = player.rank <= 3;
  
  return (
    <div
      className={`grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 transition-colors ${
        player.isSelf ? "bg-purple-50/50" : ""
      }`}
    >
      <div className="col-span-3 md:col-span-2 flex justify-center">
        {isTop ? (
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
            {MEDAL_ICONS[player.rank]}
          </div>
        ) : (
          <span className="text-slate-400 font-bold text-sm">#{player.rank}</span>
        )}
      </div>

      <div className="col-span-6 md:col-span-7 flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm
            ${player.isSelf ? "bg-purple-600 ring-2 ring-purple-200" : isTop ? "bg-slate-800" : "bg-slate-300"}
          `}
        >
          {player.ens.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            {player.ens}
            {player.isSelf && (
              <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
                You
              </span>
            )}
          </div>
          <div className="text-slate-400 text-xs font-medium">{player.address}</div>
        </div>
      </div>

      <div className="col-span-3 md:col-span-3 flex justify-center items-center gap-1.5">
        <Sparkles size={16} className={isTop ? "text-amber-500" : "text-slate-400"} />
        <span className={`font-black text-lg ${isTop ? "text-amber-600" : "text-slate-600"}`}>
          {player.diplomas}
        </span>
      </div>
    </div>
  );
}
