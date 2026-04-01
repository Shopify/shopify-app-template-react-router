import { productGidFromPayload } from "../../lib/shopify-product-gid.server";
import {
  diffProductSnapshot,
  snapshotFromPayload,
  type ProductFieldSnapshot,
} from "./diff.server";
import { findProductByShopAndGid, upsertProductFromWebhookPayload } from "./db.server";
import type {
  ProductWebhookHandlerArgs,
  ProductWebhookHandlerResult,
} from "./route-action.server";

export async function handleProductUpdated(
  args: ProductWebhookHandlerArgs,
): Promise<ProductWebhookHandlerResult> {
  const { shop, payload, topic, eventId } = args;

  const shopifyGid = productGidFromPayload(payload);
  if (!shopifyGid) {
    console.warn("[UPDATE] Missing product id / GID in payload");
    return;
  }

  return {
    productUpdateTwoStep: {
      finalizeAfterRawForward: async () => {
        const previous = await findProductByShopAndGid(shop, shopifyGid);
        const incoming: ProductFieldSnapshot = snapshotFromPayload(payload);
        const previousSnapshot: ProductFieldSnapshot | null = previous
          ? {
              title: previous.title,
              handle: previous.handle,
              status: previous.status,
              price: previous.price,
            }
          : null;

        const changed = diffProductSnapshot(previousSnapshot, incoming);

        if (Object.keys(changed).length > 0) {
          console.log(
            "[UPDATE] Product fields changed",
            JSON.stringify({ shop, shopifyGid, changed }),
          );
        } else {
          console.log(
            "[UPDATE] No tracked field changes vs local DB",
            shop,
            payload.id,
          );
        }

        await upsertProductFromWebhookPayload(shop, payload);

        return {
          kind: "products/update-diff",
          shop,
          topic,
          eventId: eventId ?? null,
          productId: payload.id ?? null,
          shopifyGid,
          changed,
          changedFieldNames: Object.keys(changed),
        };
      },
    },
  };
}
