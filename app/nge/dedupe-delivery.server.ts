import {Prisma} from '@prisma/client';
import db from '../db.server';

/**
 * Next Gen: `shopify-event-id` can be shared when one merchant action fires multiple triggers.
 * `shopify-webhook-id` is unique per delivery — use it to detect retry vs distinct payloads.
 */
export async function shouldProcessNgeDelivery(
  webhookDeliveryId: string | undefined,
  topic: string,
): Promise<'process' | 'duplicate'> {
  if (!webhookDeliveryId) {
    console.warn(
      '[nge] Missing shopify-webhook-id; cannot dedupe deliveries. Processing once.',
    );
    return 'process';
  }

  try {
    await db.webhookEvent.create({
      data: {eventId: webhookDeliveryId, topic},
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
