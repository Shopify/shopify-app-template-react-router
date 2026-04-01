import {NGE_DEBUG_FORWARD_URL} from './config.server';
import {shouldProcessNgeDelivery} from './dedupe-delivery.server';
import {verifyShopifyHmacSha256} from './hmac.server';
import type {NextGenAction, NextGenEventPayload} from './types.server';
import {isNextGenAction} from './types.server';

export type NextGenEventContext = {
  rawBody: string;
  request: Request;
  payload: NextGenEventPayload;
  shop: string;
  webhookDeliveryId: string | undefined;
  shopifyEventId: string | undefined;
};

/** Non-empty list; each entry is one of create | update | delete (only values Shopify uses). */
export type NextGenExpectedActions = readonly [NextGenAction, ...NextGenAction[]];

export type NextGenRouteSpec = {
  expectedTopic: string;
  /** One or more allowed `payload.action` values for this route URL. */
  expectedActions: NextGenExpectedActions;
  /** Short name for logs (payload `action` is logged separately). */
  label: string;
};

export type NextGenEventHandler = (
  ctx: NextGenEventContext,
) => void | Promise<void>;

/**
 * Shared Next Gen Events pipeline: HMAC, JSON parse, topic/action + header checks,
 * delivery dedupe (`shopify-webhook-id`), optional handler, optional debug forward.
 */
export async function runNextGenEventAction(
  request: Request,
  spec: NextGenRouteSpec,
  onProcessed?: NextGenEventHandler,
): Promise<Response> {
  const allowedActions = new Set<NextGenAction>(spec.expectedActions);

  // [START verify-hmac]
  const rawBody = await request.text();
  const secret = process.env.SHOPIFY_API_SECRET ?? '';
  const hmac =
    request.headers.get('shopify-hmac-sha256') ??
    request.headers.get('x-shopify-hmac-sha256');

  if (!verifyShopifyHmacSha256(rawBody, hmac, secret)) {
    return new Response('Unauthorized', {status: 401});
  }
  // [END verify-hmac]
  
  let payload: NextGenEventPayload;
  try {
    payload = JSON.parse(rawBody) as NextGenEventPayload;
  } catch {
    return new Response('Invalid JSON', {status: 400});
  }

  if (typeof payload.topic !== 'string' || !isNextGenAction(payload.action)) {
    return new Response('Missing or invalid topic/action', {status: 400});
  }
  const {topic, action} = payload;
  if (topic !== spec.expectedTopic || !allowedActions.has(action)) {
    return new Response('Unexpected topic or action', {status: 400});
  }

  const headerTopic = request.headers.get('shopify-topic');
  const headerAction = request.headers.get('shopify-action');
  if (headerTopic && headerTopic !== topic) {
    return new Response('Topic header does not match body', {status: 400});
  }
  if (headerAction && headerAction !== action) {
    return new Response('Action header does not match body', {status: 400});
  }

  const shop = request.headers.get('shopify-shop-domain')?.trim();
  if (!shop) {
    return new Response('Missing shopify-shop-domain', {status: 400});
  }

  const webhookDeliveryId = (
    request.headers.get('shopify-webhook-id') ??
    request.headers.get('x-shopify-webhook-id')
  )?.trim();
  const shopifyEventId = request.headers.get('shopify-event-id')?.trim();

  const dedupe = await shouldProcessNgeDelivery(
    webhookDeliveryId,
    `${topic}:${action}`,
  );
  if (dedupe === 'duplicate') {
    console.log(
      '[nge] Skipping duplicate delivery (same shopify-webhook-id)',
      JSON.stringify({
        topic,
        action,
        shop,
        webhookDeliveryId,
        shopifyEventId,
      }),
    );
    return new Response(null, {status: 200});
  }

  const ctx: NextGenEventContext = {
    rawBody,
    request,
    payload,
    shop,
    webhookDeliveryId,
    shopifyEventId,
  };

  console.log(`[Next Gen Event] ${spec.label}`, {
    action,
    shop,
    webhookDeliveryId,
    shopifyEventId,
    handle: payload.handle,
    hasData: payload.data !== undefined,
    graphqlErrorCount: payload.errors?.length ?? 0,
    fields_changed: payload.fields_changed,
    query_variables: payload.query_variables,
  });

  if (onProcessed) {
    try {
      await onProcessed(ctx);
    } catch (error) {
      console.error('Next Gen Event handler failed', error);
    }
  }

  if (!NGE_DEBUG_FORWARD_URL) {
    return new Response(null, {status: 200});
  }

  try {
    const forwardResponse = await fetch(NGE_DEBUG_FORWARD_URL, {
      method: 'POST',
      headers: shopifyHeadersForForward(request),
      body: rawBody,
    });

    if (!forwardResponse.ok) {
      console.error(
        'Failed to forward NGE to debug URL',
        forwardResponse.status,
        await forwardResponse.text(),
      );
    }
  } catch (error) {
    console.error('Error forwarding NGE to debug URL', error);
  }

  return new Response(null, {status: 200});
}

/**
 * Headers for POSTing a copy of the NGE request to `NGE_DEBUG_FORWARD_URL`.
 * Copies `shopify-*` / `x-shopify-*` so the listener sees topic, shop, ids, etc., not only JSON.
 */
function shopifyHeadersForForward(request: Request): Record<string, string> {
  const out: Record<string, string> = {'Content-Type': 'application/json'};
  request.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low.startsWith('shopify-') || low.startsWith('x-shopify-')) {
      out[key] = value;
    }
  });
  return out;
}
