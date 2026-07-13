"use client";
import { useRouter } from "next/navigation";
import { Plus, Layers } from "lucide-react";
import { useHostDashboard } from '@/features/host/useHostDashboard';
import { SessionRow } from '@/features/host/SessionRow';

export default function HostDashboard() {
  const router = useRouter();
  const { gameAddresses, games, hasGames } = useHostDashboard();

  return (
    <div className="w-full min-h-[100dvh] flex flex-col px-4 md:px-8 lg:px-12 py-10 relative">

      <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="font-black text-[48px] uppercase tracking-[-0.03em] leading-[0.88] text-black mb-2">
              Host Dashboard
            </h1>
            <p className="font-mono text-[12px] uppercase tracking-[0.05em] text-gray-500">
              // Manage your live trivia sessions
            </p>
          </div>
          <button
            onClick={() => router.push("/host-game")}
            className="flex items-center gap-2 bg-neo-accent border-2 border-black text-black shadow-[4px_4px_0px_#000] font-black uppercase text-sm tracking-wide px-6 py-4 hover:bg-white active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
            Deploy New Session
          </button>
        </div>

        {/* Sessions List */}
        <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] flex flex-col">
          {/* Table Header */}
          <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between bg-black text-white">
            <div className="flex items-center gap-3">
              <Layers size={18} strokeWidth={2.5} />
              <h2 className="font-black uppercase tracking-wide text-[13px]">
                Active Sessions
              </h2>
            </div>
            <div className="bg-neo-accent text-black px-2 py-1 border-2 border-black font-black text-xs uppercase tracking-wide shadow-[2px_2px_0px_#000]">
              {gameAddresses.length} Deployed
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col">
            {!hasGames ? (
              <div className="py-24 flex flex-col items-center justify-center text-center bg-white">
                <div className="w-14 h-14 border-2 border-black bg-white shadow-[4px_4px_0px_#000] flex items-center justify-center mb-6 text-black">
                  <Plus size={24} strokeWidth={3} />
                </div>
                <p className="font-black uppercase tracking-wide text-black text-[14px] mb-2">
                  No sessions yet
                </p>
                <p className="font-mono text-sm uppercase tracking-[0.08em] text-gray-500">
                  // Deploy your first game to start hosting
                </p>
              </div>
            ) : (
              games.map((game) => (
                <SessionRow key={game.address} gameAddress={game.address} gameId={game.id} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
