import { motion, AnimatePresence } from "motion/react";
import { LoadingDots } from "./LoadingDots";

interface GlobalLoadingOverlayProps {
  isVisible: boolean;
  message: string;
  subMessage?: string;
}

export function GlobalLoadingOverlay({ isVisible, message, subMessage }: GlobalLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-[#F4F4F0] border-2 border-black p-8 md:p-10 max-w-md w-full text-center shadow-[8px_8px_0px_#000] flex flex-col items-center gap-6 relative"
          >
            {/* Brutalist Warning Tag */}
            <div className="absolute -top-4 -left-4 bg-[#FFE234] border-2 border-black px-4 py-1 font-black text-[12px] uppercase tracking-wide shadow-[4px_4px_0px_#000]">
              Working
            </div>

            {/* Brutalist Bouncing Blocks */}
            <LoadingDots />

            {/* Text Content */}
            <div>
              <h2 className="font-black text-black text-[22px] md:text-[28px] leading-[1.1] uppercase tracking-wide">
                {message}
              </h2>
              <p className="text-[#050505]/80 font-black text-[13px] md:text-[15px] mt-4 uppercase tracking-wide leading-relaxed">
                {subMessage || "Waiting for blockchain network confirmation..."}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
