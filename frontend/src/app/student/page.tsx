"use client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ChevronRight, PlayCircle, Trophy, User, Hash } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import KahootFactoryABI from "../../abi/KahootFactory.json";

const DESTINATIONS = [
  {
    id: "join",
    icon: <PlayCircle size={28} />,
    label: "Join Game",
    subtitle: "Enter a PIN to play and win ETH.",
    path: "/staking",
    bg: "bg-blue-50",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    hoverBg: "hover:bg-blue-100",
    iconBg: "bg-blue-500",
    iconColor: "text-white",
    badgeText: "text-blue-600",
  },
  {
    id: "ranking",
    icon: <Trophy size={28} />,
    label: "Global Ranking",
    subtitle: "View the top NFT certificate holders.",
    path: "/global-ranking",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hoverBorder: "hover:border-amber-400",
    hoverBg: "hover:bg-amber-100",
    iconBg: "bg-amber-500",
    iconColor: "text-white",
    badgeText: "text-amber-600",
  },
];

export default function StudentPortal() {
  const router = useRouter();
  const { address } = useAccount();

  const { data: diplomasWon } = useReadContract({
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: KahootFactoryABI.abi,
    functionName: 'totalDiplomasWon',
    args: address ? [address] : undefined,
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F4F6FA] relative pt-12">
      <main className="relative z-10 flex flex-col items-center flex-1 px-4 gap-8">
        
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl bg-white rounded-[32px] border-[3px] border-blue-100 shadow-sm p-8 flex flex-col md:flex-row items-center gap-8"
        >
          <div className="w-24 h-24 rounded-[24px] bg-blue-100 flex items-center justify-center text-blue-600 border-[3px] border-blue-200 shrink-0">
            <User size={48} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-black text-slate-800 text-3xl mb-1">My Profile</h2>
            <p className="text-slate-400 font-bold font-mono text-sm mb-4">
              {address ? `${address.slice(0,6)}...${address.slice(-4)}` : "Not connected"}
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl px-6 py-3 flex items-center gap-3">
                <Trophy className="text-amber-500" size={20} />
                <div>
                  <div className="font-black text-2xl text-amber-700 leading-none">{Number(diplomasWon) || 0}</div>
                  <div className="font-bold text-xs text-amber-600/60 uppercase tracking-wider mt-1">Diplomas Won</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="flex flex-col md:flex-row gap-5 w-full max-w-3xl">
          {DESTINATIONS.map((dest, i) => (
            <motion.button
              key={dest.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => router.push(dest.path)}
              className={`group flex-1 ${dest.bg} border-[3px] ${dest.border} ${dest.hoverBorder} ${dest.hoverBg} rounded-[24px] p-7 flex flex-col items-start gap-5 text-left transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer`}
            >
              <div className={`w-16 h-16 rounded-[18px] ${dest.iconBg} ${dest.iconColor} flex items-center justify-center text-3xl shadow-md -rotate-3 group-hover:rotate-0 transition-transform duration-200`}>
                {dest.icon}
              </div>

              <div>
                <div className="font-black text-slate-800 text-2xl mb-1 tracking-tight">
                  {dest.label}
                </div>
                <div className={`font-semibold text-sm ${dest.badgeText}`}>
                  {dest.subtitle}
                </div>
              </div>

              <div className="mt-auto self-end">
                <div className={`w-9 h-9 rounded-full border-2 ${dest.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <ChevronRight size={18} className={dest.badgeText} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

      </main>
    </div>
  );
}
