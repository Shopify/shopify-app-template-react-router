interface ProductDeletedHandlerParams {
  shop: string;
  payload: Record<string, unknown>;
}

export async function handleProductDeleted({
  shop,
  payload,
}: ProductDeletedHandlerParams) {
  console.log('-----------------------------------------------------------------');
  console.log('[DELETE] Product deleted webhook for shop', shop);
  // delete payload includes id (as number in REST-style webhooks)
  console.log('[DELETE] Product ID:', payload.id);
  console.log('-----------------------------------------------------------------');
  // Add DB writes, queues, etc., here
}
