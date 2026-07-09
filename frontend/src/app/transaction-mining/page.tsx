"use client";
import { motion } from "motion/react";
import { useTransactionMining } from "../../hooks/useTransactionMining";

import { PageBlobs } from "../../components/ui/PageBlobs";

export default function TransactionMining() {
  useTransactionMining();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center w-full relative px-4"
    >
      {/* Background blobs for premium aesthetic */}
      <PageBlobs primary="purple" secondary="indigo" />

      <div className="flex flex-col items-center gap-12 max-w-md w-full text-center relative z-10">

        {/* Glowing spinner */}
        <div className="relative flex items-center justify-center w-48 h-48">
          {/* Outer rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-4 border-purple-200"
              style={{ width: 192 - i * 36, height: 192 - i * 36 }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
            />
          ))}

          {/* Spinning arc */}
          <motion.div
            className="absolute w-40 h-40 rounded-full border-4 border-transparent border-t-purple-600 border-r-purple-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />

          {/* Center coin */}
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-white font-black text-3xl">⬡</span>
          </motion.div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-4">
          <h1 className="font-extrabold text-slate-800 text-3xl md:text-4xl tracking-tight leading-tight">
            Confirming transaction
            <br />on the blockchain...
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Please wait, this might take a few seconds.
            <br />Do not close this app.
          </p>
        </div>

        {/* Pulsing dots */}
        <div className="flex items-center gap-2.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-purple-400 shadow-sm shadow-purple-200"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            />
          ))}
        </div>

      </div>
    </motion.div>
  );
}
