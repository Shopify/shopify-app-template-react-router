import type {ActionFunctionArgs} from 'react-router';
import {handleProductCreated} from '../webhooks/products/created';
import {
  runProductWebhookAction,
  topicIs,
} from '../webhooks/products/route-action.server';

export const action = async ({request}: ActionFunctionArgs) => {
  return runProductWebhookAction(
    request,
    (topic) => topicIs(topic, 'PRODUCTS_CREATE', 'products/create'),
    handleProductCreated,
  );
};
