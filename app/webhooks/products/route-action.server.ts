import {authenticate} from '../../shopify.server';
import {shouldProcessWebhookEvent} from '../dedupe.server';
import {resolveWebhookForwardUrl} from '../forward-url.server';

export type ProductWebhookHandlerArgs = {
  shop: string;
  session: unknown;
  payload: Record<string, unknown>;
  topic: string;
  eventId?: string;
};

/**
 * - `forwardPayload`: one POST with this JSON (or full webhook `payload` if omitted).
 * - `productUpdateTwoStep`: POST raw webhook `payload` first, then `finalizeAfterRawForward`
 *   (fields-changed diff + DB upsert), then POST the returned diff JSON.
 */
export type ProductWebhookHandlerResult =
  | void
  | {forwardPayload?: Record<string, unknown>}
  | {
      productUpdateTwoStep: {
        /** Runs after the raw webhook payload is forwarded: diff, persist, return body for second POST. */
        finalizeAfterRawForward: () => Promise<Record<string, unknown>>;
      };
    };

export type ProductWebhookHandler = (
  args: ProductWebhookHandlerArgs,
) => Promise<ProductWebhookHandlerResult>;

/**
 * Shared flow: verify webhook, run handler, optionally forward to debug URL.
 * Do not read `request` after `authenticate.webhook`.
 */
export async function runProductWebhookAction(
  request: Request,
  topicMatches: (topic: string) => boolean,
  handler: ProductWebhookHandler,
): Promise<Response> {
  const {topic, shop, session, payload, eventId} =
    await authenticate.webhook(request);

  if (!topicMatches(topic)) {
    return new Response('Unexpected topic for this route', {status: 400});
  }

  const dedupe = await shouldProcessWebhookEvent(eventId, topic);
  if (dedupe === 'duplicate') {
    console.log(
      '[webhooks] Skipping duplicate delivery',
      JSON.stringify({topic, shop, eventId}),
    );
    return new Response(null, {status: 200});
  }

  let handlerResult: ProductWebhookHandlerResult | undefined;
  try {
    handlerResult = await handler({
      shop,
      session,
      payload,
      topic,
      eventId,
    });
  } catch (error) {
    console.error('Product webhook handler failed', error);
  }

  const forwardUrl = await resolveWebhookForwardUrl(shop);
  if (!forwardUrl) {
    return new Response(null, {status: 200});
  }

  const postForward = async (body: unknown) => {
    try {
      const forwardResponse = await fetch(forwardUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Shop-Domain': shop,
          'X-Shopify-Topic': topic,
        },
        body: JSON.stringify(body),
      });

      if (!forwardResponse.ok) {
        console.error(
          'Failed to forward webhook to debug URL',
          forwardResponse.status,
          await forwardResponse.text(),
        );
      }
    } catch (error) {
      console.error('Error forwarding webhook to debug URL', error);
    }
  };

  if (
    handlerResult &&
    typeof handlerResult === 'object' &&
    'productUpdateTwoStep' in handlerResult &&
    handlerResult.productUpdateTwoStep
  ) {
    const {finalizeAfterRawForward} = handlerResult.productUpdateTwoStep;
    await postForward(payload);
    const diffBody = await finalizeAfterRawForward();
    await postForward(diffBody);
    return new Response(null, {status: 200});
  }

  let forwardPayload: Record<string, unknown> | undefined;
  if (
    handlerResult &&
    typeof handlerResult === 'object' &&
    'forwardPayload' in handlerResult &&
    handlerResult.forwardPayload
  ) {
    forwardPayload = handlerResult.forwardPayload;
  }

  await postForward(
    forwardPayload !== undefined ? forwardPayload : payload,
  );

  return new Response(null, {status: 200});
}

/** Shopify may send topic as `PRODUCTS_*` or `products/...` depending on context */
export function topicIs(
  topic: string,
  graphqlName: string,
  restPath: string,
): boolean {
  return topic === graphqlName || topic === restPath;
}
