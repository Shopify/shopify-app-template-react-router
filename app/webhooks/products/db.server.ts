import db from "../../db.server";
import { productGidFromPayload } from "../../lib/shopify-product-gid.server";
import { priceFromFirstVariantPayload } from "./diff.server";

export async function findProductByShopAndGid(shop: string, shopifyGid: string) {
  return db.product.findUnique({
    where: { shop_shopifyGid: { shop, shopifyGid } },
  });
}

export async function upsertProductFromWebhookPayload(
  shop: string,
  payload: Record<string, unknown>,
) {
  const shopifyGid = productGidFromPayload(payload);
  if (!shopifyGid) {
    return;
  }
  const title = String(payload.title ?? "");
  const handle = String(payload.handle ?? "");
  const status = String(payload.status ?? "").toLowerCase();
  const price = priceFromFirstVariantPayload(payload);

  await db.product.upsert({
    where: {
      shop_shopifyGid: { shop, shopifyGid },
    },
    create: {
      shop,
      shopifyGid,
      title,
      handle,
      status,
      price,
    },
    update: {
      title,
      handle,
      status,
      price,
      lastSyncedAt: new Date(),
    },
  });
}

export async function deleteProductFromWebhookPayload(
  shop: string,
  payload: Record<string, unknown>,
) {
  const shopifyGid = productGidFromPayload(payload);
  if (!shopifyGid) {
    return;
  }
  await db.product.deleteMany({
    where: { shop, shopifyGid },
  });
}
