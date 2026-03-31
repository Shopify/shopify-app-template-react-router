import {Prisma} from '@prisma/client';

import db from '../db.server';

/**
 * Returns whether this delivery should run your handler.
 * Shopify may retry webhooks; the same `eventId` indicates a duplicate delivery.
 *
 * @see https://shopify.dev/docs/apps/build/webhooks/idempotency
 */
export async function shouldProcessWebhookEvent(
  eventId: string | undefined,
  topic: string,
): Promise<'process' | 'duplicate'> {
  if (!eventId) {
    console.warn(
      '[webhooks] Missing event id (X-Shopify-Event-Id); cannot dedupe. Processing once.',
    );
    return 'process';
  }

  try {
    await db.webhookEvent.create({
      data: {eventId, topic},
    });
    return 'process';
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return 'duplicate';
    }
    throw error;
  }
}
