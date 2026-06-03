import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Play, Users, Trophy, Copy, BarChart2, Trash2, Clock } from "lucide-react";

const MOCK_SESSIONS = [
  { id: "ENK-4821", topic: "Blockchain Basics", players: 14, status: "live", started: "2 min ago" },
  { id: "ENK-3310", topic: "DeFi Fundamentals", players: 22, status: "ended", started: "Yesterday" },
  { id: "ENK-7754", topic: "NFT & Digital Ownership", players: 9, status: "ended", started: "3 days ago" },
];

const STATS = [
  { label: "Total Sessions", value: "12", icon: BarChart2, color: "bg-purple-100 text-purple-600" },
  { label: "Total Players", value: "148", icon: Users, color: "bg-blue-100 text-blue-600" },
  { label: "NFTs Awarded", value: "37", icon: Trophy, color: "bg-amber-100 text-amber-600" },
  { label: "Avg. Duration", value: "18m", icon: Clock, color: "bg-emerald-100 text-emerald-600" },
];

export const TeacherDashboard = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pt-8 pb-20 gap-8 relative z-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-slate-800 text-4xl tracking-tight">Host Dashboard</h1>
          <p className="text-slate-400 font-semibold mt-1">Manage your live trivia sessions</p>
        </div>
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-3 rounded-[16px] shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5 cursor-pointer">
          <Plus size={20} />
          New Session
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-[20px] border-[3px] border-slate-100 shadow-sm p-5 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${stat.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="font-black text-slate-800 text-2xl">{stat.value}</div>
                <div className="text-slate-400 font-semibold text-sm">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Sessions list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-800 text-xl">Your Sessions</h2>
          <span className="bg-slate-100 text-slate-500 font-bold text-xs px-3 py-1 rounded-full">{MOCK_SESSIONS.length} total</span>
        </div>

        <div className="divide-y-2 divide-slate-50">
          {MOCK_SESSIONS.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Status dot */}
                <div className={`w-3 h-3 rounded-full shrink-0 ${session.status === "live" ? "bg-emerald-400 shadow-md shadow-emerald-200 animate-pulse" : "bg-slate-300"}`} />

                <div>
                  <div className="font-black text-slate-800 text-base">{session.topic}</div>
                  <div className="text-slate-400 font-semibold text-sm flex items-center gap-2 mt-0.5">
                    <Users size={13} />
                    {session.players} players · {session.started}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* PIN badge */}
                <button
                  onClick={() => handleCopy(session.id)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 font-black text-sm px-3 py-1.5 rounded-[10px] transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  {copied === session.id ? "Copied!" : session.id}
                </button>

                {session.status === "live" ? (
                  <button className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm px-4 py-1.5 rounded-[10px] transition-colors cursor-pointer shadow-sm">
                    <Play size={13} fill="white" />
                    Manage
                  </button>
                ) : (
                  <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 font-bold text-sm px-3 py-1.5 rounded-[10px] transition-colors cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Create new session CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="bg-purple-600 rounded-[24px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-purple-200"
      >
        <div>
          <h3 className="font-black text-white text-2xl mb-1">Ready to host?</h3>
          <p className="text-purple-200 font-semibold">Create a new trivia session and share the PIN with your students.</p>
        </div>
        <button className="shrink-0 flex items-center gap-2 bg-white hover:bg-purple-50 text-purple-700 font-black px-7 py-3.5 rounded-[16px] shadow-md transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap">
          <Plus size={20} />
          New Session
        </button>
      </motion.div>

    </div>
  );
};
