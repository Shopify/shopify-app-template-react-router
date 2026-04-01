import db from "../db.server";
import { WEBHOOK_DEBUG_FORWARD_URL } from "./config.server";

/**
 * Normalize and validate a debug forward URL. Empty input clears the saved URL (`null`).
 * @throws Error with a merchant-facing message if the URL is invalid.
 */
export function parseWebhookSiteDebugUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Enter a valid https URL.");
  }
  if (url.protocol !== "https:") {
    throw new Error("URL must use https.");
  }
  const host = url.hostname.toLowerCase();
  if (!host.endsWith("webhook.site")) {
    throw new Error(
      "Use a webhook.site URL (for example https://webhook.site/your-uuid).",
    );
  }
  return url.toString();
}

/**
 * Per-shop URL from `ShopSettings` wins; otherwise env / default from `config.server`.
 * Empty string from env disables forwarding unless a shop URL is set.
 */
export async function resolveWebhookForwardUrl(shop: string): Promise<string> {
  const settings = await db.shopSettings.findUnique({
    where: { shop },
  });
  const saved = settings?.webhookDebugForwardUrl?.trim();
  if (saved) {
    return saved;
  }
  return WEBHOOK_DEBUG_FORWARD_URL;
}
