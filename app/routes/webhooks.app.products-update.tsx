import type {ActionFunctionArgs} from 'react-router';
import {handleProductUpdated} from '../webhooks/products/updated';
import {
  runProductWebhookAction,
  topicIs,
} from '../webhooks/products/route-action.server';

export const action = async ({request}: ActionFunctionArgs) => {
  return runProductWebhookAction(
    request,
    (topic) => topicIs(topic, 'PRODUCTS_UPDATE', 'products/update'),
    handleProductUpdated,
  );
};
