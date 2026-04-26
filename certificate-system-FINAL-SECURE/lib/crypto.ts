import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.APP_SECRET_KEY || 'change-this-in-production-256-bit-key';

/**
 * Generate HMAC-SHA256 signed QR token
 * Format: cert_number:timestamp:signature
 */
export function generateQRToken(certNumber: string): string {
  const timestamp = Date.now();
  const message = `${certNumber}:${timestamp}`;
  const signature = CryptoJS.HmacSHA256(message, SECRET_KEY).toString();
  return `${message}:${signature}`;
}

/**
 * Verify QR token with HMAC-SHA256
 * Checks signature AND expiry (default 1 year)
 */
export function verifyQRToken(certNumber: string, token: string): { valid: boolean; reason?: string } {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) {
      return { valid: false, reason: 'INVALID_FORMAT' };
    }

    const [tokenCertNumber, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr);

    // Check certificate number matches
    if (tokenCertNumber !== certNumber) {
      return { valid: false, reason: 'CERT_MISMATCH' };
    }

    // Check expiry (1 year = 365 days)
    const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > ONE_YEAR) {
      return { valid: false, reason: 'EXPIRED' };
    }

    // Verify HMAC signature
    const expectedMessage = `${tokenCertNumber}:${timestamp}`;
    const expectedSignature = CryptoJS.HmacSHA256(expectedMessage, SECRET_KEY).toString();

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(signature, expectedSignature)) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'VERIFICATION_ERROR' };
  }
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate certificate number using database sequence
 * (Frontend should call API to get next number)
 */
export function generateCertNumber(year: number, sequence: number): string {
  return `CERT-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Generate signed URL for PDF download (expires in 1 hour)
 */
export function generateSignedUrl(certId: string, expiresIn: number = 3600): string {
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  const message = `${certId}:${timestamp}`;
  const signature = CryptoJS.HmacSHA256(message, SECRET_KEY).toString();
  return `?id=${certId}&expires=${timestamp}&signature=${signature}`;
}

/**
 * Verify signed URL
 */
export function verifySignedUrl(certId: string, timestamp: string, signature: string): boolean {
  try {
    const now = Math.floor(Date.now() / 1000);
    if (now > parseInt(timestamp)) return false;

    const expectedMessage = `${certId}:${timestamp}`;
    const expectedSignature = CryptoJS.HmacSHA256(expectedMessage, SECRET_KEY).toString();

    return constantTimeCompare(signature, expectedSignature);
  } catch {
    return false;
  }
}
