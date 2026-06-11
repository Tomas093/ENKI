import { useState } from "react";
import { Users, Wallet, Search, ArrowRight } from "lucide-react";

interface JoinGameProps {
  walletAddress: string;
  onJoined: () => void;
}

const VALID_ADDRESS = "0x1368CE4a2b9f391d26890CAbCdEf4827f391B29";

const GAME_DETAILS = {
  title: "Systems Engineering Final Review",
  host: "Professor",
  hostAddress: "0x71C...B29",
  fee: "0.050",
  feeUsd: "160",
  players: 14,
  maxPlayers: 50,
};

function CornerDecorations() {
  return (
    <>
    </>
  );
}

export function JoinGame({ walletAddress, onJoined }: JoinGameProps) {
  const [address, setAddress] = useState("");
  const [found, setFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [staking, setStaking] = useState(false);
  const [error, setError] = useState("");

  const isValidAddress = address.trim().toLowerCase().startsWith("0x") && address.trim().length >= 10;

  const handleSearch = () => {
    if (!isValidAddress) { setError("Please enter a valid Ethereum contract address starting with 0x."); return; }
    setSearching(true);
    setError("");
    setTimeout(() => {
      setSearching(false);
      setFound(true);
    }, 1000);
  };

  const handlePay = () => {
    setStaking(true);
    setTimeout(() => { setStaking(false); onJoined(); }, 1800);
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    setError("");
    if (found) setFound(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <CornerDecorations />

      <div style={{ maxWidth: found ? "900px" : "560px", margin: "0 auto", transition: "max-width 0.35s ease", position: "relative", zIndex: 1 }}>
        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: "26px", color: "#111827", margin: "0 0 4px" }}>
            🎮 Join a Game
          </h1>
          <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>
            Paste the game contract address your professor shared to find and join the live session.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: found ? "1fr 1fr" : "1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* Input card */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              border: "1.5px solid #E8EAF0",
              padding: "32px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: "#111827", fontSize: "18px", marginBottom: "4px" }}>
              Enter Game Contract Address
            </div>
            <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 22px", lineHeight: 1.5 }}>
              Paste the Ethereum address of the game smart contract.
            </p>

            {/* Address input */}
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <div
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <Wallet size={16} style={{ color: "#9CA3AF" }} />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="0x..."
                spellCheck={false}
                style={{
                  width: "100%",
                  paddingTop: "14px",
                  paddingBottom: "14px",
                  paddingLeft: "40px",
                  paddingRight: "14px",
                  background: "#F8F9FD",
                  borderTop: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`,
                  borderLeft: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`,
                  borderRight: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`,
                  borderBottom: `3px solid ${error ? "#F87171" : "#D1D5DB"}`,
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 500,
                  color: "#111827",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => {
                  if (!error) {
                    e.currentTarget.style.borderTopColor = "#7C3AED";
                    e.currentTarget.style.borderLeftColor = "#7C3AED";
                    e.currentTarget.style.borderRightColor = "#7C3AED";
                    e.currentTarget.style.borderBottomColor = "#5b21b6";
                  }
                }}
                onBlur={(e) => {
                  if (!error) {
                    e.currentTarget.style.borderTopColor = "#E2E8F0";
                    e.currentTarget.style.borderLeftColor = "#E2E8F0";
                    e.currentTarget.style.borderRightColor = "#E2E8F0";
                    e.currentTarget.style.borderBottomColor = "#D1D5DB";
                  }
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              />
            </div>

            {error && (
              <p style={{ color: "#EF4444", fontSize: "12px", margin: "0 0 10px", display: "flex", alignItems: "center", gap: "4px" }}>
                ⚠️ {error}
              </p>
            )}

            {/* Demo hint */}
            <p style={{ color: "#D1D5DB", fontSize: "11px", margin: "0 0 18px", lineHeight: 1.5 }}>
              Demo: paste any address starting with <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9CA3AF" }}>0x</span> to find the mock game.
            </p>

            <button
              onClick={handleSearch}
              disabled={searching || !address.trim()}
              style={{
                width: "100%",
                background: searching || !address.trim()
                  ? "#E5E7EB"
                  : "linear-gradient(135deg, #7C3AED 0%, #5b21b6 100%)",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                borderBottom: searching || !address.trim() ? "4px solid #D1D5DB" : "4px solid #3b0764",
                borderRadius: "16px",
                padding: "15px",
                color: searching || !address.trim() ? "#9CA3AF" : "white",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: "16px",
                cursor: searching || !address.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: searching || !address.trim() ? "none" : "0 6px 20px rgba(124,58,237,0.28)",
                transition: "all 0.2s ease",
              }}
            >
              <Search size={16} />
              {searching ? "Searching Contract…" : found ? "✓ Contract Found" : "Search Game Contract"}
            </button>
          </div>

          {/* Game details card */}
          {found && (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "24px",
                border: "1.5px solid #E8EAF0",
                overflow: "hidden",
                boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.05)",
                animation: "slideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(18px); } to { opacity:1; transform:translateX(0); } }`}</style>

              {/* Card header */}
              <div
                style={{
                  background: "linear-gradient(135deg, #7C3AED 0%, #1368CE 100%)",
                  padding: "22px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "26px" }}>🎮</span>
                <div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: "white", fontSize: "15px" }}>
                    Live Room Found!
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
                    {address.slice(0, 16)}…
                  </div>
                </div>
              </div>

              <div style={{ padding: "24px 28px" }}>
                {/* Room title */}
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ color: "#9CA3AF", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>
                    Room Title
                  </div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: "#111827", fontSize: "17px", lineHeight: 1.3 }}>
                    {GAME_DETAILS.title}
                  </div>
                </div>

                {/* Host */}
                <div
                  style={{
                    background: "#F8F9FD",
                    borderTop: "1.5px solid #E8EAF0",
                    borderLeft: "1.5px solid #E8EAF0",
                    borderRight: "1.5px solid #E8EAF0",
                    borderBottom: "3px solid #D1D5DB",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #7C3AED, #5b21b6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "18px",
                    }}
                  >
                    👨‍🏫
                  </div>
                  <div>
                    <div style={{ color: "#9CA3AF", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Host</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#111827", fontSize: "14px" }}>
                      {GAME_DETAILS.host}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9CA3AF", fontSize: "11px" }}>
                      {GAME_DETAILS.hostAddress}
                    </div>
                  </div>
                </div>

                {/* Fee + Players */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "22px" }}>
                  <div
                    style={{
                      background: "#F5F3FF",
                      borderTop: "1.5px solid #DDD6FE",
                      borderLeft: "1.5px solid #DDD6FE",
                      borderRight: "1.5px solid #DDD6FE",
                      borderBottom: "3px solid #C4B5FD",
                      borderRadius: "14px",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                      <Wallet size={11} style={{ color: "#7C3AED" }} />
                      <span style={{ color: "#7C3AED", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry Fee</span>
                    </div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: "#7C3AED", fontSize: "22px", lineHeight: 1 }}>
                      {GAME_DETAILS.fee} ETH
                    </div>
                    <div style={{ color: "#a78bfa", fontSize: "11px", marginTop: "3px" }}>
                      ≈ ${GAME_DETAILS.feeUsd} USD
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#F0FDF4",
                      borderTop: "1.5px solid #BBF7D0",
                      borderLeft: "1.5px solid #BBF7D0",
                      borderRight: "1.5px solid #BBF7D0",
                      borderBottom: "3px solid #86EFAC",
                      borderRadius: "14px",
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                      <Users size={11} style={{ color: "#16a34a" }} />
                      <span style={{ color: "#16a34a", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Players</span>
                    </div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: "#166534", fontSize: "22px", lineHeight: 1 }}>
                      {GAME_DETAILS.players} / {GAME_DETAILS.maxPlayers}
                    </div>
                    <div style={{ color: "#4ade80", fontSize: "11px", marginTop: "3px" }}>
                      Joined
                    </div>
                  </div>
                </div>

                {/* Pay & Enter button */}
                <button
                  onClick={handlePay}
                  disabled={staking}
                  style={{
                    width: "100%",
                    background: staking ? "#9CA3AF" : "#10B981",
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "none",
                    borderBottom: staking ? "4px solid #6B7280" : "4px solid #059669",
                    borderRadius: "18px",
                    padding: "18px",
                    color: "white",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 900,
                    fontSize: "17px",
                    cursor: staking ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: staking ? "none" : "0 8px 24px rgba(16,185,129,0.32)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {staking ? (
                    "⏳ Signing Transaction…"
                  ) : (
                    <>
                      Pay Entry Fee & Enter Game
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p style={{ color: "#D1D5DB", textAlign: "center", fontSize: "11px", marginTop: "12px", marginBottom: 0 }}>
                  🔒 0.050 ETH locked in the smart contract until the game concludes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
