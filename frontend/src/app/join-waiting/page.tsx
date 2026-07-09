"use client";
import { motion } from "motion/react";
import { Users, Coins, Hourglass } from "lucide-react";
import { useJoinWaitingRoom } from "../../hooks/useJoinWaitingRoom";

import { PageBlobs } from "../../components/ui/PageBlobs";

export default function JoinWaitingRoom() {
  const { totalPlayers, prizePoolStr } = useJoinWaitingRoom();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center w-full relative px-4"
    >
      {/* Decorative background blobs */}
      <PageBlobs primary="emerald" secondary="teal" />

      {/* Success icon */}
      <div className="flex flex-col items-center gap-6 text-center z-10 mt-[-40px]">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.1 }}
          className="relative"
        >
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-400/30"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-200 relative z-10">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 18 }}
              className="text-white text-5xl md:text-6xl"
            >
              ✓
            </motion.span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-2">
             <Hourglass size={16} className="text-emerald-500 animate-pulse" />
             <span className="font-bold text-emerald-600 text-sm tracking-wide">Successfully Joined</span>
          </div>
          <h1 className="font-extrabold text-slate-800 text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight">
            Stand by!
          </h1>
          <p className="text-slate-500 font-medium text-lg md:text-xl max-w-sm">
            Look at the host screen.<br />Waiting for the Professor...
          </p>
        </motion.div>
      </div>

      {/* Live stats card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, type: "spring", stiffness: 200, damping: 24 }}
        className="w-full max-w-sm mt-12 z-10"
      >
        <div className="rounded-xl border border-slate-200 p-7 flex flex-col gap-5 bg-white/70 backdrop-blur-xl shadow-sm">
          <p className="font-semibold text-slate-500 text-sm">Live Stats</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                <Users size={22} className="text-blue-500" />
              </div>
              <span className="font-extrabold text-slate-700">Players Joined</span>
            </div>
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="font-black text-2xl text-blue-600 tabular-nums"
            >
              {totalPlayers}
            </motion.span>
          </div>

          <div className="h-[2px] bg-slate-100 rounded-full w-full" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shadow-sm">
                <Coins size={22} className="text-purple-500" />
              </div>
              <span className="font-extrabold text-slate-700">Prize Pool</span>
            </div>
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="font-black text-2xl text-purple-600 tabular-nums"
            >
              {prizePoolStr} ETH
            </motion.span>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
