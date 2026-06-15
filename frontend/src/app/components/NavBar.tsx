import { useState, useRef, useEffect } from "react";
import { Wallet, Zap, Bell, ArrowRight, X, LogOut } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useNavigate, useLocation } from "react-router";

interface NavBarProps {
  onRefundPage: () => void;
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function NavBar({ onRefundPage }: NavBarProps) {
  const [bellOpen, setBellOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleDisconnect = () => {
    disconnect();
    navigate("/");
  };

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
        <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate("/")}>
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

        {/* Flow toggle: Student / Professor */}
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: "14px",
            padding: "4px",
            display: "flex",
            gap: "2px",
          }}
        >
          {(
            [
              { label: "👨‍🏫 Professor", path: "/professor/create", match: "/professor" },
              { label: "🎮 Student", path: "/student", match: "/student" },
              { label: "🏆 Ranking", path: "/global-ranking", match: "/global-ranking" },
            ] as const
          ).map((item) => {
            const isActive = pathname.startsWith(item.match);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  background: isActive ? "white" : "transparent",
                  color: isActive ? "#1a1a2e" : "rgba(255,255,255,0.6)",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  border: "none",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Chain badge */}
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
            Localhost:8545
          </div>

          {/* Bell */}
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
                transition: "background 0.2s ease",
                position: "relative",
              }}
            >
              <Bell size={18} color="rgba(255,255,255,0.8)" />
            </button>

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
                  zIndex: 200,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 12px", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#1a1a2e", fontSize: "15px" }}>🔔 Notifications</span>
                  <button
                    onClick={() => setBellOpen(false)}
                    style={{ background: "#F3F4F6", border: "none", borderRadius: "8px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9ca3af" }}
                  >
                    <X size={13} />
                  </button>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  <div style={{ background: "#FFF7ED", border: "2px solid #FED7AA", borderRadius: "14px", padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "20px", flexShrink: 0 }}>⚠️</span>
                      <div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#92400e", fontSize: "13px" }}>Emergency Refund Available</div>
                        <div style={{ color: "#b45309", fontSize: "12px", marginTop: "2px", lineHeight: 1.4 }}>
                          If the professor is inactive for 12h, your stake is refundable.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setBellOpen(false); onRefundPage(); }}
                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#7C3AED", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "13px", padding: 0 }}
                    >
                      Go to Secure Refund Page <ArrowRight size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wallet connect / address pill */}
          {isConnected && address ? (
            <div className="flex items-center gap-2">
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
                {shortAddr(address)}
              </div>
              <button
                onClick={handleDisconnect}
                title="Disconnect wallet"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "10px",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#f87171",
                  transition: "all 0.2s",
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: injected() })}
              disabled={isPending}
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #1368CE 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "8px 18px",
                color: "white",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                cursor: isPending ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: isPending ? 0.7 : 1,
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(124,58,237,0.35)",
              }}
            >
              <Wallet size={14} />
              {isPending ? "Connecting…" : "Connect MetaMask"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
