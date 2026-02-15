import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyCompact(value: number) {
  const isNegative = value < 0
  const absValue = Math.abs(value)
  
  let formatted = ''
  
  if (absValue >= 10000000) {
    formatted = `${(absValue / 10000000).toFixed(2)} Cr`
  } else if (absValue >= 100000) {
    formatted = `${(absValue / 100000).toFixed(2)} L`
  } else if (absValue >= 1000) {
    formatted = `${(absValue / 1000).toFixed(2)} k`
  } else {
    formatted = absValue.toLocaleString()
  }

  return `₹${isNegative ? '-' : ''}${formatted}`
}
