import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "purple" | "green" | "red" | "amber" | "blue";
  size?: "sm" | "md";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-slate-100 text-slate-600",
  purple: "bg-purple-50 text-purple-700 border border-purple-100",
  green: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  red: "bg-red-50 text-red-700 border border-red-100",
  amber: "bg-amber-50 text-amber-700 border border-amber-100",
  blue: "bg-blue-50 text-blue-700 border border-blue-100",
};

const sizeClasses: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "text-xs px-2.5 py-1 rounded-lg",
  md: "text-xs px-3 py-1.5 rounded-xl",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 font-bold tracking-wide uppercase",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
