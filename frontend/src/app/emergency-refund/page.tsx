"use client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function EmergencyRefund() {
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState(false);

  const handleClaim = () => {
    if (signing || done) return;
    setSigning(true);
    setTimeout(() => {
      setSigning(false);
      setDone(true);
    }, 3000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">

      {/* Corner shapes — orange/red emergency tint */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <svg
          className="absolute -top-[18%] -left-[8%] w-[55vw] opacity-[0.07] text-orange-500"
          viewBox="0 0 100 100" fill="currentColor"
          style={{ transform: "rotate(-14deg)" }}
        >
          <polygon points="50,10 100,90 0,90" />
        </svg>
        <svg
          className="absolute -bottom-[18%] -right-[8%] w-[55vw] opacity-[0.07] text-red-500"
          viewBox="0 0 100 100" fill="currentColor"
          style={{ transform: "rotate(10deg)" }}
        >
          <polygon points="50,0 100,50 50,100 0,50" />
        </svg>
        <svg
          className="absolute -bottom-[10%] -left-[12%] w-[35vw] opacity-[0.05] text-orange-400"
          viewBox="0 0 100 100" fill="currentColor"
          style={{ transform: "rotate(-6deg)" }}
        >
          <rect x="10" y="10" width="80" height="80" rx="10" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-lg mx-auto px-4"
      >
        {/* Main card */}
        <div
          className="bg-white rounded-[32px] border-4 p-8 flex flex-col items-center text-center relative overflow-hidden"
          style={{
            borderColor: "#F97316",
            boxShadow: "0 0 0 6px rgba(249,115,22,0.12), 0 20px 60px rgba(249,115,22,0.15)",
          }}
        >
          {/* Top accent stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[28px]"
            style={{ background: "linear-gradient(90deg, #F97316, #EF4444)" }}
          />

          {/* Illustration — rescue lifebuoy */}
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="mt-2 mb-6 flex items-center justify-center"
            style={{
              width: 108,
              height: 108,
              borderRadius: 28,
              background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
              border: "4px solid #FED7AA",
            }}
          >
            <span style={{ fontSize: 56, lineHeight: 1 }}>🛟</span>
          </motion.div>

          {/* Badge */}
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: "#FFF7ED", border: "2px solid #FED7AA" }}
          >
            <span style={{ fontSize: 14 }}>🚨</span>
            <span
              className="font-extrabold uppercase tracking-widest"
              style={{ fontSize: 11, color: "#EA580C", fontFamily: "'Nunito', sans-serif" }}
            >
              Emergency Recovery
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-black text-slate-800 mb-2 leading-tight"
            style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontFamily: "'Nunito', sans-serif" }}
          >
            Game Terminated{" "}
            <span style={{ color: "#F97316" }}>(Inactivity)</span>
          </h1>

          {/* Subtitle */}
          <p
            className="font-bold text-slate-500 mb-6 leading-relaxed"
            style={{ fontSize: "clamp(13px, 1.6vw, 16px)", fontFamily: "'Nunito', sans-serif", maxWidth: 360 }}
          >
            The host abandoned the session. The smart contract has{" "}
            <span className="text-slate-700">unlocked your stake.</span>
          </p>

          {/* Financial data box */}
          <div
            className="w-full rounded-[20px] flex items-center justify-between px-6 py-4 mb-6"
            style={{ background: "#F8FAFC", border: "2px solid #E2E8F0" }}
          >
            <div className="text-left">
              <p
                className="font-bold text-slate-400 mb-0.5"
                style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                Your Locked Stake
              </p>
              <p
                className="font-black text-slate-800"
                style={{ fontSize: 26, fontFamily: "'Nunito', sans-serif", letterSpacing: "-0.02em" }}
              >
                0.050 ETH
              </p>
            </div>
            <div
              className="flex items-center justify-center"
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
                border: "3px solid #FED7AA",
                fontSize: 26,
              }}
            >
              💰
            </div>
          </div>

          {/* CTA button */}
          {!done ? (
            <button
              onClick={handleClaim}
              disabled={signing}
              className="w-full flex items-center justify-center gap-3 font-black transition-all"
              style={{
                background: signing ? "#FB923C" : "#F97316",
                borderRadius: 18,
                borderBottom: signing ? "none" : "5px solid #C2410C",
                color: "white",
                fontSize: "clamp(15px, 2vw, 19px)",
                fontFamily: "'Nunito', sans-serif",
                padding: "16px 24px",
                cursor: signing ? "wait" : "pointer",
                transform: signing ? "translateY(5px)" : "translateY(0)",
                boxShadow: signing ? "none" : "0 6px 20px rgba(249,115,22,0.35)",
              }}
            >
              {signing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing Transaction...
                </>
              ) : (
                <>🛡️ Sign Transaction &amp; Claim Refund</>
              )}
            </button>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full flex items-center justify-center gap-3 font-black"
              style={{
                background: "#10B981",
                borderRadius: 18,
                borderBottom: "5px solid #047857",
                color: "white",
                fontSize: "clamp(15px, 2vw, 19px)",
                fontFamily: "'Nunito', sans-serif",
                padding: "16px 24px",
                boxShadow: "0 6px 20px rgba(16,185,129,0.35)",
              }}
            >
              ✅ Refund Sent — 0.050 ETH
            </motion.div>
          )}

          {/* Footer note */}
          <p
            className="text-slate-400 mt-4 leading-snug"
            style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
          >
            This action interacts directly with the ENKI KahootGame smart contract.
          </p>

          {/* Back link */}
          <button
            onClick={() => router.push("/waiting")}
            className="mt-3 text-slate-400 hover:text-slate-600 font-bold transition-colors"
            style={{ fontSize: 13, fontFamily: "'Nunito', sans-serif" }}
          >
            ← Back to Waiting Room
          </button>
        </div>
      </motion.div>
    </div>
  );
};
