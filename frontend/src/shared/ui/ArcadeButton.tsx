"use client";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

// ─── Neo-Brutalist arcade button ─────────────────────────────────────────────
export function ArcadeButton({
  onClick,
  loading,
  disabled,
  children,
  type = "button",
  accent = "yellow",
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  type?: "button" | "submit";
  accent?: "yellow" | "black";
}) {
  const bg = accent === "yellow" ? "bg-neo-accent" : "bg-black";
  const text = accent === "yellow" ? "text-black" : "text-white";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ x: 4, y: 4 }}
      transition={{ duration: 0.06 }}
      style={{
        boxShadow: "4px 4px 0px #000",
      }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        (e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0px #000";
        (e.currentTarget as HTMLElement).style.transform = "translate(2px, 2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0px #000";
        (e.currentTarget as HTMLElement).style.transform = "translate(0, 0)";
      }}
      className={[
        "w-full flex items-center justify-center gap-2.5",
        "border-2 border-black",
        "font-black text-[16px] uppercase tracking-wide",
        "px-6 py-4 min-h-[54px]",
        "transition-[box-shadow,transform] duration-75",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF3366]",
        disabled || loading
          ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
          : `${bg} ${text} cursor-pointer`,
      ].join(" ")}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : null}
      {children}
    </motion.button>
  );
}
