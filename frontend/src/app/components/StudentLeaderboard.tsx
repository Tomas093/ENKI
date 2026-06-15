import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Wallet, ChevronRight, CheckCircle2, Trophy } from "lucide-react";

const PLAYERS = [
  { rank: 1, ens: "cryptoqueen.eth", address: "0x4a2b...f391", score: 9800, correct: 10, prize: 1.44,  isSelf: false },
  { rank: 2, ens: "defi_wizard.eth", address: "0x7e1c...a8d4", score: 9400, correct: 9,  prize: 0.24,  isSelf: false },
  { rank: 2, ens: "satoshi_jr.eth",  address: "0xb3f0...2c19", score: 9400, correct: 9,  prize: 0.24,  isSelf: true  },
  { rank: 4, ens: "blockchainbob.eth",address: "0xd45a...8801",score: 8900, correct: 8,  prize: 0,     isSelf: false },
  { rank: 5, ens: "nftmaxi.eth",     address: "0xf221...9c34", score: 8200, correct: 7,  prize: 0,     isSelf: false },
  { rank: 6, ens: "web3newbie.eth",  address: "0xa09e...3d77", score: 7300, correct: 6,  prize: 0,     isSelf: false },
];

const TOP3_CONFIG = [
  { place: "2nd", color: "#94a3b8", bg: "#F8FAFC", border: "#E2E8F0", height: 80,  size: 56, emoji: "🥈" },
  { place: "1st", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", height: 110, size: 72, emoji: "🥇" },
  { place: "3rd", color: "#1368CE", bg: "#EFF6FF", border: "#BFDBFE", height: 60,  size: 48, emoji: "🥉" },
];
const PODIUM_PLAYERS = [PLAYERS[1], PLAYERS[0], PLAYERS[2]]; // order: 2nd, 1st, 3rd for podium layout

export function StudentLeaderboard() {
  const [claimed, setClaimed] = useState(false);
  const self = PLAYERS.find((p) => p.isSelf)!;
  const isWinner = self.prize > 0;

  useEffect(() => {
    if (!isWinner) return;
    const fire = () =>
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ["#7C3AED", "#1368CE", "#D97706", "#26890C", "#E21B3C"] });
    fire();
    const t1 = setTimeout(fire, 600);
    const t2 = setTimeout(fire, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isWinner]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="space-y-5 max-w-3xl mx-auto">
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #1368CE 100%)",
          borderRadius: "28px",
          padding: "32px 24px 20px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

        <div style={{ fontSize: "40px", marginBottom: "8px" }}>🏆</div>
        <h1 style={{ fontFamily: "'Nunito', sans-serif", color: "white", fontWeight: 900, fontSize: "28px", margin: 0 }}>
          Game Over!
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", marginTop: "6px" }}>
          47 players · 2.400 ETH prize pool distributed
        </p>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 mt-6">
          {TOP3_CONFIG.map((cfg, i) => {
            const player = PODIUM_PLAYERS[i];
            return (
              <div key={cfg.place} className="flex flex-col items-center gap-2">
                {/* Player avatar */}
                <div
                  style={{
                    width: cfg.size, height: cfg.size,
                    background: cfg.bg,
                    border: `3px solid ${cfg.border}`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 900,
                    fontSize: cfg.size * 0.35,
                    color: cfg.color,
                    boxShadow: `0 6px 20px rgba(0,0,0,0.15)`,
                  }}
                >
                  {player.ens.charAt(0).toUpperCase()}
                </div>
                <div style={{ color: "white", fontSize: "11px", fontWeight: 600, textAlign: "center", maxWidth: "80px" }}>
                  {player.ens.replace(".eth", "")}
                  {player.isSelf && (
                    <span style={{ background: "#D97706", color: "white", borderRadius: "999px", fontSize: "9px", padding: "1px 6px", marginLeft: "4px", fontWeight: 700 }}>
                      YOU
                    </span>
                  )}
                </div>
                {/* Podium base */}
                <div
                  style={{
                    width: "72px",
                    height: cfg.height,
                    background: cfg.bg,
                    border: `2px solid ${cfg.border}`,
                    borderRadius: "12px 12px 0 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    paddingTop: "8px",
                    gap: "2px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{cfg.emoji}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: "11px", color: cfg.color }}>
                    {cfg.place}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: cfg.color, fontWeight: 600 }}>
                    {PODIUM_PLAYERS[i].prize.toFixed(3)}Ξ
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tie notice */}
      <div
        style={{
          background: "#FFFBEB",
          border: "2px solid #FDE68A",
          borderRadius: "16px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px",
          color: "#92400e",
          fontWeight: 600,
        }}
      >
        <span style={{ fontSize: "16px" }}>⭐</span>
        <span>
          <strong>Tie at 2nd place</strong> — defi_wizard.eth and satoshi_jr.eth both scored 9,400 pts.
          Prize of 0.480 ETH split equally (0.240 ETH each). Olympic rule applied.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ranking table */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            border: "2px solid #E5E7EB",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "2px solid #F3F4F6" }}>
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#1a1a2e", margin: 0, fontSize: "16px" }}>
              🏅 Full Rankings
            </h3>
          </div>

          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 70px 60px",
              padding: "8px 20px",
              background: "#F8F9FD",
              borderBottom: "2px solid #F3F4F6",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "#9ca3af",
              fontWeight: 600,
            }}
          >
            <div>#</div>
            <div>Player</div>
            <div style={{ textAlign: "right" }}>Score</div>
            <div style={{ textAlign: "right" }}>Prize</div>
          </div>

          {PLAYERS.map((p, i) => (
            <div
              key={`${p.address}-${i}`}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 70px 60px",
                padding: "12px 20px",
                borderBottom: "1px solid #F3F4F6",
                background: p.isSelf ? "#F5F3FF" : "white",
                borderLeft: p.isSelf ? "4px solid #7C3AED" : "4px solid transparent",
                alignItems: "center",
              }}
            >
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: "16px", color: p.rank === 1 ? "#D97706" : "#6b7280" }}>
                {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank}
              </div>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "#1a1a2e", fontSize: "13px" }}>
                  {p.ens}
                  {p.isSelf && (
                    <span style={{ background: "#7C3AED", color: "white", borderRadius: "999px", fontSize: "9px", padding: "1px 6px", marginLeft: "6px" }}>
                      YOU
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9ca3af", fontSize: "10px" }}>{p.address}</div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#1a1a2e", fontSize: "14px" }}>
                {p.score.toLocaleString()}
              </div>
              <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: "12px", color: p.prize > 0 ? "#7C3AED" : "#d1d5db" }}>
                {p.prize > 0 ? `${p.prize.toFixed(3)}Ξ` : "—"}
              </div>
            </div>
          ))}
        </div>

        {/* Claim card */}
        <div className="space-y-4">
          {isWinner ? (
            <div
              style={{
                background: "linear-gradient(135deg, #F5F3FF 0%, #EFF6FF 100%)",
                border: "3px solid #7C3AED",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "0 8px 32px rgba(124,58,237,0.15)",
              }}
            >
              <div style={{ textAlign: "center", fontSize: "40px", marginBottom: "8px" }}>🎉</div>
              <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: "#7C3AED", textAlign: "center", fontSize: "22px", margin: "0 0 4px" }}>
                You Won!
              </h2>
              <p style={{ color: "#6b7280", textAlign: "center", fontSize: "13px", marginBottom: "16px" }}>
                You tied for {self.rank}{self.rank === 1 ? "st" : self.rank === 2 ? "nd" : "rd"} place.
              </p>

              <div
                style={{
                  background: "white",
                  border: "2px solid #DDD6FE",
                  borderRadius: "16px",
                  padding: "16px",
                  textAlign: "center",
                  marginBottom: "16px",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600 }}>Your Share</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: "#7C3AED", fontSize: "36px", lineHeight: 1 }}>
                  {self.prize.toFixed(3)}
                  <span style={{ fontSize: "20px" }}> ETH</span>
                </div>
                <div style={{ color: "#9ca3af", fontSize: "11px", marginTop: "4px" }}>≈ ${(self.prize * 3200).toFixed(0)} USD</div>
              </div>

              {claimed ? (
                <div
                  style={{
                    background: "#DCFCE7",
                    border: "2px solid #BBF7D0",
                    borderRadius: "14px",
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "#166534",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 800,
                    fontSize: "15px",
                  }}
                >
                  <CheckCircle2 size={18} />
                  Prize sent to your wallet! 🚀
                </div>
              ) : (
                <button
                  onClick={() => { setClaimed(true); confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } }); }}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #7C3AED, #1368CE)",
                    border: "none",
                    borderBottom: "4px solid #3b0764",
                    borderRadius: "16px",
                    padding: "16px",
                    color: "white",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 900,
                    fontSize: "17px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
                  }}
                >
                  <Wallet size={18} />
                  Claim Your Shared Prize Pool
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                background: "#FFFFFF",
                border: "2px solid #E5E7EB",
                borderRadius: "24px",
                padding: "24px",
                textAlign: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>😅</div>
              <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#1a1a2e", fontSize: "18px", margin: "0 0 8px" }}>
                Not a winner this round
              </h3>
              <p style={{ color: "#6b7280", fontSize: "13px" }}>
                You finished #{self.rank}. Top 2 places win prizes. Try again next game!
              </p>
            </div>
          )}

          {/* Prize breakdown */}
          <div
            style={{
              background: "#FFFFFF",
              border: "2px solid #E5E7EB",
              borderRadius: "24px",
              padding: "20px 24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#1a1a2e", fontSize: "15px", margin: "0 0 14px" }}>
              💰 Prize Distribution
            </h3>
            {[
              { label: "🥇 1st Place", pct: 60, eth: "1.440", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
              { label: "🥈 2nd Place", pct: 20, eth: "0.480", color: "#94a3b8", bg: "#F8FAFC", border: "#E2E8F0" },
              { label: "🥉 3rd Place", pct: 10, eth: "0.240", color: "#1368CE", bg: "#EFF6FF", border: "#BFDBFE" },
              { label: "👨‍🏫 Professor",  pct: 10, eth: "0.240", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
            ].map((row) => (
              <div key={row.label} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "13px", color: "#374151" }}>{row.label}</span>
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: "12px", color: row.color, background: row.bg, border: `1px solid ${row.border}`, borderRadius: "8px", padding: "2px 8px" }}
                  >
                    {row.eth} ETH
                  </span>
                </div>
                <div style={{ height: "8px", background: "#EEF0F6", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${row.pct}%`, background: row.color, borderRadius: "999px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
