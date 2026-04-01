/**
 * Next Gen Events: Product + create.
 *
 * Shared logic lives under `app/nge/` (see `runNextGenEventAction`). Add
 * `nge.app.products-update.tsx` / `...delete.tsx` with the same pattern and
 * different `expectedAction` / `label`.
 *
 * Dedupe uses `shopify-webhook-id`. `shopify-event-id` may be shared across triggers.
 */
import type {ActionFunctionArgs} from 'react-router';
import {runNextGenEventAction} from '../nge/route-action.server';

export const action = async ({request}: ActionFunctionArgs) => {
  return runNextGenEventAction(request, {
    expectedTopic: 'Product',
    expectedAction: 'create',
    label: 'Product create',
  });
};
