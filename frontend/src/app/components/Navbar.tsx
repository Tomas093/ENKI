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
    <header className="w-full bg-neo-bg border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex justify-between items-center gap-4">

        {/* Left: Back + Logo */}
        <div className="flex items-center gap-3">
          {!isHome && (
            <button
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center bg-white border-2 border-black text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-neo-accent transition-all"
              aria-label="Go back"
            >
              <ArrowLeft size={18} strokeWidth={3} />
            </button>
          )}

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-neo-accent text-black border-2 border-black w-9 h-9 flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_#000] group-active:translate-x-0.5 group-active:translate-y-0.5 group-active:shadow-none transition-all">
              E
            </div>
            <span className="text-xl font-black uppercase tracking-[-0.03em] text-black">ENKI</span>
          </Link>
        </div>

        {/* Right: Wallet Status */}
        <div className="flex items-center gap-3">
          {mounted && address ? (
            <div className="flex items-center gap-2">
              {/* Address pill */}
              <div className="h-11 bg-white border-2 border-black flex items-center px-4 gap-2 shadow-[2px_2px_0px_#000]">
                <div className="w-2.5 h-2.5 bg-[#4AF626] border border-black" />
                <span className="font-black uppercase text-[12px] tracking-widest text-black">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              {/* Disconnect */}
              <button
                onClick={() => disconnect()}
                className="w-11 h-11 bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000] hover:bg-[#E61919] hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                title="Disconnect wallet"
                aria-label="Disconnect wallet"
              >
                <LogOut size={16} strokeWidth={3} />
              </button>
            </div>
          ) : mounted ? (
            <button
              onClick={handleConnectWallet}
              className="h-11 px-5 bg-white border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-neo-accent active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 text-black text-[11px] font-black uppercase tracking-widest"
            >
              <Wallet size={16} strokeWidth={2.5} />
              Connect Wallet
            </button>
          ) : (
            <div className="h-11 w-36 bg-gray-200 border-2 border-black animate-pulse" />
          )}
        </div>

      </div>
    </header>
  );
};
