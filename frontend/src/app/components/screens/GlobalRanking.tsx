import { motion } from "motion/react";
import { Hexagon, Triangle, Circle, Square, Star, Shield, Zap, Diamond, Cloud, Heart } from "lucide-react";
import { useReadContracts } from "wagmi";
import { kahootFactoryAbi, FACTORY_ADDRESS } from "../../../lib/contracts";

const SHAPE_ICONS = [Star, Hexagon, Triangle, Circle, Square, Heart, Shield, Zap, Diamond, Cloud];
const PODIUM_COLORS = [
  "bg-amber-400", "bg-slate-400", "bg-orange-400",
  "bg-emerald-400", "bg-blue-400", "bg-pink-400",
  "bg-indigo-400", "bg-violet-400", "bg-rose-400", "bg-cyan-400",
];

function shortAddr(addr: string) {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return null;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export const GlobalRanking = () => {
  // Batch-read the 10 topJugadores and 10 topBalances slots
  const factoryBase = { address: FACTORY_ADDRESS, abi: kahootFactoryAbi } as const;

  const calls = [
    ...[0,1,2,3,4,5,6,7,8,9].map((i) => ({
      ...factoryBase,
      functionName: "topJugadores" as const,
      args: [BigInt(i)] as const,
    })),
    ...[0,1,2,3,4,5,6,7,8,9].map((i) => ({
      ...factoryBase,
      functionName: "topBalances" as const,
      args: [BigInt(i)] as const,
    })),
  ];

  const { data, isLoading } = useReadContracts({ contracts: calls });

  // Parse results: first 10 = addresses, next 10 = balances
  const rankings = Array.from({ length: 10 }, (_, i) => {
    const addrRaw = data?.[i]?.result as string | undefined;
    const bal = data?.[i + 10]?.result as bigint | undefined;
    const display = addrRaw ? shortAddr(addrRaw) : null;
    return {
      rank: i + 1,
      address: display,
      rawAddress: addrRaw,
      certs: bal ? Number(bal) : 0,
      color: PODIUM_COLORS[i],
      icon: SHAPE_ICONS[i],
    };
  }).filter((r) => r.address !== null);

  const top3 = rankings.length >= 3
    ? [rankings[1], rankings[0], rankings[2]]   // Podium order: 2nd, 1st, 3rd
    : rankings.length === 2
    ? [rankings[1], rankings[0]]
    : rankings;

  const list = rankings.slice(3);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto pt-10 pb-20 relative z-10">
      {/* Header */}
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

      {isLoading ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-slate-400 font-semibold">Loading on-chain rankings…</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <span className="text-6xl">🏆</span>
          <p className="text-2xl font-bold text-slate-600">No champions yet</p>
          <p className="text-slate-400">Be the first to win a diploma!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <div className="flex items-end justify-center gap-4 md:gap-8 w-full mb-16 px-4">
            {top3.map((player, index) => {
              const isFirst = player.rank === 1;
              const isSecond = player.rank === 2;
              const height = isFirst ? "h-[340px]" : isSecond ? "h-[290px]" : "h-[270px]";
              const borderColor = isFirst ? "border-amber-400" : isSecond ? "border-slate-300" : "border-orange-400";
              const shadowColor = isFirst ? "shadow-amber-400/20" : isSecond ? "shadow-slate-400/20" : "shadow-orange-400/20";
              const numberColor = isFirst ? "text-amber-500/10" : isSecond ? "text-slate-500/10" : "text-orange-500/10";

              return (
                <motion.div
                  key={player.rank}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-[24px] border-[6px] ${borderColor} ${height} w-full max-w-[280px] flex flex-col items-center justify-center p-6 shadow-2xl ${shadowColor} overflow-hidden transform transition-transform hover:-translate-y-2`}
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className={`text-[200px] font-black ${numberColor} leading-none tracking-tighter`}>{player.rank}</span>
                  </div>
                  <div className="relative z-10 flex flex-col items-center w-full">
                    <div className={`w-20 h-20 rounded-[20px] flex items-center justify-center ${player.color} border-4 border-white shadow-lg mb-4`}>
                      <span className="text-[40px] leading-none select-none">
                        {isFirst ? "🥇" : isSecond ? "🥈" : "🥉"}
                      </span>
                    </div>
                    <div className="font-extrabold text-slate-800 text-xl md:text-2xl mb-6 text-center">{player.address}</div>
                    <div className="bg-slate-50 border-2 border-slate-100 rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm w-full justify-center">
                      <span className="text-xl">🏆</span>
                      <span className="font-black text-slate-700 text-sm md:text-base">{player.certs} Certificates</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* List View (Ranks 4–10) */}
          {list.length > 0 && (
            <div className="w-full max-w-3xl flex flex-col gap-3 px-4">
              {list.map((player, index) => (
                <motion.div
                  key={player.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="group bg-white border-2 border-[#E2E8F0] rounded-[12px] p-4 md:px-6 flex items-center justify-between transition-colors hover:bg-purple-50 hover:border-purple-200 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <span className="font-black text-2xl text-slate-400 w-8 md:w-12 text-center group-hover:text-purple-400 transition-colors">
                      #{player.rank}
                    </span>
                    <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-white ${player.color} shadow-sm`}>
                      <player.icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-slate-700 text-lg md:text-xl">{player.address}</span>
                  </div>
                  <div className="bg-purple-100 text-[#7C3AED] px-4 py-2 rounded-full font-extrabold flex items-center gap-2">
                    <span className="text-lg">🎓</span>
                    <span className="hidden md:inline">{player.certs} Certificates</span>
                    <span className="md:hidden">{player.certs}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
