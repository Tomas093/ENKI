"use client";
import { useRouter } from "next/navigation";
import { Plus, Layers } from "lucide-react";
import { useHostDashboard } from "../../../hooks/useHostDashboard";
import { SessionRow } from "../components/SessionRow";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { PageBlobs } from "../../../components/ui/PageBlobs";

export default function TeacherDashboard() {
  const router = useRouter();
  const { gameAddresses, hasGames } = useHostDashboard();

  return (
    <div className="w-full min-h-full flex flex-col px-4 md:px-8 lg:px-12 py-10 relative">
      <PageBlobs primary="purple" secondary="blue" />

      <div className="max-w-4xl mx-auto relative z-10 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-slate-800 text-3xl md:text-4xl tracking-tight">
              Host Dashboard
            </h1>
            <p className="text-slate-500 font-medium mt-1.5">
              Manage your live trivia sessions.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push("/host-game")}
            leftIcon={<Plus size={18} />}
          >
            Deploy New Session
          </Button>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <Layers size={16} className="text-slate-400" />
              <h2 className="font-extrabold text-slate-700 text-sm uppercase tracking-wide">
                Active Sessions
              </h2>
            </div>
            <Badge variant="purple" size="sm">
              {gameAddresses.length} Deployed
            </Badge>
          </div>

          {/* Content */}
          <div className="divide-y divide-slate-100">
            {!hasGames ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                  <Plus size={28} />
                </div>
                <p className="text-slate-500 font-semibold text-base mb-1">
                  No sessions yet
                </p>
                <p className="text-slate-400 text-sm">
                  Deploy your first game to start hosting.
                </p>
              </div>
            ) : (
              gameAddresses.slice().reverse().map((addr) => (
                <SessionRow key={addr} gameAddress={addr} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
