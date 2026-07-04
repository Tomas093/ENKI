import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

export function GlobalLoadingOverlay({ isVisible, message, subMessage }: { isVisible: boolean, message: string, subMessage?: string }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white p-8 rounded-[32px] max-w-md w-full text-center shadow-2xl border-4 border-slate-200 flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-purple-100 rounded-[20px] flex items-center justify-center mb-5 border-4 border-purple-200">
              <Loader2 size={40} className="text-purple-600 animate-spin" strokeWidth={3} />
            </div>
            <h2 className="font-black text-slate-800 mb-2" style={{ fontSize: 26, fontFamily: "'Nunito', sans-serif" }}>
              {message}
            </h2>
            {subMessage && (
              <p className="text-slate-500 font-bold mb-5" style={{ fontSize: 17 }}>
                {subMessage}
              </p>
            )}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-2">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="h-full bg-purple-500 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
