import { useState, useEffect } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";

export function ToastAFK() {
  const [visible, setVisible] = useState(true);
  const [seconds, setSeconds] = useState(11 * 3600 + 59 * 60); // 11h 59m

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const formatted = `${h}h ${String(m).padStart(2, "0")}m`;

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 100,
        fontFamily: "'DM Sans', sans-serif",
        animation: "slideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
      <div
        style={{
          background: "#FFFFFF",
          border: "2px solid #D97706",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(217,119,6,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          padding: "16px 20px",
          maxWidth: "340px",
          minWidth: "300px",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div
              style={{
                background: "#FEF3C7",
                border: "2px solid #D97706",
                borderRadius: "10px",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} style={{ color: "#D97706" }} strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#92400e", fontSize: "14px" }}
              >
                ⚠️ Professor is AFK!
              </div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>
                Game pauses in{" "}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#D97706", fontWeight: 600 }}>
                  {formatted}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            style={{
              color: "#9ca3af",
              background: "#F2F4F8",
              border: "none",
              borderRadius: "8px",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#f3f4f6", margin: "8px 0" }} />

        {/* CTA */}
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#7C3AED",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            padding: "4px 0",
          }}
          onClick={() => alert("Redirecting to Secure Refund Page…")}
        >
          Go to Secure Refund Page
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
