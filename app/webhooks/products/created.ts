interface ProductCreatedHandlerParams {
  shop: string;
  /** Parsed webhook body from `authenticate.webhook` */
  payload: Record<string, unknown>;
}

export async function handleProductCreated({
  shop,
  payload,
}: ProductCreatedHandlerParams) {
  console.log('-----------------------------------------------------------------');
  console.log("[CREATE] Product created webhook for shop", shop);
  console.log("[CREATE] Product ID:", payload.id);
  console.log('-----------------------------------------------------------------');

  // Add DB writes, queues, etc., here
}
