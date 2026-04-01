import type { ProductWebhookHandlerArgs } from "./route-action.server";
import { deleteProductFromWebhookPayload } from "./db.server";

export async function handleProductDeleted(
  args: ProductWebhookHandlerArgs,
) {
  const { shop, payload } = args;
  console.log("[DELETE] Product webhook", shop, payload.id);
  await deleteProductFromWebhookPayload(shop, payload);
}
