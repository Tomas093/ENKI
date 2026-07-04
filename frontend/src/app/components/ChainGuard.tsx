"use client";

import { useChainGuard } from "../../hooks/useChainGuard";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const { isWrongNetwork, switchToCorrectNetwork, targetChainName } = useChainGuard();

  return (
    <>
      <AnimatePresence>
        {isWrongNetwork && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-red-500 shadow-lg border-b border-red-600"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-white" size={24} />
              <p className="text-white font-bold text-sm md:text-base">
                Wrong Network! Please switch to {targetChainName} to continue.
              </p>
            </div>
            <button
              onClick={switchToCorrectNetwork}
              className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 font-bold rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <RefreshCw size={16} />
              Switch Network
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`flex-1 flex flex-col w-full ${isWrongNetwork ? "opacity-50 pointer-events-none" : ""}`}>
        {children}
      </div>
    </>
  );
}
