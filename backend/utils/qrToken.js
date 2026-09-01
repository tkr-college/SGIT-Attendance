const crypto = require('crypto');

/**
 * The QR code encodes a short, random, single-use-window code (not a full
 * JWT). The server keeps a short-lived in-memory mapping from that code to
 * the employee it belongs to. This keeps the same security properties
 * (short expiry, rotates automatically, can't be reused after a screenshot
 * goes stale) while making the QR image itself tiny and easy to scan --
 * a signed JWT is 150-200+ characters and forces a dense QR regardless of
 * image settings; this code is ~10 characters.
 */

const TTL_MINUTES = parseInt(process.env.QR_TOKEN_TTL_MINUTES || '60', 10);

// token -> { employeeCode, expiresAt }
const activeTokens = new Map();

function cleanupExpired() {
  const now = Date.now();
  for (const [token, entry] of activeTokens) {
    if (entry.expiresAt <= now) activeTokens.delete(token);
  }
}

function generateQrToken(employeeCode) {
  cleanupExpired();
  const token = crypto.randomBytes(6).toString('base64url'); // ~8 chars
  activeTokens.set(token, {
    employeeCode,
    expiresAt: Date.now() + TTL_MINUTES * 60 * 1000,
  });
  return token;
}

function verifyQrToken(token) {
  cleanupExpired();
  const entry = activeTokens.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    activeTokens.delete(token);
    return null;
  }
  return { employeeCode: entry.employeeCode, type: 'qr' };
}

module.exports = { generateQrToken, verifyQrToken, TTL_MINUTES };
