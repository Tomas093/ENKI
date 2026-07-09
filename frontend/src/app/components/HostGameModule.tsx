"use client";
import { PlusCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "../../components/ui/Card";

export function HostGameModule() {
  const router = useRouter();

  return (
    <Card variant="elevated" padding="md" className="group flex flex-col justify-between min-h-[220px]">
      <div>
        <div className="w-11 h-11 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mb-5 border border-slate-200">
          <PlusCircle size={22} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">
          Host a Game
        </h2>
        <p className="text-slate-600 font-medium text-base mb-4 leading-relaxed">
          Deploy a new session for your students.
        </p>

        <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
          Requires ETH stake
        </span>
      </div>

      <button
        onClick={() => router.push("/host/dashboard")}
        className="mt-6 w-full py-4 px-5 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-xl flex items-center justify-between text-base transition-all duration-200 group/btn"
      >
        <span>Initialize Host Panel</span>
        <ArrowRight size={18} className="transform group-hover/btn:translate-x-1 transition-transform duration-200" />
      </button>
    </Card>
  );
}
