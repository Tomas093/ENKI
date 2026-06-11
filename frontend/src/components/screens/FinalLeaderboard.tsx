import { useState, useEffect } from "react";
import { Wallet, Gift, Trophy } from "lucide-react";
import { PlayfulButton } from "../ui/PlayfulButton";
import confetti from "canvas-confetti";
import { motion } from "motion/react";

export const FinalLeaderboard = () => {
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleClaim = () => {
    setClaimed(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col md:flex-row gap-12 z-10 w-full max-w-6xl mx-auto items-start pt-8 pb-16"
    >
      
      {/* Left/Center: Olympic Leaderboard Podium */}
      <div className="flex-1 w-full flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-12 tracking-tight text-center">
          Final Results
        </h1>

        <div className="flex items-end justify-center gap-2 md:gap-6 w-full h-[500px] md:px-8 border-b-8 border-slate-300 pb-0">
          {/* Silver - 2nd */}
          <div className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center font-bold text-2xl text-slate-600 shadow-md mb-2">
                S
              </div>
              <span className="font-extrabold text-slate-700 text-lg leading-tight">0x4b...</span>
              <span className="font-black text-purple-600 text-lg leading-tight mt-1">0.05 ETH</span>
            </div>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "50%" }}
              className="w-full bg-slate-200 rounded-t-[24px] border-x-4 border-t-4 border-slate-300 flex justify-center items-center overflow-hidden shadow-inner relative"
            >
              <span className="text-8xl font-black text-slate-700/60 absolute">2</span>
            </motion.div>
          </div>

          {/* Gold - 1st (Tied players grouping simulated by showing two avatars) */}
          <div className="flex-[1.2] flex flex-col items-center justify-end h-full">
            <div className="flex flex-col items-center mb-6">
              <Trophy size={40} className="text-amber-400 mb-3 drop-shadow-md" fill="currentColor" />
              <div className="flex space-x-4 mb-3">
                <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-300 flex items-center justify-center font-bold text-2xl text-amber-600 shadow-md">
                  YOU
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-100 border-4 border-blue-300 flex items-center justify-center font-bold text-2xl text-blue-600 shadow-md">
                  K
                </div>
              </div>
              <div className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-widest uppercase shadow-sm">
                TIE!
              </div>
              <span className="font-extrabold text-slate-800 text-lg leading-tight">0x1a... & 0x9b...</span>
              <span className="font-black text-[#7C3AED] text-xl leading-tight mt-1">0.15 ETH ea</span>
            </div>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "70%" }}
              className="w-full bg-amber-300 rounded-t-[24px] border-x-4 border-t-4 border-amber-400 flex justify-center items-center overflow-hidden shadow-inner relative"
            >
              <span className="text-[140px] font-black text-amber-900/50 drop-shadow-sm absolute">1</span>
            </motion.div>
          </div>

          {/* Bronze - 3rd */}
          <div className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center font-bold text-2xl text-orange-600 shadow-md mb-2">
                M
              </div>
              <span className="font-extrabold text-slate-700 text-lg leading-tight">0x9c...</span>
              <span className="font-black text-purple-600 text-lg leading-tight mt-1">0.02 ETH</span>
            </div>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "40%" }}
              className="w-full bg-orange-300 rounded-t-[24px] border-x-4 border-t-4 border-orange-400 flex justify-center items-center overflow-hidden shadow-inner relative"
            >
              <span className="text-8xl font-black text-orange-900/50 absolute">3</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right: The Claim Card & AFK Hatch */}
      <div className="w-full md:w-[400px] flex flex-col gap-6 mt-8 md:mt-16">
        {/* Claim Card */}
        <div className="bg-white rounded-[32px] border-4 border-purple-200 p-8 shadow-2xl relative flex flex-col items-center text-center">
          
          <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 border-4 border-amber-200 relative z-10">
            <Gift size={40} />
          </div>
          
          <h2 className="text-2xl font-extrabold text-slate-700 mb-1 relative z-10">You're a Winner!</h2>
          <div className="text-6xl font-black text-[#7C3AED] mb-8 relative z-10 tracking-tight drop-shadow-sm">
            0.15 ETH
          </div>

          {!claimed ? (
            <PlayfulButton 
              variant="purple" 
              size="xl" 
              className="w-full text-2xl py-6 z-10 shadow-xl"
              onClick={handleClaim}
            >
              <Wallet className="mr-3 h-7 w-7" />
              Claim Prize
            </PlayfulButton>
          ) : (
            <div className="w-full bg-[#10B981] text-white rounded-[20px] py-5 text-2xl font-extrabold border-b-[6px] border-[#047857] flex items-center justify-center gap-2 z-10 shadow-lg">
              Claimed! <Wallet size={28} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
