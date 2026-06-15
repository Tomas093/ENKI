"use client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ChevronRight, LayoutDashboard, Trophy } from "lucide-react";

const DESTINATIONS = [
  {
    id: "dashboard",
    icon: <LayoutDashboard size={28} />,
    label: "Host Dashboard",
    subtitle: "Create and manage live trivia sessions.",
    path: "/host/dashboard",
    bg: "bg-purple-50",
    border: "border-purple-200",
    hoverBorder: "hover:border-purple-400",
    hoverBg: "hover:bg-purple-100",
    iconBg: "bg-purple-600",
    iconColor: "text-white",
    badgeText: "text-purple-600",
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

export default function TeacherPortal() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F4F6FA] relative pt-20">
      <main className="relative z-10 flex flex-col items-center flex-1 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="font-black text-slate-800 text-4xl md:text-5xl tracking-tight mb-2">
            Teacher Portal
          </h2>
          <p className="text-slate-400 font-semibold text-lg">
            What would you like to do?
          </p>
        </motion.div>

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
