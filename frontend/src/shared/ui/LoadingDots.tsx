import { motion } from "motion/react";

export function LoadingDots() {
  return (
    <div className="flex items-end justify-center gap-2 mb-2 h-12">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-6 h-6 border-2 border-black shadow-[2px_2px_0px_#000]"
          style={{ backgroundColor: ['#FFE234', '#33CCFF', '#4AF626', '#FF6B00'][i] }}
          animate={{
            y: [0, -12, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}
