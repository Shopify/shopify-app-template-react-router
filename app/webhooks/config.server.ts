/**
 * Shared webhook-only settings (server routes only).
 *
 * Set `WEBHOOK_DEBUG_FORWARD_URL` in `.env` to a unique URL from
 * https://webhook.site when you want to inspect raw forwarded payloads.
 * Leave unset to skip forwarding (e.g. production).
 */
export const WEBHOOK_DEBUG_FORWARD_URL =
  process.env.WEBHOOK_DEBUG_FORWARD_URL ?? "https://webhook.site/7b77b3cc-676e-4ac9-bbf2-193199f7b3b2";
