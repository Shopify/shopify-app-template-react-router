/**
 * Shared webhook-only settings (server routes only).
 *
 * Per-shop `ShopSettings.webhookDebugForwardUrl` (saved in the app UI) overrides
 * this when forwarding product webhooks.
 *
 * Otherwise: override with `WEBHOOK_DEBUG_FORWARD_URL` in `.env`, or set to empty
 * to disable forwarding when no shop URL is saved.
 */
const DEFAULT_WEBHOOK_DEBUG_FORWARD_URL = "";

export const WEBHOOK_DEBUG_FORWARD_URL =
  process.env.WEBHOOK_DEBUG_FORWARD_URL ?? DEFAULT_WEBHOOK_DEBUG_FORWARD_URL;
