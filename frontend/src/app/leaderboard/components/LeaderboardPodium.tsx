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
    height: "75%",
    bgClass: "bg-[#FFE234]", // Yellow
    numberClass: "text-black",
    numberSize: "text-[140px]",
    order: "order-2",
  },
  2: {
    height: "55%",
    bgClass: "bg-white", // White
    numberClass: "text-black",
    numberSize: "text-[100px]",
    order: "order-1",
  },
  3: {
    height: "40%",
    bgClass: "bg-[#FF7A00]", // Orange
    numberClass: "text-black",
    numberSize: "text-[80px]",
    order: "order-3",
  },
};

function PodiumAvatars({
  players,
  currentAddress,
}: {
  players: Player[];
  currentAddress?: string;
}) {
  if (players.length === 0) return null;
  const displayPlayers = players.slice(0, 2);
  const extra = players.length - 2;

  return (
    <div className="flex flex-col items-center mb-6">
      {players.length > 1 && (
        <div className="bg-black text-[#4AF626] border-2 border-black text-[11px] font-black px-3 py-1 mb-3 tracking-widest uppercase shadow-[2px_2px_0px_#4AF626]">
          TIE
        </div>
      )}
      <div className="flex gap-2 mb-4">
        {displayPlayers.map((p, i) => {
          const isMe = currentAddress && p.wallet.toLowerCase() === currentAddress.toLowerCase();
          return (
            <div
              key={i}
              className={`w-14 h-14 flex items-center justify-center font-black text-[15px] border-4 border-black ${
                isMe
                  ? "bg-[#FFE234] text-black shadow-[4px_4px_0px_#000] z-10"
                  : "bg-white text-black shadow-[4px_4px_0px_#000]"
              }`}
            >
              {isMe ? "YOU" : p.wallet.slice(2, 4).toUpperCase()}
            </div>
          );
        })}
        {extra > 0 && (
          <div className="w-14 h-14 bg-gray-200 border-4 border-black flex items-center justify-center font-black text-black text-[15px] shadow-[4px_4px_0px_#000]">
            +{extra}
          </div>
        )}
      </div>
      {/* Score Badge */}
      <div className="bg-white border-4 border-black px-3 py-1 font-black text-[14px] uppercase tracking-wider shadow-[4px_4px_0px_#000]">
        {players[0].score} PTS
      </div>
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
        <div className="flex justify-center mb-6 relative">
          <div className="bg-[#FFE234] border-4 border-black p-3 shadow-[6px_6px_0px_#000]">
            <Trophy size={48} className="text-black" strokeWidth={2.5} />
          </div>
        </div>
      )}
      <div className="flex items-end justify-center gap-1 md:gap-4 h-[460px] border-b-8 border-black">
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
                  currentAddress={currentAddress}
                />
              )}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: config.height }}
                transition={{ duration: 0.7, ease: "easeOut", delay: rank === 1 ? 0.1 : rank === 2 ? 0.3 : 0.5 }}
                className={`w-full ${config.bgClass} border-4 border-black border-b-0 relative flex justify-center items-start pt-6 shadow-[8px_0px_0px_#000] z-0`}
              >
                {/* Huge brutalist number */}
                <span
                  className={`${config.numberSize} font-black ${config.numberClass} absolute bottom-[-16px] select-none leading-none opacity-20`}
                >
                  {rank}
                </span>
                
                {/* Prize Badge */}
                {prize > 0n && (
                  <div className={`bg-black text-[#4AF626] border-2 border-black px-4 py-2 font-black text-[13px] tracking-widest uppercase shadow-[4px_4px_0px_#4AF626] relative z-10 -mt-10`}>
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
