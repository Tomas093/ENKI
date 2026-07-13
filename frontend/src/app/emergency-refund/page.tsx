"use client";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useEmergencyRefund } from '@/features/system/useEmergencyRefund';

export default function EmergencyRefund() {
  const { signing, done, canClaim, timeRemainingStr, entryFeeEth, handleClaim, router } = useEmergencyRefund();

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 py-10">

      {/* Brutalist dot grid background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-lg mx-auto px-4 z-10"
      >
        {/* Main card */}
        <div className="bg-white border-4 border-black p-8 md:p-10 flex flex-col items-center text-center relative shadow-[8px_8px_0px_#000]">

          {/* Badge */}
          <div className="absolute -top-4 -left-4 bg-[#FF6B00] border-2 border-black px-4 py-1 font-black text-sm uppercase tracking-wide shadow-[3px_3px_0px_#000] text-black">
            🚨 Emergency Recovery
          </div>

          {/* Title */}
          <h1 className="font-black text-black mb-4 text-[40px] md:text-[52px] tracking-tight leading-[0.9] uppercase mt-4">
            Game Terminated <br />
            <span className="text-[#FF6B00]">(Inactivity)</span>
          </h1>

          {/* Subtitle */}
          <p className="font-bold text-gray-600 mb-8 text-base md:text-lg max-w-[320px] leading-snug uppercase">
            If the host abandons the session, the smart contract unlocks your stake. <br/>
            <span className="text-black font-black mt-2 inline-block">
              {canClaim ? "Your stake is UNLOCKED." : "Your stake is LOCKED."}
            </span>
          </p>

          {/* Financial data box */}
          <div className="w-full flex items-center justify-between px-6 py-5 mb-8 bg-[#FFE234] border-4 border-black shadow-[6px_6px_0px_#000]">
            <div className="text-left">
              <p className="font-black uppercase text-black text-sm mb-1 tracking-wide">
                Your Locked Stake
              </p>
              <p className="font-black text-black text-[32px] tracking-tight leading-none">
                {entryFeeEth} <span className="text-[20px] text-gray-800 font-bold">ETH</span>
              </p>
            </div>
            <div className="flex items-center justify-center w-14 h-14 bg-white border-4 border-black shadow-[4px_4px_0px_#000] text-3xl">
              💰
            </div>
          </div>

          {/* CTA button */}
          {!done ? (
            <button
              onClick={handleClaim}
              disabled={signing || !canClaim}
              className="w-full flex items-center justify-center gap-3 font-black uppercase tracking-wide text-white px-6 py-5 text-[18px] border-4 border-black transition-all active:translate-y-2 active:translate-x-2 disabled:bg-gray-400 disabled:shadow-[8px_8px_0px_#000] disabled:translate-x-0 disabled:translate-y-0"
              style={{
                backgroundColor: (signing || !canClaim) ? "#A0A0A0" : "#FF3366",
                boxShadow: "8px 8px 0px #000",
                cursor: (signing || !canClaim) ? "not-allowed" : "pointer",
              }}
            >
              {signing ? (
                <>
                  <Loader2 size={24} className="animate-spin text-black" strokeWidth={3} />
                  <span className="text-black">Signing...</span>
                </>
              ) : !canClaim ? (
                <>
                  <span className="text-black">Unlocks in {timeRemainingStr || "--"}</span>
                </>
              ) : (
                <>
                  <span className="text-black">Sign &amp; Claim Refund</span>
                </>
              )}
            </button>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full flex items-center justify-center gap-3 font-black uppercase tracking-wide text-black px-6 py-5 text-[18px] bg-[#39FF14] border-4 border-black shadow-[8px_8px_0px_#000]"
            >
              Refund Sent — {entryFeeEth} ETH
            </motion.div>
          )}

          {/* Back link */}
          <button
            onClick={() => router.push("/")}
            className="mt-8 bg-black text-white font-black uppercase tracking-widest text-[12px] px-6 py-3 border-2 border-black hover:bg-white hover:text-black transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
