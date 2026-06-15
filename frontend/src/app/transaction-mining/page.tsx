"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useWaitForTransactionReceipt } from "wagmi";

export default function TransactionMining() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hash = searchParams.get("hash");
  const game = searchParams.get("game");

  const { isSuccess } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}`,
  });

  useEffect(() => {
    if (isSuccess && game) {
      router.push(`/join-waiting?game=${game}`);
    }
  }, [isSuccess, router, game]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4"
    >
      <div className="flex flex-col items-center gap-10 max-w-md w-full text-center">

        {/* Glowing spinner */}
        <div className="relative flex items-center justify-center w-48 h-48">
          {/* Outer rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-4 border-purple-400/30"
              style={{ width: 192 - i * 36, height: 192 - i * 36 }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
            />
          ))}

          {/* Spinning arc */}
          <motion.div
            className="absolute w-40 h-40 rounded-full border-4 border-transparent"
            style={{ borderTopColor: "#7c3aed", borderRightColor: "#7c3aed" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />

          {/* Center coin */}
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-300"
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-white font-black text-3xl">⬡</span>
          </motion.div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-3">
          <h1 className="font-black text-slate-800 text-3xl md:text-4xl tracking-tight">
            Confirming transaction
            <br />on the blockchain...
          </h1>
          <p className="text-slate-400 font-semibold text-base">
            Please wait, this might take a few seconds.
            <br />Do not close this app.
          </p>
        </div>

        {/* Pulsing dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-purple-400"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

      </div>
    </motion.div>
  );
};
