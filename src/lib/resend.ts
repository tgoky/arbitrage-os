// lib/resend.ts
// Resend client singleton + shared constants for auth emails.
import { Resend } from 'resend';

let _resend: Resend | null = null;

/**
 * Returns a lazily-initialized Resend client.
 * Throws at call time (not module-load time) if the API key is missing,
 * so the rest of the app can boot even if the key isn't set yet.
 */
export function getResendClient(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY environment variable is not set. ' +
        'Add it to your .env file or hosting environment.'
      );
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'ArbitrageOS <team@tech.growaiagency.io>';

export const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';