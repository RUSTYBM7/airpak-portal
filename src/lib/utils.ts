import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Execute an async operation with exponential backoff retry.
 * Handles transient network failures gracefully.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's a client error (4xx) except 429 Too Many Requests
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        throw error;
      }

      // Also don't retry typical auth invalid credentials
      if (error?.message?.toLowerCase().includes('invalid login credentials')) {
        throw error;
      }

      if (attempt === maxRetries - 1) break;

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
      console.warn(`[Network] Operation failed, retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
  });
}

/**
 * Sanitize rich text input (allows basic safe HTML)
 */
export function sanitizeRichText(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitize code highlighting HTML (allows span and class)
 */
export function sanitizeCodeHtml(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['span'],
    ALLOWED_ATTR: ['class'],
  });
}
