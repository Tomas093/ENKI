import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[#FFE234] text-black border-4 border-black shadow-[6px_6px_0px_#000] hover:bg-yellow-400 active:translate-x-1 active:translate-y-1 active:shadow-none",
  secondary:
    "bg-white text-black border-4 border-black shadow-[6px_6px_0px_#000] hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none",
  ghost:
    "bg-transparent text-black border-4 border-transparent hover:border-black active:translate-x-1 active:translate-y-1",
  danger:
    "bg-[#FF3366] text-black border-4 border-black shadow-[6px_6px_0px_#000] hover:bg-red-500 active:translate-x-1 active:translate-y-1 active:shadow-none",
  success:
    "bg-[#39FF14] text-black border-4 border-black shadow-[6px_6px_0px_#000] hover:bg-[#2CE80B] active:translate-x-1 active:translate-y-1 active:shadow-none",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "text-sm px-4 py-2 rounded-xl gap-1.5",
  md: "text-base px-6 py-3 rounded-2xl gap-2",
  lg: "text-lg px-8 py-4 rounded-2xl gap-2.5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-bold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 select-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none shadow-none translate-y-0",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
