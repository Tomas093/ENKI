import { useState } from "react";
import { ArrowLeft, Shield, CheckCircle2 } from "lucide-react";

interface RefundPageProps {
  onBack: () => void;
}

export function RefundPage({ onBack }: RefundPageProps) {
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handleClaim = () => {
    setClaiming(true);
    setTimeout(() => { setClaiming(false); setClaimed(true); }, 2000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F2F4F8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Back link */}
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#6b7280",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            marginBottom: "20px",
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Back to Game
        </button>

        {/* Main card */}
        <div
          style={{
            background: "white",
            borderRadius: "28px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
            border: "2px solid #E5E7EB",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #1368CE 100%)",
              padding: "28px 32px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "16px",
                width: "52px",
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Shield size={26} color="white" />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 900,
                  fontSize: "22px",
                  color: "white",
                  margin: 0,
                }}
              >
                🔒 Secure Refund Portal
              </h1>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: 0 }}>
                Protected by on-chain AFK Circuit Breaker
              </p>
            </div>
          </div>

          <div style={{ padding: "28px 32px" }}>
            {/* AFK warning */}
            <div
              style={{
                background: "#FFF7ED",
                border: "2px solid #FED7AA",
                borderRadius: "16px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "22px", flexShrink: 0 }}>⚠️</span>
              <div>
                <div
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 800,
                    color: "#92400e",
                    fontSize: "14px",
                  }}
                >
                  Professor has been inactive
                </div>
                <div style={{ color: "#b45309", fontSize: "12px", marginTop: "2px" }}>
                  The game has been automatically paused. You may reclaim your locked stake.
                </div>
              </div>
            </div>

            {/* Stake amount */}
            <div
              style={{
                background: "#F5F3FF",
                border: "2px solid #DDD6FE",
                borderRadius: "16px",
                padding: "20px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>
                YOUR LOCKED STAKE
              </div>
              <div
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 900,
                  fontSize: "40px",
                  color: "#7C3AED",
                  lineHeight: 1,
                }}
              >
                0.050 ETH
              </div>
              <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "4px" }}>
                ≈ $160 USD · Entry fee paid on join
              </div>
            </div>

            {/* Claim button / success */}
            {claimed ? (
              <div
                style={{
                  background: "#DCFCE7",
                  border: "2px solid #BBF7D0",
                  borderRadius: "18px",
                  padding: "22px",
                  textAlign: "center",
                }}
              >
                <CheckCircle2 size={40} style={{ color: "#16a34a", margin: "0 auto 10px" }} />
                <div
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 900,
                    fontSize: "20px",
                    color: "#166534",
                  }}
                >
                  Funds Claimed! 🎉
                </div>
                <div style={{ color: "#16a34a", fontSize: "13px", marginTop: "4px" }}>
                  0.050 ETH sent to your wallet · Tx: 0x7f3a…b291
                </div>
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={claiming}
                style={{
                  width: "100%",
                  background: claiming
                    ? "#9ca3af"
                    : "linear-gradient(135deg, #ea6c0a 0%, #c2590a 100%)",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderBottom: claiming ? "4px solid #6b7280" : "4px solid #92400e",
                  borderRadius: "18px",
                  padding: "18px",
                  color: "white",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 900,
                  fontSize: "18px",
                  cursor: claiming ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: claiming ? "none" : "0 8px 28px rgba(234,108,10,0.35)",
                }}
              >
                {claiming ? (
                  <>⏳ Submitting Transaction…</>
                ) : (
                  <>💸 Claim My Funds Now</>
                )}
              </button>
            )}

            {/* Security note */}
            <p style={{ color: "#d1d5db", textAlign: "center", fontSize: "11px", marginTop: "16px" }}>
              🔒 This transaction is executed directly on Ethereum — no intermediary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
