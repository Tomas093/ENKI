import { useState } from "react";
import { ArrowRight, Zap, Loader2 } from "lucide-react";
import { MetaMaskLogo, WalletConnectLogo, CoinbaseLogo } from "./WalletIcons";
import { WalletRow } from "./WalletRow";

interface LoginGatewayProps {
  onEnter: (flow: "professor" | "student", address: string) => void;
}

const MOCK_ADDRESS = "0x4a2b...f391";

const WALLETS = [
  { name: "MetaMask",        icon: <MetaMaskLogo /> },
  { name: "WalletConnect",   icon: <WalletConnectLogo /> },
  { name: "Coinbase Wallet", icon: <CoinbaseLogo /> },
];

export function LoginGateway({ onEnter }: LoginGatewayProps) {
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const handleWallet = (name: string) => {
    setConnecting(name);
    setTimeout(() => { setConnecting(null); setConnected(true); }, 1400);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F6FA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "40px 24px",
      }}
    >
      {/* Corner decoration — top-left massive Red Triangle */}


      {/* Main card */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "28px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.07)",
          padding: "48px 44px 38px",
          width: "100%",
          maxWidth: "460px",
          position: "relative",
          zIndex: 1,
          border: "1.5px solid #E8EAF0",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "18px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #1368CE 100%)",
                borderRadius: "14px",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(124,58,237,0.28)",
              }}
            >
              <Zap size={22} color="white" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: "34px",
                letterSpacing: "0.06em",
                background: "linear-gradient(90deg, #7C3AED 0%, #1368CE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ENKI
            </span>
          </div>

          {/* 4 game shapes row */}

          <h1
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: "22px",
              color: "#111827",
              margin: "0 0 6px",
            }}
          >
            The Web3 Trivia Game
          </h1>
          <p style={{ color: "#6B7280", fontSize: "13px", margin: 0, lineHeight: 1.55 }}>
            Play trivia, climb the leaderboard, and win real ETH on-chain.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#F3F4F6", margin: "22px 0 20px" }} />

        {/* Wallet rows or connected → role selection */}
        {connected ? (
          <div>
            <div
              style={{
                background: "#F0FDF4",
                border: "1.5px solid #BBF7D0",
                borderRadius: "14px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "18px" }}>✅</span>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#166534", fontSize: "13px" }}>
                  Wallet Connected
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#16a34a", fontSize: "11px" }}>
                  {MOCK_ADDRESS}
                </div>
              </div>
            </div>

            <p style={{ color: "#9CA3AF", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
              Choose your role
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { role: "professor" as const, emoji: "👨‍🏫", label: "Professor", desc: "Create games & manage prizes" },
                { role: "student"   as const, emoji: "🎮",   label: "Student",   desc: "Play trivia & win ETH" },
              ].map((r) => (
                <button
                  key={r.role}
                  onClick={() => onEnter(r.role, MOCK_ADDRESS)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    background: "white",
                    borderTop: "1.5px solid #E2E8F0",
                    borderLeft: "1.5px solid #E2E8F0",
                    borderRight: "1.5px solid #E2E8F0",
                    borderBottom: "4px solid #D1D5DB",
                    borderRadius: "16px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    width: "100%",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "#F5F3FF";
                    el.style.borderTopColor = "#DDD6FE";
                    el.style.borderLeftColor = "#DDD6FE";
                    el.style.borderRightColor = "#DDD6FE";
                    el.style.borderBottomColor = "#C4B5FD";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "white";
                    el.style.borderTopColor = "#E2E8F0";
                    el.style.borderLeftColor = "#E2E8F0";
                    el.style.borderRightColor = "#E2E8F0";
                    el.style.borderBottomColor = "#D1D5DB";
                  }}
                >
                  <span style={{ fontSize: "28px", flexShrink: 0 }}>{r.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#111827", fontSize: "15px" }}>
                      {r.label}
                    </div>
                    <div style={{ color: "#6B7280", fontSize: "12px", marginTop: "1px" }}>{r.desc}</div>
                  </div>
                  <ArrowRight size={15} style={{ color: "#9CA3AF", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: "#9CA3AF", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
              Connect your wallet
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {WALLETS.map((w) => (
                <WalletRow
                  key={w.name}
                  name={connecting === w.name ? "Connecting…" : w.name}
                  icon={connecting === w.name ? <Loader2 size={24} className="animate-spin text-purple-600" /> : w.icon}
                  onClick={() => handleWallet(w.name)}
                />
              ))}
            </div>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <p style={{ color: "#D1D5DB", textAlign: "center", fontSize: "11px", marginTop: "24px", marginBottom: 0, lineHeight: 1.5 }}>
          🔒 Secured by Ethereum smart contracts. We never store your private keys.
        </p>
      </div>
    </div>
  );
}
