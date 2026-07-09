"use client";
import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { formatEther } from "viem";
import { Player } from "../../../hooks/useFinalLeaderboard";

interface PodiumStepProps {
  rank: 1 | 2 | 3;
  players: Player[];
  prize: bigint;
  currentAddress?: string;
}

const podiumConfig = {
  1: {
    height: "70%",
    bgClass: "bg-gradient-to-t from-amber-200 to-amber-300",
    borderClass: "border-amber-400",
    numberClass: "text-amber-400/40",
    numberSize: "text-9xl",
    prizeTextClass: "text-amber-900",
    scoreClass: "text-amber-600",
    order: "order-2",
  },
  2: {
    height: "50%",
    bgClass: "bg-slate-200",
    borderClass: "border-slate-300",
    numberClass: "text-slate-300/60",
    numberSize: "text-7xl",
    prizeTextClass: "text-slate-700",
    scoreClass: "text-slate-500",
    order: "order-1",
  },
  3: {
    height: "38%",
    bgClass: "bg-orange-200",
    borderClass: "border-orange-300",
    numberClass: "text-orange-300/60",
    numberSize: "text-7xl",
    prizeTextClass: "text-orange-900",
    scoreClass: "text-orange-600",
    order: "order-3",
  },
};

function PodiumAvatars({
  players,
  scoreClass,
  currentAddress,
}: {
  players: Player[];
  scoreClass: string;
  currentAddress?: string;
}) {
  if (players.length === 0) return null;
  const displayPlayers = players.slice(0, 2);
  const extra = players.length - 2;

  return (
    <div className="flex flex-col items-center mb-5">
      {players.length > 1 && (
        <div className="bg-slate-800 text-white text-[9px] font-black px-2.5 py-1 rounded-full mb-2.5 tracking-widest uppercase">
          TIE
        </div>
      )}
      <div className="flex -space-x-2 mb-2.5">
        {displayPlayers.map((p, i) => {
          const isMe = currentAddress && p.wallet.toLowerCase() === currentAddress.toLowerCase();
          return (
            <div
              key={i}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white ${
                isMe
                  ? "bg-amber-100 border border-amber-200 text-amber-700"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {isMe ? "YOU" : p.wallet.slice(2, 4).toUpperCase()}
            </div>
          );
        })}
        {extra > 0 && (
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm shadow-sm ring-2 ring-white">
            +{extra}
          </div>
        )}
      </div>
      <span className={`font-black ${scoreClass} text-base`}>
        {players[0].score} pts
      </span>
    </div>
  );
}

export function LeaderboardPodium({
  rank1Players,
  rank2Players,
  rank3Players,
  prizes,
  currentAddress,
}: {
  rank1Players: Player[];
  rank2Players: Player[];
  rank3Players: Player[];
  prizes: bigint[];
  currentAddress?: string;
}) {
  const steps: { rank: 1 | 2 | 3; players: Player[]; prize: bigint }[] = [
    { rank: 2, players: rank2Players, prize: prizes[1] },
    { rank: 1, players: rank1Players, prize: prizes[0] },
    { rank: 3, players: rank3Players, prize: prizes[2] },
  ];

  return (
    <div className="flex flex-col w-full">
      {rank1Players.length > 0 && (
        <div className="flex justify-center mb-3">
          <Trophy size={44} className="text-amber-400 drop-shadow-md" fill="currentColor" />
        </div>
      )}
      <div className="flex items-end justify-center gap-3 md:gap-5 h-[420px] border-b-2 border-slate-200">
        {steps.map(({ rank, players, prize }) => {
          const config = podiumConfig[rank];
          return (
            <div
              key={rank}
              className={`flex-1 flex flex-col items-center justify-end h-full ${config.order}`}
            >
              {players.length > 0 && (
                <PodiumAvatars
                  players={players}
                  scoreClass={config.scoreClass}
                  currentAddress={currentAddress}
                />
              )}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: config.height }}
                transition={{ duration: 0.7, ease: "easeOut", delay: rank === 1 ? 0.1 : rank === 2 ? 0.3 : 0.5 }}
                className={`w-full ${config.bgClass} rounded-t-2xl border-t ${config.borderClass} relative overflow-hidden flex justify-center items-start pt-5 shadow-sm`}
              >
                <span
                  className={`${config.numberSize} font-black ${config.numberClass} absolute bottom-[-12px] select-none`}
                >
                  {rank}
                </span>
                {prize > 0n && (
                  <div className={`bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full ${config.prizeTextClass} font-bold text-xs shadow-sm relative z-10`}>
                    {formatEther(prize)} ETH
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
