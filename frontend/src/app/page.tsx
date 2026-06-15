"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { ChevronRight, Wallet } from "lucide-react";

// ── Corner Shapes (inline, light-mode EdTech style) ─────────────────────────

const LoginCornerShapes = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Red Triangle — top-left */}
    <svg className="absolute -top-[18%] -left-[8%] w-[55vw] max-w-[720px] opacity-[0.13] text-red-500 -rotate-12"
      viewBox="0 0 100 100" fill="currentColor">
      <polygon points="50,0 100,100 0,100" />
    </svg>
    {/* Blue Diamond — bottom-right */}
    <svg className="absolute -bottom-[18%] -right-[8%] w-[55vw] max-w-[720px] opacity-[0.13] text-blue-500 rotate-12"
      viewBox="0 0 100 100" fill="currentColor">
      <polygon points="50,0 100,50 50,100 0,50" />
    </svg>
  </div>
);

// ── Wallet icons (SVG inline, brand-accurate colors) ─────────────────────────

const MetaMaskIcon = () => (
  <img src="/metamask.svg" alt="MetaMask" width="28" height="28" />
);

const WalletConnectIcon = () => (
  <img src="/walletconnect.svg" alt="WalletConnect" width="28" height="28" />
);

// ── Screen 1: Wallet Connection ──────────────────────────────────────────────

const WALLETS = [
  { id: "metamask",      label: "MetaMask",       Icon: MetaMaskIcon },
  { id: "walletconnect", label: "WalletConnect",   Icon: WalletConnectIcon },
];

import { useConnect, useAccount } from 'wagmi';
import { useEffect } from 'react';

const WalletScreen = ({ onConnect }: { onConnect: () => void }) => {
  const { connectors, connect, isPending } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      onConnect();
    }
  }, [isConnected, onConnect]);

  const handleConnect = (id: string) => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden w-full flex items-center justify-center bg-[#F4F6FA] px-4 relative">
      <LoginCornerShapes />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Card */}
        <div className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-2xl shadow-slate-200/80 px-10 py-10">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-[18px] bg-purple-600 flex items-center justify-center font-black text-white text-3xl shadow-lg -rotate-3 mb-4">
              E
            </div>
            <h1 className="font-black text-slate-800 text-3xl tracking-tight">ENKI</h1>
            <p className="text-slate-400 font-semibold text-sm mt-1.5">Connect to Play</p>
          </div>

          {/* Wallet rows */}
          <div className="flex flex-col gap-3">
            {WALLETS.map(({ id, label, Icon }) => {
              return (
                <button
                  key={id}
                  onClick={() => handleConnect(id)}
                  disabled={isPending}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-[12px] border-2 border-[#E2E8F0] bg-white hover:border-purple-300 hover:bg-purple-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 group cursor-pointer"
                >
                  <div className="shrink-0">
                    {isPending ? (
                      <div className="w-7 h-7 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                    ) : (
                      <Icon />
                    )}
                  </div>
                  <span className="flex-1 text-left font-bold text-slate-700 text-base">
                    {isPending ? "Connecting…" : label}
                  </span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-purple-400 transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <p className="text-center text-slate-400 text-xs font-medium mt-7">
            🔒 Secured by Ethereum smart contracts.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ── Screen 2: Role / Destination Selection ───────────────────────────────────

const DESTINATIONS = [
  {
    id: "student",
    emoji: "🎓",
    label: "Join Game",
    subtitle: "Enter a PIN to play and win ETH.",
    path: "/staking",
    accent: "#3B82F6",
    bg: "bg-blue-50",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    hoverBg: "hover:bg-blue-100",
    iconBg: "bg-blue-500",
    badgeText: "text-blue-600",
  },
  {
    id: "teacher",
    emoji: "👨‍🏫",
    label: "Host Dashboard",
    subtitle: "Create and manage live trivia sessions.",
    path: "/host/dashboard",
    accent: "#7C3AED",
    bg: "bg-purple-50",
    border: "border-purple-200",
    hoverBorder: "hover:border-purple-400",
    hoverBg: "hover:bg-purple-100",
    iconBg: "bg-purple-600",
    badgeText: "text-purple-600",
  },
  {
    id: "ranking",
    emoji: "🏆",
    label: "Global Ranking",
    subtitle: "View the top NFT certificate holders.",
    path: "/global-ranking",
    accent: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hoverBorder: "hover:border-amber-400",
    hoverBg: "hover:bg-amber-100",
    iconBg: "bg-amber-500",
    badgeText: "text-amber-600",
  },
];

const MOCK_ADDRESS = "0x7a3B...1234";

const RoleScreen = ({ onDisconnect }: { onDisconnect: () => void }) => {
  const router = useRouter();

  return (
    <div className="h-[100dvh] overflow-hidden w-full flex flex-col bg-[#F4F6FA] relative">
      <LoginCornerShapes />


      {/* Main */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-14">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="font-black text-slate-800 text-4xl md:text-5xl tracking-tight mb-2">
            Welcome! Where to?
          </h2>
          <p className="text-slate-400 font-semibold text-lg">
            Choose your destination to continue.
          </p>
        </motion.div>

        {/* Destination cards */}
        <div className="flex flex-col md:flex-row gap-5 w-full max-w-4xl">
          {DESTINATIONS.map((dest, i) => (
            <motion.button
              key={dest.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => router.push(dest.path)}
              className={`group flex-1 ${dest.bg} border-[3px] ${dest.border} ${dest.hoverBorder} ${dest.hoverBg} rounded-[24px] p-7 flex flex-col items-start gap-5 text-left transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer`}
            >
              {/* Icon bubble */}
              <div className={`w-16 h-16 rounded-[18px] ${dest.iconBg} flex items-center justify-center text-3xl shadow-md -rotate-3 group-hover:rotate-0 transition-transform duration-200`}>
                {dest.emoji}
              </div>

              <div>
                <div className="font-black text-slate-800 text-2xl mb-1 tracking-tight">
                  {dest.label}
                </div>
                <div className={`font-semibold text-sm ${dest.badgeText}`}>
                  {dest.subtitle}
                </div>
              </div>

              {/* Arrow */}
              <div className="mt-auto self-end">
                <div className={`w-9 h-9 rounded-full border-2 ${dest.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <ChevronRight size={18} className={dest.badgeText} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
};

// ── Root export ──────────────────────────────────────────────────────────────

export default function Login() {
  const router = useRouter();

  return (
    <AnimatePresence mode="wait">
      <motion.div key="wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
        <WalletScreen onConnect={() => router.push('/select-role')} />
      </motion.div>
    </AnimatePresence>
  );
}
