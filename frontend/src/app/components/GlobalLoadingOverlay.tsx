import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white p-10 rounded-3xl max-w-sm w-full text-center shadow-2xl shadow-slate-300/40 flex flex-col items-center gap-5"
          >
            <div className="w-18 h-18 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
              <Loader2 size={36} className="text-purple-600 animate-spin" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-2xl mb-2 tracking-tight">
                {message}
              </h2>
              {subMessage && (
                <p className="text-slate-500 font-medium text-base leading-relaxed">
                  {subMessage}
                </p>
              )}
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
