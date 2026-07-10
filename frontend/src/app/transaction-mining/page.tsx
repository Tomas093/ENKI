"use client";
import { motion } from "motion/react";
import { useTransactionMining } from "../../hooks/useTransactionMining";

// 8 blocks in a ring, lighting up clockwise — classic "block chase" pattern
function BlockChaseSpinner() {
  // positions for 8 blocks around a circle (top, top-right, right, bottom-right, bottom, bottom-left, left, top-left)
  const positions = [
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
  ];

  const gap = 22; // spacing between block centers
  const size = 14; // block size

  return (
    <div className="relative" style={{ width: 80, height: 80 }}>
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute border-2 border-black"
          style={{
            width: size,
            height: size,
            left: 80 / 2 + pos.x * gap - size / 2,
            top: 80 / 2 + pos.y * gap - size / 2,
          }}
          animate={{
            backgroundColor: ["#FFE234", "#000000", "#000000", "#000000", "#FFE234"],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * (1.2 / 8),
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

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
        <div className="absolute -top-5 left-6 bg-[#FFE234] border-2 border-black px-4 py-1 font-black text-[12px] uppercase tracking-widest shadow-[3px_3px_0px_#000]">
          BLOCKCHAIN
        </div>

        {/* Block Chase Spinner */}
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 80 }}>
          <BlockChaseSpinner />
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
          <div className="flex justify-between font-black text-[11px] uppercase tracking-widest text-black">
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
        className="mt-8 font-mono text-[11px] text-gray-400 uppercase tracking-widest relative z-10"
      >
        // Ethereum Sepolia Testnet
      </motion.p>
    </div>
  );
}
