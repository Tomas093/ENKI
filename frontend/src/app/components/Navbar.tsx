"use client";
import { useState, useEffect } from "react";
import { Wallet, LogOut, ArrowLeft, User, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useDisconnect, useConnect, useReadContract } from "wagmi";
import { PROFILES_ADDRESS, enkiProfilesAbi } from "../../lib/contracts";
import { useAudio } from "../../contexts/AudioContext";

export const Navbar = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectors, connect } = useConnect();
  const { isMuted, toggleMute } = useAudio();
  const isHome = pathname === "/";
  const isProfile = pathname === "/profile";

  const { data: nicknameData } = useReadContract({
    address: PROFILES_ADDRESS,
    abi: enkiProfilesAbi,
    functionName: "nicknames",
    args: address ? [address] : undefined,
    query: { enabled: !!address && mounted },
  });
  const globalNickname = nicknameData as string | undefined;

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

        {/* Right: Wallet Status & Audio */}
        <div className="flex items-center gap-3">
          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className="w-11 h-11 bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000] hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            title={isMuted ? "Unmute" : "Mute"}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
          </button>

          {mounted && address ? (
            <div className="flex items-center gap-2">
              {/* Nickname/Address chip → links to /profile */}
              <Link
                href="/profile"
                className={`h-11 bg-white border-2 border-black flex items-center px-4 gap-2.5 shadow-[2px_2px_0px_#000] hover:bg-neo-accent transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${isProfile ? "bg-neo-accent" : ""}`}
              >
                <div className="w-2.5 h-2.5 bg-[#4AF626] border border-black shrink-0" />
                <span className="font-black uppercase text-[12px] tracking-widest text-black">
                  {globalNickname && globalNickname.length > 0
                    ? globalNickname
                    : `${address.slice(0, 6)}...${address.slice(-4)}`}
                </span>
                <User size={13} strokeWidth={3} className="text-black/50 shrink-0" />
              </Link>
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
