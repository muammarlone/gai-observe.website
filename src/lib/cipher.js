/**
 * Verify a user-provided cipher against SHA-256 hashes from book config.
 * Input is normalized (trimmed, lowercased) before hashing.
 */
export async function verifyCipher(input, validHashes = []) {
  if (!input || typeof input !== 'string') return false;
  const normalized = input.trim().toLowerCase();
  if (normalized.length === 0) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return validHashes.includes(hashHex);
}

const ALLOWED_ORIGINS = [
  'https://gai-observe.online',
  'http://localhost:5173',
  'http://localhost:4173'
];

export function getSafeRedirectOrigin() {
  const origin = window.location.origin;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  console.warn('[AccessGate] Unrecognized origin for OAuth redirect:', origin);
  return ALLOWED_ORIGINS[0];
}
