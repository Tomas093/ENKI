import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Download, CheckCircle, XCircle, Trophy } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const SESSION_DATA: Record<string, { topic: string; players: number; started: string }> = {
  "ENK-4821": { topic: "Blockchain Basics", players: 14, started: "2 min ago" },
  "ENK-3310": { topic: "DeFi Fundamentals", players: 22, started: "Yesterday" },
  "ENK-7754": { topic: "NFT & Digital Ownership", players: 9, started: "3 days ago" },
};

const MOCK_PARTICIPANTS = [
  { wallet: "0x3fA9...B21C", score: 10, claimed: true },
  { wallet: "0x8cD1...44Ee", score: 9, claimed: true },
  { wallet: "0x1b2F...9901", score: 9, claimed: false },
  { wallet: "0xAe77...CC34", score: 8, claimed: true },
  { wallet: "0x55D2...1F0A", score: 7, claimed: true },
  { wallet: "0x9012...B3D5", score: 7, claimed: false },
  { wallet: "0x24aC...7E56", score: 6, claimed: true },
  { wallet: "0xF301...2AB9", score: 5, claimed: false },
  { wallet: "0x6e89...DD12", score: 5, claimed: false },
  { wallet: "0x7714...C005", score: 4, claimed: false },
  { wallet: "0xBB21...9F3E", score: 3, claimed: false },
  { wallet: "0x0045...1122", score: 2, claimed: false },
];

const PASS_THRESHOLD = 6;

const PIE_DATA = [
  { name: "Passed", value: MOCK_PARTICIPANTS.filter(p => p.score >= PASS_THRESHOLD).length },
  { name: "Failed", value: MOCK_PARTICIPANTS.filter(p => p.score < PASS_THRESHOLD).length },
];
const PIE_COLORS = ["#7c3aed", "#e2e8f0"];

const scoreCount: Record<number, number> = {};
MOCK_PARTICIPANTS.forEach(p => {
  scoreCount[p.score] = (scoreCount[p.score] || 0) + 1;
});
const BAR_DATA = Array.from({ length: 11 }, (_, i) => ({ score: i, students: scoreCount[i] || 0 }));

const PODIUM = MOCK_PARTICIPANTS.slice(0, 3);

const medalColors = ["#F59E0B", "#94A3B8", "#D97706"];
const medalLabels = ["🥇", "🥈", "🥉"];
const podiumOrder = [1, 0, 2]; // silver, gold, bronze visual order

export const SessionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = SESSION_DATA[id ?? ""] ?? { topic: "Unknown Session", players: 12, started: "N/A" };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pt-8 pb-20 gap-8 relative z-10">

      {/* 1. Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-slate-800 text-4xl tracking-tight">Session Results</h1>
          <p className="text-slate-400 font-semibold mt-1">{session.topic} · {id} · {session.players} players</p>
        </div>
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-3 rounded-[16px] shadow-lg shadow-purple-200 transition-all hover:-translate-y-0.5">
          <Download size={18} />
          Export Data
        </button>
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
                <div className="font-black text-2xl" style={{ color: medalColors[rank] }}>{player.score}/10</div>
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
          <p className="text-slate-400 font-semibold text-sm mb-4">Pass threshold: {PASS_THRESHOLD}/10</p>
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
                  const pct = item ? Math.round((item.value / MOCK_PARTICIPANTS.length) * 100) : 0;
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
          <span className="bg-slate-100 text-slate-500 font-bold text-xs px-3 py-1 rounded-full">{MOCK_PARTICIPANTS.length} participants</span>
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
              {MOCK_PARTICIPANTS.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-400 text-sm">{i + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 font-mono text-sm">{p.wallet}</td>
                  <td className="px-6 py-4">
                    <span className={`font-black text-sm px-3 py-1 rounded-[8px] ${p.score >= PASS_THRESHOLD ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.score}/10
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
