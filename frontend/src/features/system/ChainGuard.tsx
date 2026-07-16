"use client";

import { useChainGuard } from '@/features/system/useChainGuard';
import { AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const { isWrongNetwork, switchToCorrectNetwork, targetChainName } = useChainGuard();

  return (
    <>
      <AnimatePresence>
        {isWrongNetwork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_#000] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-neo-accent border-b-4 border-black p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} strokeWidth={3} className="text-black" />
                  <span className="font-black text-sm uppercase tracking-wide">Network Connection Error</span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-neo-bg border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                  <AlertTriangle size={32} strokeWidth={3} className="text-black" />
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight">Wrong Network Connected</h3>
                <p className="text-xs text-gray-700 uppercase font-bold max-w-xs leading-relaxed">
                  ENKI is built on {targetChainName} testnet. You must switch your wallet network to participate.
                </p>
                
                <button
                  onClick={switchToCorrectNetwork}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-neo-accent text-black font-black text-sm uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-black hover:text-neo-accent active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                >
                  <RefreshCw size={14} strokeWidth={3} />
                  Switch to {targetChainName} Network
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col w-full ${isWrongNetwork ? "opacity-30 pointer-events-none select-none" : ""}`}>
        {children}
      </div>
    </>
  );
}
