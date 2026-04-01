import type { ProductWebhookHandlerArgs } from "./route-action.server";
import { upsertProductFromWebhookPayload } from "./db.server";

export async function handleProductCreated(
  args: ProductWebhookHandlerArgs,
) {
  const { shop, payload } = args;
  console.log("[CREATE] Product webhook", shop, payload.id);
  await upsertProductFromWebhookPayload(shop, payload);
}
