import React from "react";
import { Crown, Award } from "lucide-react";
import { GlobalPlayer } from "../../../hooks/useGlobalRanking";

const RANK_COLORS: Record<number, string> = {
  1: "bg-[#FFE234]", // Yellow
  2: "bg-white",
  3: "bg-[#FF7A00]", // Orange
};

export function PlayerRow({ player }: { player: GlobalPlayer }) {
  const isTop = player.rank <= 3;
  const isMe = player.isSelf;

  return (
    <div
      className={`grid grid-cols-12 px-4 py-4 md:px-8 md:py-6 items-center border-b-4 border-black last:border-b-0 transition-colors ${
        isMe ? "bg-neo-accent" : "bg-white hover:bg-gray-50"
      }`}
    >
      {/* Rank */}
      <div className="col-span-3 md:col-span-2 flex justify-center">
        {isTop ? (
          <div
            className={`w-12 h-12 md:w-14 md:h-14 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] ${
              RANK_COLORS[player.rank]
            }`}
          >
            {player.rank === 1 ? (
              <Crown size={24} className="text-black" strokeWidth={3} />
            ) : (
              <span className="font-black text-xl md:text-2xl text-black">#{player.rank}</span>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 md:w-14 md:h-14 border-4 border-black bg-gray-200 flex items-center justify-center">
            <span className="font-black text-lg md:text-xl text-black">#{player.rank}</span>
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="col-span-6 md:col-span-7 flex items-center gap-4">
        <div
          className={`w-12 h-12 md:w-14 md:h-14 border-4 border-black flex items-center justify-center text-black font-black text-xl md:text-2xl shadow-[4px_4px_0px_#000] ${
            isMe ? "bg-[#4AF626]" : isTop ? "bg-[#00E5FF]" : "bg-white"
          }`}
        >
          {player.ens.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="font-black text-black text-base md:text-xl uppercase tracking-tight flex items-center gap-2 flex-wrap">
            <span className="truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">{player.ens}</span>
            {isMe && (
              <span className="bg-black text-[#4AF626] text-xs md:text-xs px-2 py-0.5 uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_#4AF626] shrink-0">
                YOU
              </span>
            )}
          </div>
          <div className="text-gray-500 font-mono text-xs md:text-xs truncate max-w-[120px] md:max-w-[200px]">
            {player.address}
          </div>
        </div>
      </div>

      {/* Diplomas */}
      <div className="col-span-3 flex justify-center items-center gap-2">
        <div className="flex flex-col items-center justify-center bg-white border-4 border-black px-2 py-2 md:px-4 md:py-2 shadow-[4px_4px_0px_#000] min-w-[80px]">
          <span className="font-black text-xs md:text-xs text-gray-400 uppercase tracking-wide leading-none mb-1">
            Diplomas
          </span>
          <div className="flex items-center gap-1.5">
            <Award size={18} strokeWidth={3} className={isTop ? "text-black" : "text-gray-400"} />
            <span className={`font-black text-lg md:text-2xl leading-none ${isTop ? "text-black" : "text-gray-600"}`}>
              {player.diplomas}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
