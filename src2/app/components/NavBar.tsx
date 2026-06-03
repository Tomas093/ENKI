import { useState, useRef, useEffect } from "react";
import { Wallet, Zap, Bell, ArrowRight, X } from "lucide-react";

interface NavBarProps {
  flow: "professor" | "student";
  onFlowChange: (f: "professor" | "student") => void;
  walletAddress: string;
  onRefundPage: () => void;
}

export function NavBar({ flow, onFlowChange, walletAddress, onRefundPage }: NavBarProps) {
  const [bellOpen, setBellOpen] = useState(false);
  const hasAlert = true;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  return (
    <nav
      style={{
        background: "#1a1a2e",
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        fontFamily: "'DM Sans', sans-serif",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #1368CE 100%)",
              borderRadius: "12px",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(124,58,237,0.4)",
            }}
          >
            <Zap size={18} color="white" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: "22px",
              letterSpacing: "0.05em",
              background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ENKI
          </span>
        </div>

        {/* Flow toggle */}
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "4px",
            display: "flex",
            gap: "2px",
          }}
        >
          {(["professor", "student"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFlowChange(f)}
              style={{
                background: flow === f ? "white" : "transparent",
                color: flow === f ? "#1a1a2e" : "rgba(255,255,255,0.6)",
                borderRadius: "10px",
                padding: "8px 20px",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: flow === f ? 800 : 600,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                boxShadow: flow === f ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {f === "professor" ? "👨‍🏫" : "🎮"}
              {f === "professor" ? "Professor" : "Student"}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Ethereum badge */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
              borderRadius: "999px",
              padding: "4px 12px",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#26890C", display: "inline-block" }} />
            Ethereum
          </div>

          {/* Bell icon with dropdown */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              onClick={() => setBellOpen((o) => !o)}
              style={{
                background: bellOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s ease",
              }}
            >
              <Bell size={18} color="rgba(255,255,255,0.8)" />
              {hasAlert && (
                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    background: "#F97316",
                    border: "2px solid #1a1a2e",
                  }}
                />
              )}
            </button>

            {/* Dropdown */}
            {bellOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  width: "320px",
                  background: "white",
                  border: "2px solid #E5E7EB",
                  borderRadius: "20px",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  animation: "dropIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                  zIndex: 200,
                }}
              >
                <style>{`@keyframes dropIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px 12px",
                    borderBottom: "1px solid #F3F4F6",
                  }}
                >
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#1a1a2e", fontSize: "15px" }}>
                    🔔 Notifications
                  </span>
                  <button
                    onClick={() => setBellOpen(false)}
                    style={{
                      background: "#F3F4F6",
                      border: "none",
                      borderRadius: "8px",
                      width: "26px",
                      height: "26px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#9ca3af",
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Alert item */}
                <div style={{ padding: "14px 18px" }}>
                  <div
                    style={{
                      background: "#FFF7ED",
                      border: "2px solid #FED7AA",
                      borderRadius: "14px",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "20px", flexShrink: 0 }}>⚠️</span>
                      <div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#92400e", fontSize: "13px" }}>
                          Professor is AFK
                        </div>
                        <div style={{ color: "#b45309", fontSize: "12px", marginTop: "2px", lineHeight: 1.4 }}>
                          The game has been automatically paused. Your stake is protected and can be reclaimed.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setBellOpen(false); onRefundPage(); }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#7C3AED",
                        fontFamily: "'Nunito', sans-serif",
                        fontWeight: 700,
                        fontSize: "13px",
                        padding: 0,
                      }}
                    >
                      Go to Secure Refund Page
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wallet address pill */}
          <div
            style={{
              background: "rgba(16,185,129,0.15)",
              border: "2px solid rgba(16,185,129,0.4)",
              borderRadius: "12px",
              padding: "8px 14px",
              color: "#34d399",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Wallet size={13} />
            {walletAddress}
          </div>
        </div>
      </div>
    </nav>
  );
}
