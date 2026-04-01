/** Replay Shopify’s headers on the outbound debug POST so the receiver sees the same envelope. */
export function shopifyHeadersForForward(request: Request): Record<string, string> {
  const out: Record<string, string> = {'Content-Type': 'application/json'};
  request.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low.startsWith('shopify-') || low.startsWith('x-shopify-')) {
      out[key] = value;
    }
  });
  return out;
}
