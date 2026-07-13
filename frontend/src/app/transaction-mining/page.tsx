"use client";
import { motion } from "motion/react";
import { Hourglass } from "lucide-react";
import { useTransactionMining } from '@/features/system/useTransactionMining';



export default function TransactionMining() {
  useTransactionMining();

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full relative bg-[#F4F4F0] overflow-hidden px-4">

      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 bg-white border-4 border-black shadow-[12px_12px_0px_#000] p-10 md:p-14 flex flex-col items-center gap-10 max-w-md w-full"
      >
        {/* Status tag */}
        <div className="absolute -top-5 left-6 bg-[#FFE234] border-2 border-black px-4 py-1 font-black text-[12px] uppercase tracking-wide shadow-[3px_3px_0px_#000]">
          BLOCKCHAIN
        </div>

        {/* Brutalist Hourglass Spinner */}
        <div className="relative flex items-center justify-center w-32 h-32 my-2">
          <motion.div
            animate={{ rotate: [0, 180, 180, 360, 360] }}
            transition={{ duration: 2.5, repeat: Infinity, times: [0, 0.3, 0.5, 0.8, 1], ease: "easeInOut" }}
            className="w-24 h-24 bg-[#FFE234] border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_#000]"
          >
            <Hourglass size={48} strokeWidth={2.5} className="text-black" />
          </motion.div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-black text-[28px] md:text-[34px] uppercase tracking-tight leading-[1.1] text-black">
            Mining<br />Transaction
          </h1>
          <p className="font-bold text-[13px] uppercase tracking-wide text-gray-500">
            Please wait — do not close this tab
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex justify-between font-black text-sm uppercase tracking-wide text-black">
            <span>Confirming on Sepolia</span>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              PENDING
            </motion.span>
          </div>
          <div className="w-full h-5 border-2 border-black bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full bg-black"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "60%" }}
            />
          </div>
        </div>

        {/* Bouncing block dots */}
        <div className="flex items-end gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 border-2 border-black bg-black"
              animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottom system note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 font-mono text-sm text-gray-400 uppercase tracking-wide relative z-10"
      >
        // Ethereum Sepolia Testnet
      </motion.p>
    </div>
  );
}
