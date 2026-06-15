"use client";
import { useState, useEffect } from "react";
import { Bell, Wallet, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";

import { useReadContract } from "wagmi";
import KahootGameABI from "../abi/KahootGame.json";

export const Navbar = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const [gameAddress, setGameAddress] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setGameAddress(params.get("game"));
    }
  }, [pathname]);

  const { data: lastActionTime } = useReadContract({
    address: gameAddress as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'lastActionTime',
    query: { enabled: !!gameAddress, refetchInterval: 60000 }
  });

  const [isInactive, setIsInactive] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!lastActionTime) {
      setIsInactive(false);
      return;
    }
    const checkInactivity = () => {
      const now = Math.floor(Date.now() / 1000);
      const limit = Number(lastActionTime) + (12 * 60 * 60); // 12 hours
      const diff = limit - now;
      if (diff <= 3600) { // Less than 1 hour left or already passed
        setIsInactive(true);
        if (diff <= 0) setTimeLeft("Claim fee now!");
        else setTimeLeft(`${Math.floor(diff/60)}m left`);
      } else {
        setIsInactive(false);
      }
    };
    checkInactivity();
    const interval = setInterval(checkInactivity, 60000);
    return () => clearInterval(interval);
  }, [lastActionTime]);

  if (pathname === "/") return null;

  return (
    <header className="w-full p-4 md:px-8 md:py-6 flex justify-between items-center bg-white shadow-sm relative z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-12 h-12 bg-white rounded-[16px] border-4 border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors shadow-sm"
        >
          <ArrowLeft strokeWidth={2.5} size={24} />
        </button>

        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-purple-600 text-white w-12 h-12 rounded-[16px] flex items-center justify-center font-bold text-2xl shadow-lg transform -rotate-3">
            E
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-slate-800">ENKI</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => {
            if (isInactive && gameAddress) {
              router.push(`/emergency-refund?game=${gameAddress}`);
            } else {
              // Standard notification panel toggle could go here
            }
          }}
          className={`w-12 h-12 bg-white rounded-[16px] border-4 flex items-center justify-center transition-colors shadow-sm relative group ${isInactive ? 'border-orange-300 text-orange-500 hover:bg-orange-50' : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
        >
          <Bell strokeWidth={2.5} size={24} />
          {isInactive && (
            <>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
              <div className="absolute top-14 right-0 w-max bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Inactive game: {timeLeft}
              </div>
            </>
          )}
        </button>
        <div className="h-12 bg-white rounded-[16px] border-4 border-slate-200 flex items-center px-4 gap-3 shadow-sm font-bold text-slate-700">
          <Wallet size={20} className="text-purple-500" />
          <span>{mounted && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}</span>
        </div>
        {mounted && address && (
          <button 
            onClick={() => {
              disconnect();
            }}
            className="w-12 h-12 bg-white rounded-[16px] border-4 border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"
          >
            <LogOut strokeWidth={2.5} size={24} />
          </button>
        )}
      </div>
    </header>
  );
};
