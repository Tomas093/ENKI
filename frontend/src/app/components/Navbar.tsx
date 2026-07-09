"use client";
import { useState, useEffect } from "react";
import { Wallet, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useDisconnect, useConnect } from "wagmi";

export const Navbar = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectors, connect } = useConnect();
  const isHome = pathname === "/";

  const handleConnectWallet = () => {
    if (connectors.length > 0) connect({ connector: connectors[0] });
  };

  return (
    <header className="w-full bg-white/85 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex justify-between items-center gap-4">

        {/* Left: Back + Logo */}
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all duration-200"
              aria-label="Go back"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-tr from-purple-600 to-indigo-500 text-white w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shadow-sm transform group-hover:scale-105 transition-transform duration-200">
              E
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-800">ENKI</span>
          </Link>
        </div>

        {/* Right: Wallet Status */}
        <div className="flex items-center gap-3">
          {mounted && address ? (
            <div className="flex items-center gap-2">
              {/* Address pill */}
              <div className="h-9 bg-slate-50 border border-slate-200 rounded-xl flex items-center px-3.5 gap-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                <span className="font-semibold text-slate-700 text-sm font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              {/* Disconnect */}
              <button
                onClick={() => disconnect()}
                className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm"
                title="Disconnect wallet"
                aria-label="Disconnect wallet"
              >
                <LogOut size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : mounted ? (
            <button
              onClick={handleConnectWallet}
              className="h-9 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl flex items-center gap-2 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <Wallet size={15} strokeWidth={2.5} />
              Connect Wallet
            </button>
          ) : (
            <div className="h-9 w-32 bg-slate-100 rounded-xl animate-pulse" />
          )}
        </div>

      </div>
    </header>
  );
};
