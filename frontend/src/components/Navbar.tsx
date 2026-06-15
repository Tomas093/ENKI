"use client";
import { useState, useEffect } from "react";
import { Bell, Wallet, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";

export const Navbar = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

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
        <button className="w-12 h-12 bg-white rounded-[16px] border-4 border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors shadow-sm">
          <Bell strokeWidth={2.5} size={24} />
        </button>
        <div className="h-12 bg-white rounded-[16px] border-4 border-slate-200 flex items-center px-4 gap-3 shadow-sm font-bold text-slate-700">
          <Wallet size={20} className="text-purple-500" />
          <span>{mounted && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}</span>
        </div>
        {mounted && address && (
          <button 
            onClick={() => {
              disconnect();
              router.push('/');
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
