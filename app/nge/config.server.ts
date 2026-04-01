/**
 * Optional debug mirror URL for Next Gen Events (same env var as classic webhook forwarding).
 * Empty string disables forwarding.
 */
export const NGE_DEBUG_FORWARD_URL = (
  process.env.WEBHOOK_DEBUG_FORWARD_URL ?? ''
).trim();
