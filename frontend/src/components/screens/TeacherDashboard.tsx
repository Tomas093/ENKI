import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Plus, RotateCcw, Users, Copy, Trash2 } from "lucide-react";

const MOCK_SESSIONS = [
  { id: "ENK-4821", topic: "Blockchain Basics", players: 14, status: "live", started: "2 min ago" },
  { id: "ENK-3310", topic: "DeFi Fundamentals", players: 22, status: "ended", started: "Yesterday" },
  { id: "ENK-7754", topic: "NFT & Digital Ownership", players: 9, status: "ended", started: "3 days ago" },
];


export const TeacherDashboard = () => {
  const navigate = useNavigate();
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
        <button
          onClick={() => navigate("/teacher/create")}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-3 rounded-[16px] shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={20} />
          New Session
        </button>
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
              onClick={() => navigate(`/teacher/session/${session.id}`)}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
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

              <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                {/* PIN badge */}
                <button
                  onClick={() => handleCopy(session.id)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 font-black text-sm px-3 py-1.5 rounded-[10px] transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  {copied === session.id ? "Copied!" : session.id}
                </button>

                <button className="flex items-center gap-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-black text-sm px-4 py-1.5 rounded-[10px] transition-colors cursor-pointer shadow-sm">
                  <RotateCcw size={13} />
                  Repetir
                </button>
                {session.status !== "live" && (
                  <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 font-bold text-sm px-3 py-1.5 rounded-[10px] transition-colors cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>


    </div>
  );
};
