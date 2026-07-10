"use client";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Wallet, Award, Gift, Frown, Loader2, Hourglass, Check } from "lucide-react";
import { motion } from "motion/react";
import { LeaderboardPodium } from "./LeaderboardPodium";
import { GlobalLoadingOverlay } from "../../components/GlobalLoadingOverlay";
import { useAudio } from "../../../contexts/AudioContext";

// Assuming these types are from your hooks
import { Player } from "../../../hooks/useFinalLeaderboard";
import { ChampionEffects } from "../../../components/ChampionEffects";

export interface LeaderboardUIProps {
  loading: boolean;
  prizesCalculated: boolean;
  rank1Players: Player[];
  rank2Players: Player[];
  rank3Players: Player[];
  prizes: bigint[];
  myData: { score: number; claimed: boolean; diplomaClaimed: boolean } | null | undefined;
  myRank: number;
  myPrize: bigint;
  myPrizeFormatted: string | null;
  PASS_THRESHOLD: number;
  isPending: boolean;
  isConfirmingTx: boolean;
  isRefetching: boolean;
  refetchStats: () => void;
  handleClaim: () => void;
  handleClaimDiploma: () => void;
  address?: string;
}

export function LeaderboardUI({
  loading,
  prizesCalculated,
  rank1Players,
  rank2Players,
  rank3Players,
  prizes,
  myData,
  myRank,
  myPrize,
  myPrizeFormatted,
  PASS_THRESHOLD,
  isPending,
  isConfirmingTx,
  isRefetching,
  refetchStats,
  handleClaim,
  handleClaimDiploma,
  address,
}: LeaderboardUIProps) {
  const { playMusic } = useAudio();

  // Removed automatic epic music playback on load

  if (isConfirmingTx) {
    return (
      <GlobalLoadingOverlay 
        isVisible={true} 
        message="Syncing your answers" 
        subMessage="Writing final results to the blockchain" 
      />
    );
  }

  const prevClaimed = useRef(myData?.claimed);
  const prevDiplomaClaimed = useRef(myData?.diplomaClaimed);

  useEffect(() => {
    if (myData?.claimed && !prevClaimed.current) {
      playMusic("epic");
      // Trigger fireworks for prize claim
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    }
    prevClaimed.current = myData?.claimed;
  }, [myData?.claimed]);

  useEffect(() => {
    if (myData?.diplomaClaimed && !prevDiplomaClaimed.current) {
      playMusic("epic");
      // Trigger simple confetti for diploma
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        zIndex: 1000,
      });
    }
    prevDiplomaClaimed.current = myData?.diplomaClaimed;
  }, [myData?.diplomaClaimed]);

  // Loading state (Brutalist style)
  if (!prizesCalculated || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full relative bg-[#F4F4F0] overflow-hidden px-4 min-h-[100dvh]">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-10 md:p-14 flex flex-col items-center gap-10 max-w-md w-full"
        >
          {/* Status tag */}
          <div className="absolute -top-5 left-6 bg-[#FFE234] border-2 border-black px-4 py-1 font-black text-[12px] uppercase tracking-wide shadow-[3px_3px_0px_#000]">
            CALCULATING
          </div>

          {/* Brutalist Hourglass Spinner */}
          <div className="relative flex items-center justify-center w-32 h-32 my-2">
            <motion.div
              animate={{ rotate: [0, 180, 180, 360, 360] }}
              transition={{ duration: 2.5, repeat: Infinity, times: [0, 0.3, 0.5, 0.8, 1], ease: "easeInOut" }}
              className="w-24 h-24 bg-[#FFE234] border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]"
            >
              <Hourglass size={48} strokeWidth={2.5} className="text-black" />
            </motion.div>
          </div>

          {/* Text */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-black text-[28px] md:text-[34px] uppercase tracking-tight leading-[1.1] text-black">
              Calculating<br />Results
            </h1>
            <p className="font-bold text-[13px] uppercase tracking-wide text-[#050505]">
              Waiting for the host to finalize the session
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between font-black text-sm uppercase tracking-wide text-black">
              <span>Syncing from Blockchain</span>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                PENDING
              </motion.span>
            </div>
            <div className="w-full h-5 border-2 border-black bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full bg-black"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: "60%" }}
              />
            </div>
          </div>

          {/* Bouncing block dots */}
          <div className="flex items-end gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 border-2 border-black bg-black"
                animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] flex flex-col justify-center items-center px-4 md:px-8 lg:px-12 py-12 relative bg-[#F4F4F0] overflow-hidden">
      {/* Brutalist Dot Grid Background */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col lg:flex-row gap-10 xl:gap-16 w-full max-w-7xl mx-auto items-start relative z-10"
      >
        {/* Left: Podium */}
        <div className="flex-1 w-full flex flex-col relative z-10">
          <h1 className="font-black text-[42px] md:text-[56px] uppercase tracking-tight leading-[0.9] text-black mb-12">
            Final<br/>Results
          </h1>
          <LeaderboardPodium
            rank1Players={rank1Players}
            rank2Players={rank2Players}
            rank3Players={rank3Players}
            prizes={prizes}
            currentAddress={address}
          />
        </div>

        {/* Right: Claim Card (Neo-Brutalist) */}
        <div className="w-full lg:w-[420px] shrink-0 relative z-10 lg:mt-12">
          <div className="bg-white border-2 border-black p-8 flex flex-col items-center text-center gap-6" style={{ boxShadow: "4px 4px 0px #000" }}>

            {/* Winner or Not */}
            {myRank !== -1 && myPrize > 0n ? (
              <>
                <div className="w-20 h-20 bg-[#FFE234] border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                  <Gift size={40} className="text-black" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-2">You Won!</h2>
                  <div className="text-4xl font-black bg-[#A67CFF] border-2 border-black px-4 py-2 mt-2 shadow-[4px_4px_0px_#000] inline-block">
                    {myPrizeFormatted} ETH
                  </div>
                </div>
                {!myData?.claimed ? (
                  <button
                    disabled={isPending}
                    onClick={handleClaim}
                    className="w-full bg-[#4AF626] border-2 border-black py-4 font-black text-black text-[15px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "CLAIMING..." : "CLAIM PRIZE"} <Wallet size={20} strokeWidth={3} />
                  </button>
                ) : (
                  <div className="w-full bg-white border-2 border-black py-4 font-black text-[#050505]/70 text-[15px] uppercase tracking-wide flex items-center justify-center gap-2">
                    PRIZE CLAIMED <Check size={20} strokeWidth={3} />
                  </div>
                )}
              </>
            ) : myData && myData.score >= PASS_THRESHOLD ? (
              <>
                <div className="w-20 h-20 bg-[#F4F4F0] border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                  <Award size={40} className="text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-2">GOOD EFFORT!</h2>
                  <p className="font-bold text-[13px] uppercase tracking-wide text-[#050505]">
                    You didn't win the prize pool, but you passed.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-[#F4F4F0] border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_#000]">
                  <Frown size={40} className="text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-2">NOT THIS TIME</h2>
                  <p className="font-bold text-[13px] uppercase tracking-wide text-[#050505]">
                    Not in the top 3. Try again next time.
                  </p>
                </div>
              </>
            )}

            {/* Thick divider */}
            <div className="w-full border-t-2 border-black my-2" />

            {/* Diploma Section */}
            {myData && myData.score >= PASS_THRESHOLD ? (
              <div className="w-full flex flex-col gap-3 items-center">
                <span className="font-black text-[12px] uppercase tracking-wide">
                  Passed the threshold!
                </span>
                {!myData.diplomaClaimed ? (
                  <button
                    disabled={isPending}
                    onClick={handleClaimDiploma}
                    className="w-full bg-[#FFE234] border-2 border-black py-3 font-black text-black text-[13px] uppercase tracking-wide flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "CLAIMING..." : "CLAIM DIPLOMA NFT"} <Award size={18} strokeWidth={3} />
                  </button>
                ) : (
                  <div className="w-full bg-white border-2 border-black py-3 font-black text-[#050505]/70 uppercase tracking-wide flex items-center justify-center gap-2 text-[13px]">
                    DIPLOMA CLAIMED <Check size={18} strokeWidth={3} />
                  </div>
                )}
              </div>
            ) : myData && myData.score < PASS_THRESHOLD ? (
              <div className="bg-[#F4F4F0] border-2 border-black p-3 w-full font-bold text-sm uppercase tracking-wide text-[#050505]">
                Score too low for a diploma
              </div>
            ) : null}

            {/* Recovery Sync Button */}
            {myData && myData.score === 0 && (
               <button
                 onClick={refetchStats}
                 disabled={isRefetching}
                 className={`mt-2 font-black uppercase text-sm tracking-wide transition-colors flex items-center justify-center gap-2 w-full py-3 border-2 border-black ${
                   isRefetching 
                     ? "bg-[#FFE234] shadow-[2px_2px_0px_#000]" 
                     : "bg-white hover:bg-gray-100"
                 }`}
               >
                 {isRefetching ? (
                   <>
                     <Loader2 size={16} className="animate-spin" /> SYNCING...
                   </>
                 ) : (
                   "Refresh Status"
                 )}
               </button>
            )}

          </div>
        </div>
      </motion.div>
      <ChampionEffects isWinner={myRank === 1} />
    </div>
  );
}
