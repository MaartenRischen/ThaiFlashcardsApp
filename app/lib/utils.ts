import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility to check if we're in a browser environment
export function isBrowser() {
  return typeof window !== 'undefined'
} 