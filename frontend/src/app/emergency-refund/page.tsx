"use client";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { PageBlobs } from "../../components/ui/PageBlobs";
import { useEmergencyRefund } from "../../hooks/useEmergencyRefund";

export default function EmergencyRefund() {
  const { signing, done, handleClaim, router } = useEmergencyRefund();

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 py-10">

      {/* Subtle emergency background glow */}
      <PageBlobs primary="orange" secondary="red" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-lg mx-auto px-4 z-10"
      >
        {/* Main card */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center text-center relative overflow-hidden shadow-sm">

          {/* Illustration — rescue lifebuoy */}
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="mt-4 mb-6 flex items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow-inner"
          >
            <span className="text-6xl drop-shadow-sm">🛟</span>
          </motion.div>

          {/* Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 mb-5">
            <span className="text-sm">🚨</span>
            <span className="font-semibold text-sm text-orange-600">
              Emergency Recovery
            </span>
          </div>

          {/* Title */}
          <h1 className="font-black text-slate-800 mb-3 text-3xl md:text-4xl tracking-tight leading-tight">
            Game Terminated <br />
            <span className="text-orange-500">(Inactivity)</span>
          </h1>

          {/* Subtitle */}
          <p className="font-medium text-slate-500 mb-8 text-base md:text-lg max-w-[320px] leading-relaxed">
            The host abandoned the session. The smart contract has <span className="font-bold text-slate-700">unlocked your stake.</span>
          </p>

          {/* Financial data box */}
          <div className="w-full rounded-2xl flex items-center justify-between px-6 py-5 mb-8 bg-slate-50 border border-slate-100 shadow-sm">
            <div className="text-left">
              <p className="font-medium text-slate-500 mb-1 text-sm">
                Your Locked Stake
              </p>
              <p className="font-black text-slate-800 text-3xl tracking-tight">
                0.050 <span className="text-xl text-slate-500 font-bold">ETH</span>
              </p>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-orange-50 border border-orange-100 shadow-sm text-3xl">
              💰
            </div>
          </div>

          {/* CTA button */}
          {!done ? (
            <button
              onClick={handleClaim}
              disabled={signing}
              className="w-full flex items-center justify-center gap-3 font-black transition-all rounded-[20px] text-white px-6 py-4 shadow-xl text-lg relative overflow-hidden group"
              style={{
                background: signing ? "#f97316" : "linear-gradient(135deg, #f97316, #ea580c)",
                cursor: signing ? "wait" : "pointer",
                transform: signing ? "translateY(2px)" : "translateY(0)",
                boxShadow: signing ? "none" : "0 8px 25px rgba(234, 88, 12, 0.3)",
              }}
            >
              {!signing && (
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              {signing ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>Signing Transaction...</span>
                </>
              ) : (
                <>
                  <span>🛡️</span>
                  <span>Sign &amp; Claim Refund</span>
                </>
              )}
            </button>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full flex items-center justify-center gap-3 font-black rounded-[20px] text-white px-6 py-4 shadow-xl text-lg bg-gradient-to-r from-emerald-500 to-teal-500"
            >
              ✅ Refund Sent — 0.050 ETH
            </motion.div>
          )}

          {/* Back link */}
          <button
            onClick={() => router.push("/waiting")}
            className="mt-6 text-slate-400 hover:text-slate-600 font-bold transition-colors text-sm px-4 py-2"
          >
            ← Back to Waiting Room
          </button>
        </div>
      </motion.div>
    </div>
  );
}
