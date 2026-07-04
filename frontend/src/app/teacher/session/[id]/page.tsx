"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle, XCircle, Trophy, Wallet, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useWriteContract, usePublicClient, useReadContract } from "wagmi";
import toast from "react-hot-toast";
import KahootGameABI from "../../../../abi/KahootGame.json";

const PIE_COLORS = ["#7c3aed", "#e2e8f0"];
const medalColors = ["#F59E0B", "#94A3B8", "#D97706"];
const medalLabels = ["🥇", "🥈", "🥉"];
const podiumOrder = [1, 0, 2];

import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

export default function SessionDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { writeContractAsync, isPending } = useWriteContract();
  const publicClient = usePublicClient();

  const { data: passingScoreData } = useReadContract({ address: id as `0x${string}`, abi: KahootGameABI.abi, functionName: 'passingScore' });
  const { data: totalQuestionsData } = useReadContract({ address: id as `0x${string}`, abi: KahootGameABI.abi, functionName: 'totalQuestions' });

  const PASS_THRESHOLD = Number(passingScoreData) || 1;
  const TOTAL_QUESTIONS = Number(totalQuestionsData) || 1;

  const [participants, setParticipants] = useState<{wallet: string, score: number, claimed: boolean}[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sessionTitle, setSessionTitle] = useState("Loading...");

  useEffect(() => {
    const data = localStorage.getItem("current_kahoot_session");
    if (data) {
      setSessionTitle(JSON.parse(data).title);
    } else {
      setSessionTitle("Trivia Session");
    }
  }, []);

  const session = { 
    topic: sessionTitle, 
    players: participants.length, 
    started: "Ended" 
  };

  useEffect(() => {
    if (!publicClient || !id) return;
    const fetchStats = async () => {
      try {
        const logClient = createPublicClient({
          chain: sepolia,
          transport: http('https://ethereum-sepolia-rpc.publicnode.com')
        });

        const currentBlock = await logClient.getBlockNumber();
        const fromBlock = currentBlock > 9000n ? currentBlock - 9000n : 0n;

        const logs = await logClient.getContractEvents({
          address: id as `0x${string}`,
          abi: KahootGameABI.abi,
          eventName: 'PlayerJoined',
          fromBlock: fromBlock,
          toBlock: 'latest'
        });
        
        const wallets = Array.from(new Set(logs.map(l => (l as any).args?.player as `0x${string}`)));
        
        const scorePromises = wallets.map(wallet => 
          publicClient.readContract({
            address: id as `0x${string}`,
            abi: KahootGameABI.abi,
            functionName: 'scores',
            args: [wallet]
          })
        );
        const claimPromises = wallets.map(wallet => 
          publicClient.readContract({
            address: id as `0x${string}`,
            abi: KahootGameABI.abi,
            functionName: 'hasPrizeClaimed',
            args: [wallet]
          })
        );

        const scores = await Promise.all(scorePromises);
        const claims = await Promise.all(claimPromises);

        const p = wallets.map((w, i) => ({
          wallet: `${w.slice(0,6)}...${w.slice(-4)}`,
          score: Number(scores[i]),
          claimed: Boolean(claims[i])
        })).sort((a, b) => b.score - a.score);

        setParticipants(p);
      } catch (e) {
        console.error("Failed to fetch stats", e);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [publicClient, id]);

  const PIE_DATA = [
    { name: "Passed", value: participants.filter(p => p.score >= PASS_THRESHOLD).length },
    { name: "Failed", value: participants.filter(p => p.score < PASS_THRESHOLD).length },
  ];

  const scoreCount: Record<number, number> = {};
  participants.forEach(p => {
    scoreCount[p.score] = (scoreCount[p.score] || 0) + 1;
  });
  const BAR_DATA = Array.from({ length: TOTAL_QUESTIONS + 1 }, (_, i) => ({ score: i, students: scoreCount[i] || 0 }));

  const PODIUM = participants.slice(0, 3);

  const handleClaimEarnings = async () => {
    try {
      await writeContractAsync({
        address: id as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: 'claimPrize'
      });
      toast.success("Earnings claimed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to claim earnings. They might already be claimed.");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pt-8 pb-20 gap-8 relative z-10">

      {/* 1. Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-slate-800 text-4xl tracking-tight">Session Results</h1>
          <p className="text-slate-400 font-semibold mt-1">{session.topic} · {id} · {session.players} players</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleClaimEarnings}
            disabled={isPending}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3 rounded-[16px] shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="animate-spin" size={18} /> : <Wallet size={18} />}
            Claim Earnings
          </button>
        </div>
      </motion.div>

      {/* 2. Podium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm p-8"
      >
        <h2 className="font-black text-slate-800 text-xl mb-8 flex items-center gap-2">
          <Trophy size={22} className="text-yellow-500" /> Top 3 Players
        </h2>
        <div className="flex items-end justify-center gap-4 md:gap-8">
          {podiumOrder.map((rank) => {
            const player = PODIUM[rank];
            if (!player) return <div key={rank} className="flex flex-col items-center gap-3 flex-1 max-w-[180px]"></div>;

            const heights = ["h-28", "h-36", "h-24"];
            const bgColors = [
              "bg-gradient-to-b from-amber-50 to-amber-100 border-amber-300",
              "bg-gradient-to-b from-yellow-50 to-yellow-100 border-yellow-400",
              "bg-gradient-to-b from-orange-50 to-orange-100 border-orange-300",
            ];
            return (
              <div key={rank} className="flex flex-col items-center gap-3 flex-1 max-w-[180px]">
                <div className="text-4xl">{medalLabels[rank]}</div>
                <div className="font-black text-slate-800 text-sm text-center">{player.wallet}</div>
                <div className="font-black text-2xl" style={{ color: medalColors[rank] }}>{player.score}/{TOTAL_QUESTIONS}</div>
                <div
                  className={`w-full rounded-t-[16px] border-[3px] flex items-end justify-center pb-3 ${heights[rank]} ${bgColors[rank]}`}
                >
                  <span className="font-black text-slate-500 text-sm">#{rank + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 3. Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Card A — Pass Rate Donut */}
        <div className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-800 text-lg mb-1">Pass Rate</h3>
          <p className="text-slate-400 font-semibold text-sm mb-4">Pass threshold: {PASS_THRESHOLD}/{TOTAL_QUESTIONS}</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {PIE_DATA.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} students`, ""]} />
              <Legend
                formatter={(value, entry) => {
                  const item = PIE_DATA.find(d => d.name === value);
                  const total = participants.length || 1;
                  const pct = item ? Math.round((item.value / total) * 100) : 0;
                  return <span className="font-bold text-slate-600">{value} — {pct}%</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Card B — Score Distribution Bar */}
        <div className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-800 text-lg mb-1">Score Distribution</h3>
          <p className="text-slate-400 font-semibold text-sm mb-4">Students per score</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={BAR_DATA} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="score" tick={{ fontWeight: 700, fontSize: 12 }} />
              <YAxis tick={{ fontWeight: 700, fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [`${v} students`, "Count"]} />
              <Bar dataKey="students" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 4. Full Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-800 text-xl">Full Leaderboard</h2>
          <span className="bg-slate-100 text-slate-500 font-bold text-xs px-3 py-1 rounded-full">{participants.length} participants</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100">
                <th className="text-left px-6 py-3 font-black text-slate-500 text-xs uppercase tracking-wider w-8">#</th>
                <th className="text-left px-6 py-3 font-black text-slate-500 text-xs uppercase tracking-wider">Wallet Address</th>
                <th className="text-left px-6 py-3 font-black text-slate-500 text-xs uppercase tracking-wider">Final Score</th>
                <th className="text-left px-6 py-3 font-black text-slate-500 text-xs uppercase tracking-wider">Diploma Claimed</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {participants.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-400 text-sm">{i + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 font-mono text-sm">{p.wallet}</td>
                  <td className="px-6 py-4">
                    <span className={`font-black text-sm px-3 py-1 rounded-[8px] ${p.score >= PASS_THRESHOLD ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.score}/{TOTAL_QUESTIONS}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {p.claimed ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                        <CheckCircle size={16} /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400 font-bold text-sm">
                        <XCircle size={16} /> No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
