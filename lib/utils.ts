import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes Tailwind de forma segura, resolvendo conflitos.
 * Requer: clsx + tailwind-merge
 *   npm install clsx tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
