"use client";
import { Gamepad2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

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

      <button
        onClick={() => router.push("/host/dashboard")}
        className="mt-6 w-full py-4 px-5 bg-black border-2 border-black text-white shadow-[4px_4px_0px_#000] hover:bg-neo-accent hover:text-black active:translate-x-1 active:translate-y-1 active:shadow-none font-black text-sm uppercase tracking-wider transition-all flex items-center justify-between group/btn"
      >
        <span>Initialize Host Panel</span>
        <ArrowRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
