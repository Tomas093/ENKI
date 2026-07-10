import { motion, AnimatePresence } from "motion/react";

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-white border-4 border-black p-8 md:p-10 max-w-md w-full text-center shadow-[12px_12px_0px_#000] flex flex-col items-center gap-6 relative"
          >
            {/* Brutalist Warning Tag */}
            <div className="absolute -top-4 -left-4 bg-[#FFE234] border-2 border-black px-3 py-1 font-black text-[12px] uppercase tracking-wide shadow-[4px_4px_0px_#000]">
              Working
            </div>

            {/* Brutalist Spinner Blocks */}
            <div className="flex items-center gap-2 mb-2">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-6 h-6 md:w-8 md:h-8 border-4 border-black"
                  style={{ backgroundColor: ['#FF6B00', '#33CCFF', '#FFE234', '#B05BFF'][i] }}
                  animate={{
                    rotate: [0, 90, 180, 270, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Text Content */}
            <div>
              <h2 className="font-black text-black text-[22px] md:text-[28px] leading-[1.1] uppercase tracking-wide">
                {message}
              </h2>
              {subMessage && (
                <p className="text-black/70 font-black text-[13px] md:text-[15px] mt-4 uppercase tracking-wide leading-relaxed">
                  {subMessage}
                </p>
              )}
            </div>

            {/* Brutalist Progress Bar */}
            <div className="w-full border-4 border-black h-8 bg-white relative overflow-hidden shadow-[4px_4px_0px_#000] mt-2">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-[#39FF14] w-1/2"
              />
              <div className="absolute inset-0 flex items-center justify-center z-10 mix-blend-difference pointer-events-none">
                <span className="text-white font-black text-xs uppercase tracking-[0.2em]">Please Wait</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
