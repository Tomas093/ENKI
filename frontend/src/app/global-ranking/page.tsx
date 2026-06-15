"use client";
import { motion } from "motion/react";
import { Hexagon, Triangle, Circle, Square, Star, Shield, Zap, Diamond, Cloud, Heart, Loader2 } from "lucide-react";
import { useReadContracts } from "wagmi";
import KahootFactoryABI from "../../abi/KahootFactory.json";

export default function GlobalRanking() {
  const factoryContract = {
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: KahootFactoryABI.abi,
  };

  const calls = [];
  for (let i = 0; i < 10; i++) {
    calls.push({ ...factoryContract, functionName: 'topJugadores', args: [i] });
  }
  for (let i = 0; i < 10; i++) {
    calls.push({ ...factoryContract, functionName: 'topBalances', args: [i] });
  }

  const { data, isLoading } = useReadContracts({
    contracts: calls as any,
  });

  const RANKINGS: any[] = [];
  const COLORS = ["bg-amber-400", "bg-slate-400", "bg-orange-400", "bg-emerald-400", "bg-blue-400", "bg-pink-400", "bg-indigo-400", "bg-violet-400", "bg-rose-400", "bg-cyan-400"];
  const ICONS = [Star, Hexagon, Triangle, Circle, Square, Heart, Shield, Zap, Diamond, Cloud];

  if (data && data.length === 20) {
    for (let i = 0; i < 10; i++) {
      const address = data[i].result as `0x${string}` | undefined;
      const certs = data[i + 10].result as bigint | undefined;
      
      if (address && address !== "0x0000000000000000000000000000000000000000" && certs && certs > BigInt(0)) {
        RANKINGS.push({
          rank: RANKINGS.length + 1,
          address: `${address.slice(0,6)}...${address.slice(-4)}`,
          certs: Number(certs),
          color: COLORS[RANKINGS.length % COLORS.length],
          icon: ICONS[RANKINGS.length % ICONS.length]
        });
      }
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;
  }

  if (RANKINGS.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-4xl font-black text-slate-300">No Diplomas Yet!</h1>
        <p className="text-slate-400 mt-2 font-bold">Be the first one to earn a certificate.</p>
      </div>
    );
  }

  const podiumMid = RANKINGS.length > 0 ? RANKINGS[0] : null;
  const podiumTop = RANKINGS.length > 1 ? RANKINGS[1] : null;
  const podiumBot = RANKINGS.length > 2 ? RANKINGS[2] : null;

  const top3 = [podiumTop, podiumMid, podiumBot].filter(Boolean);
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
