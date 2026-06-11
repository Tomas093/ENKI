"use client";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Users, Coins } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JoinWaitingRoom() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push("/gameplay"), 8000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4 gap-10"
    >

      {/* Success icon */}
      <div className="flex flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.1 }}
          className="relative"
        >
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-400/25"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-200 relative z-10">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 18 }}
              className="text-white text-6xl"
            >
              ✓
            </motion.span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="font-black text-slate-800 text-5xl md:text-6xl tracking-tight mb-3">
            You are in!
          </h1>
          <p className="text-slate-400 font-semibold text-lg max-w-sm">
            Look at the host screen.
            <br />The game will start soon...
          </p>
        </motion.div>
      </div>

      {/* Live stats card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 200, damping: 24 }}
        className="w-full max-w-sm"
      >
        <div
          className="rounded-[24px] border-[3px] border-white/60 p-6 flex flex-col gap-4"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 40px rgba(124,58,237,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <p className="font-black text-slate-400 text-xs uppercase tracking-widest">Live Stats</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-blue-100 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <span className="font-black text-slate-700">Players Joined</span>
            </div>
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="font-black text-2xl text-blue-600"
            >
              15
            </motion.span>
          </div>

          <div className="h-[2px] bg-slate-100 rounded-full" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-purple-100 flex items-center justify-center">
                <Coins size={20} className="text-purple-600" />
              </div>
              <span className="font-black text-slate-700">Prize Pool</span>
            </div>
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="font-black text-2xl text-purple-600"
            >
              0.15 ETH
            </motion.span>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};
