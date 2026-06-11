"use client";
import { motion } from "motion/react";
import { Hexagon, Triangle, Circle, Square, Star, Shield, Zap, Diamond, Cloud, Heart } from "lucide-react";

// Mock data
const RANKINGS = [
  { rank: 1, address: "0x71C...B29", certs: 42, color: "bg-amber-400", icon: Star },
  { rank: 2, address: "0x4A2...1F8", certs: 38, color: "bg-slate-400", icon: Hexagon },
  { rank: 3, address: "0x9B1...C44", certs: 35, color: "bg-orange-400", icon: Triangle },
  { rank: 4, address: "0x8F5...E21", certs: 29, color: "bg-emerald-400", icon: Circle },
  { rank: 5, address: "0x3D8...A99", certs: 24, color: "bg-blue-400", icon: Square },
  { rank: 6, address: "0x2C4...D77", certs: 21, color: "bg-pink-400", icon: Heart },
  { rank: 7, address: "0x5E9...F11", certs: 18, color: "bg-indigo-400", icon: Shield },
  { rank: 8, address: "0x1A7...B33", certs: 15, color: "bg-violet-400", icon: Zap },
  { rank: 9, address: "0x6B2...C88", certs: 12, color: "bg-rose-400", icon: Diamond },
  { rank: 10, address: "0x9D3...E55", certs: 10, color: "bg-cyan-400", icon: Cloud },
];

export default function GlobalRanking() {
  const top3 = [RANKINGS[1], RANKINGS[0], RANKINGS[2]]; // Ordered for Podium: 2nd, 1st, 3rd
  const list = RANKINGS.slice(3);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto pt-10 pb-20 relative z-10">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
          Top 10 Trivia Scholars
        </h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
          The ultimate leaderboard of players with the most on-chain NFT Certificates.
        </p>
      </motion.div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4 md:gap-8 w-full mb-16 px-4">
        {top3.map((player, index) => {
          const isFirst = player.rank === 1;
          const isSecond = player.rank === 2;
          
          const height = isFirst ? 'h-[340px]' : isSecond ? 'h-[290px]' : 'h-[270px]';
          const borderColor = isFirst ? 'border-amber-400' : isSecond ? 'border-slate-300' : 'border-orange-400';
          const shadowColor = isFirst ? 'shadow-amber-400/20' : isSecond ? 'shadow-slate-400/20' : 'shadow-orange-400/20';
          const numberColor = isFirst ? 'text-amber-500/10' : isSecond ? 'text-slate-500/10' : 'text-orange-500/10';
          
          return (
            <motion.div 
              key={player.rank}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-[24px] border-[6px] ${borderColor} ${height} w-full max-w-[280px] flex flex-col items-center justify-center p-6 shadow-2xl ${shadowColor} overflow-hidden transform transition-transform hover:-translate-y-2`}
            >
              {/* Massive Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-[200px] font-black ${numberColor} leading-none tracking-tighter`}>
                  {player.rank}
                </span>
              </div>
              
              {/* Card Content */}
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className={`w-20 h-20 rounded-[20px] flex items-center justify-center ${player.color} border-4 border-white shadow-lg mb-4 transform ${isFirst ? 'rotate-0 scale-110' : isSecond ? '-rotate-6' : 'rotate-6'}`}>
                  <span className="text-[40px] leading-none select-none">
                    {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                  </span>
                </div>
                
                <div className="font-extrabold text-slate-800 text-xl md:text-2xl mb-6 text-center">
                  {player.address}
                </div>
                
                <div className="bg-slate-50 border-2 border-slate-100 rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm w-full justify-center">
                  <span className="text-xl">🏆</span>
                  <span className="font-black text-slate-700 text-sm md:text-base">{player.certs} Certificates</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* List View (Ranks 4 to 10) */}
      <div className="w-full max-w-3xl flex flex-col gap-3 px-4">
        {list.map((player, index) => (
          <motion.div 
            key={player.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + (index * 0.05) }}
            className="group bg-white border-2 border-[#E2E8F0] rounded-[12px] p-4 md:px-6 flex items-center justify-between transition-colors hover:bg-purple-50 hover:border-purple-200 cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4 md:gap-6">
              <span className="font-black text-2xl text-slate-400 w-8 md:w-12 text-center group-hover:text-purple-400 transition-colors">
                #{player.rank}
              </span>
              
              <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-white ${player.color} shadow-sm transform -rotate-3 group-hover:rotate-0 transition-transform`}>
                <player.icon size={20} strokeWidth={2.5} />
              </div>
              
              <span className="font-bold text-slate-700 text-lg md:text-xl">
                {player.address}
              </span>
            </div>
            
            <div className="bg-purple-100 text-[#7C3AED] px-4 py-2 rounded-full font-extrabold flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <span className="hidden md:inline">{player.certs} Certificates</span>
              <span className="md:hidden">{player.certs}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
