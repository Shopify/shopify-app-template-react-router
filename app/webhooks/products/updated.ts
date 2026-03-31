interface ProductUpdatedHandlerParams {
  shop: string;
  payload: Record<string, unknown>;
}

export async function handleProductUpdated({
  shop,
  payload,
}: ProductUpdatedHandlerParams) {
  console.log('-----------------------------------------------------------------');
  console.log('[UPDATE] Product updated webhook for shop', shop);
  console.log('[UPDATE] Product ID:', payload.id);
  console.log('-----------------------------------------------------------------');

  // Add DB writes, queues, etc., here
}
