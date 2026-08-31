const jwt = require('jsonwebtoken');

/**
 * The QR code does NOT encode a static employee_id string (that could be
 * screenshotted and reused forever). Instead it encodes a short-lived signed
 * JWT containing the employeeCode, issued fresh whenever the employee's QR
 * page is loaded, and rotated automatically by the frontend (poll interval).
 *
 * This gives us "dynamic QR" + tamper-proof payload + expiry, which is the
 * practical way to blunt screenshot misuse without a native app.
 */

const TTL_MINUTES = parseInt(process.env.QR_TOKEN_TTL_MINUTES || '60', 10);

function generateQrToken(employeeCode) {
  return jwt.sign({ employeeCode, type: 'qr' }, process.env.QR_SECRET, {
    expiresIn: `${TTL_MINUTES}m`,
  });
}

function verifyQrToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.QR_SECRET);
    if (decoded.type !== 'qr') return null;
    return decoded;
  } catch (err) {
    return null;
  }
}

module.exports = { generateQrToken, verifyQrToken, TTL_MINUTES };
