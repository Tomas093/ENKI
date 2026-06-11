"use client";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wallet, Loader } from "lucide-react";

const WALLETS = [
  { name: "MetaMask", emoji: "🦊", color: "border-orange-400", hover: "hover:border-orange-500 hover:shadow-orange-300/40" },
  { name: "WalletConnect", emoji: "🔵", color: "border-blue-400", hover: "hover:border-blue-500 hover:shadow-blue-300/40" },
  { name: "Coinbase Wallet", emoji: "🟦", color: "border-sky-400", hover: "hover:border-sky-500 hover:shadow-sky-300/40" },
  { name: "Phantom", emoji: "👻", color: "border-purple-400", hover: "hover:border-purple-500 hover:shadow-purple-300/40" },
];

export default function WalletConnect() {
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = (walletName: string) => {
    setConnecting(walletName);
    // Simulate connection delay
    setTimeout(() => {
      router.push("/");
    }, 1800);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 relative z-10">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="bg-purple-600 text-white w-16 h-16 rounded-[20px] flex items-center justify-center font-black text-3xl shadow-xl transform -rotate-3">
            E
          </div>
          <span className="text-5xl font-black tracking-tight text-slate-800">ENKI</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-700 mb-2">Connect your Wallet</h2>
        <p className="text-slate-500 font-medium">Choose a wallet to get started</p>
      </motion.div>

      {/* Wallet options */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm flex flex-col gap-4 px-4"
      >
        {WALLETS.map((wallet, index) => {
          const isConnecting = connecting === wallet.name;
          return (
            <motion.button
              key={wallet.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.08 }}
              onClick={() => !connecting && handleConnect(wallet.name)}
              disabled={!!connecting}
              className={`group w-full bg-white rounded-[20px] border-[4px] ${wallet.color} ${!connecting ? wallet.hover : ""} shadow-lg p-5 flex items-center gap-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <span className="text-3xl leading-none select-none">{wallet.emoji}</span>
              <span className="font-black text-xl text-slate-800 flex-1 text-left">{wallet.name}</span>
              {isConnecting ? (
                <Loader size={22} className="text-purple-500 animate-spin" />
              ) : (
                <Wallet size={22} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 text-slate-400 text-sm font-medium text-center max-w-xs px-4"
      >
        By connecting, you agree to ENKI's Terms of Service. Your wallet is never stored on our servers.
      </motion.p>
    </div>
  );
};
