import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility to merge Tailwind CSS class names safely to prevent conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
