import {authenticate} from '../../shopify.server';
import {shouldProcessWebhookEvent} from '../dedupe.server';
import {WEBHOOK_DEBUG_FORWARD_URL} from '../config.server';

export type ProductWebhookHandler = (args: {
  shop: string;
  session: unknown;
  payload: Record<string, unknown>;
}) => Promise<void>;

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

  const bodyText = JSON.stringify(payload);

  try {
    await handler({shop, session, payload});
  } catch (error) {
    console.error('Product webhook handler failed', error);
  }

  if (!WEBHOOK_DEBUG_FORWARD_URL) {
    return new Response(null, {status: 200});
  }

  try {
    const forwardResponse = await fetch(WEBHOOK_DEBUG_FORWARD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': shop,
        'X-Shopify-Topic': topic,
      },
      body: bodyText,
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
