import crypto from 'node:crypto';

/**
 * Proves this HTTP request came from Shopify and the body was not altered in transit.
 *
 * Shopify computes HMAC-SHA256 of the **raw** request body using your app’s client secret,
 * base64-encodes it, and sends that value in `shopify-hmac-sha256`. You repeat the same
 * calculation and compare (timing-safe). If they match, only someone with your secret
 * could have produced the signature for that exact byte string.
 */
export function verifyShopifyHmacSha256(
  rawBody: string,
  hmacB64: string | null,
  secret: string,
): boolean {
  if (!secret || !hmacB64) {
    return false;
  }
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(hmacB64.trim(), 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
