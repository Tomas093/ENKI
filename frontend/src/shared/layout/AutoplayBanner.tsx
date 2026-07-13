"use client";
import { useAudio } from '@/core/context/AudioContext';
import { VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function AutoplayBanner() {
  const { userInteracted } = useAudio();

  return (
    <AnimatePresence>
      {!userInteracted && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-4 pointer-events-none"
        >
          <div className="bg-[#FFE234] border-4 border-black p-4 flex items-center gap-4 shadow-[6px_6px_0px_#000] pointer-events-auto">
            <VolumeX size={24} strokeWidth={3} className="text-black" />
            <div className="flex flex-col">
              <span className="font-black uppercase text-[15px] tracking-tight leading-none text-black">
                Audio is muted
              </span>
              <span className="font-bold text-[12px] uppercase tracking-wide text-gray-700">
                Click anywhere to unmute
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
