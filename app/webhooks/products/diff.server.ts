import type { Product } from "@prisma/client";

/** Fields we persist and can compare. `price` = first variant (REST `variants[0].price`). */
export const TRACKED_PRODUCT_FIELDS = [
  "title",
  "handle",
  "status",
  "price",
] as const;

export type TrackedProductField = (typeof TRACKED_PRODUCT_FIELDS)[number];

export type ProductFieldSnapshot = Pick<
  Product,
  "title" | "handle" | "status" | "price"
>;

/** REST product webhook: `variants[0].price` (string). */
export function priceFromFirstVariantPayload(
  payload: Record<string, unknown>,
): string {
  const variants = payload.variants;
  if (!Array.isArray(variants) || variants.length === 0) {
    return "";
  }
  const v0 = variants[0];
  if (v0 && typeof v0 === "object" && v0 !== null && "price" in v0) {
    const p = (v0 as { price?: unknown }).price;
    if (p !== undefined && p !== null) {
      return String(p).trim();
    }
  }
  return "";
}

export function snapshotFromPayload(
  payload: Record<string, unknown>,
): ProductFieldSnapshot {
  return {
    title: String(payload.title ?? ""),
    handle: String(payload.handle ?? ""),
    status: normalizeStatus(String(payload.status ?? "")),
    price: priceFromFirstVariantPayload(payload),
  };
}

export function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

/**
 * Compare local DB row to incoming webhook fields; only keys that differ are returned.
 */
export function diffProductSnapshot(
  previous: ProductFieldSnapshot | null,
  incoming: ProductFieldSnapshot,
): Partial<Record<TrackedProductField, { from: unknown; to: unknown }>> {
  const changed: Partial<
    Record<TrackedProductField, { from: unknown; to: unknown }>
  > = {};

  for (const key of TRACKED_PRODUCT_FIELDS) {
    const before = previous?.[key] ?? null;
    const after = incoming[key];
    if (before !== after) {
      changed[key] = { from: before, to: after };
    }
  }

  return changed;
}
