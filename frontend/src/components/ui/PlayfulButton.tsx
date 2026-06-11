import React from "react";
import { cn } from "@/lib/utils"; // Assuming standard tailwind merge or I'll just use template literals if not available. Wait, I should implement a simple class merge or just use template literals.

// Actually I'll use standard string templates to avoid missing dependencies.
export const PlayfulButton = ({ 
  children, 
  variant = "primary",
  size = "md",
  className,
  onClick,
  disabled
}: { 
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger" | "purple" | "yellow" | "blue";
  size?: "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const baseClasses = "relative inline-flex items-center justify-center font-bold transition-all outline-none focus:outline-none";
  
  const variants = {
    primary: "bg-blue-500 text-white active:bg-blue-600",
    secondary: "bg-white text-slate-800 border-4 border-slate-200 active:bg-slate-50",
    success: "bg-[#10B981] text-white active:bg-[#059669]",
    danger: "bg-red-500 text-white active:bg-red-600",
    purple: "bg-purple-600 text-white active:bg-purple-700",
    yellow: "bg-amber-400 text-slate-900 active:bg-amber-500",
    blue: "bg-blue-500 text-white active:bg-blue-600",
  };

  const shadows = {
    primary: "border-b-[6px] border-blue-700 active:border-b-0 active:translate-y-[6px]",
    secondary: "border-b-[6px] border-slate-300 active:border-b-0 active:translate-y-[6px]",
    success: "border-b-[6px] border-[#047857] active:border-b-0 active:translate-y-[6px]",
    danger: "border-b-[6px] border-red-700 active:border-b-0 active:translate-y-[6px]",
    purple: "border-b-[6px] border-purple-800 active:border-b-0 active:translate-y-[6px]",
    yellow: "border-b-[6px] border-amber-600 active:border-b-0 active:translate-y-[6px]",
    blue: "border-b-[6px] border-blue-700 active:border-b-0 active:translate-y-[6px]",
  };

  const sizes = {
    md: "text-lg px-6 py-3 rounded-[16px]",
    lg: "text-2xl px-8 py-4 rounded-[20px]",
    xl: "text-3xl px-12 py-6 rounded-[24px]",
  };

  const disabledClasses = disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer";

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${!disabled && shadows[variant]} ${sizes[size]} ${disabledClasses} ${className || ""}`}
    >
      {children}
    </button>
  );
};
