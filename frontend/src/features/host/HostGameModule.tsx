"use client";
import { Gamepad2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { ArcadeButton } from '@/shared/ui/ArcadeButton';

export function HostGameModule() {
  const router = useRouter();

  return (
    <div className="border-2 border-black bg-white shadow-[6px_6px_0px_#000] p-6 flex flex-col justify-between min-h-[220px]">
      <div>
        <div className="w-11 h-11 border-2 border-black bg-white shadow-[3px_3px_0px_#000] flex items-center justify-center mb-5 text-black">
          <Gamepad2 size={24} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-[-0.03em] leading-[0.88] text-black mb-2">
          Host a Game
        </h2>
        <p className="font-mono text-sm uppercase tracking-[0.05em] text-gray-500 mb-4">
          // Deploy a new session for your students
        </p>

        <span className="inline-flex items-center bg-neo-accent border-2 border-black font-black text-xs uppercase px-2 py-1 tracking-wider shadow-[2px_2px_0px_#000] text-black">
          Requires ETH stake
        </span>
      </div>

      <div className="mt-6">
        <ArcadeButton accent="black" onClick={() => router.push("/host/dashboard")}>
          Initialize Host Panel
          <ArrowRight size={18} strokeWidth={2.5} />
        </ArcadeButton>
      </div>
    </div>
  );
}
