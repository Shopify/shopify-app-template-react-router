/**
 * Next Gen Events: Product + create.
 *
 * `runNextGenEventAction` accepts `expectedActions` with one or more of
 * create | update | delete. This URL only allows create; another route could pass
 * e.g. `['update', 'delete']` if one subscription URL handles both.
 *
 * Dedupe uses `shopify-webhook-id`. `shopify-event-id` may be shared across triggers.
 */
import type {ActionFunctionArgs} from 'react-router';
import {runNextGenEventAction} from '../nge/route-action.server';

export const action = async ({request}: ActionFunctionArgs) => {
  return runNextGenEventAction(request, {
    expectedTopic: 'Product',
    expectedActions: ['create'],
    label: 'Product',
  });
};
