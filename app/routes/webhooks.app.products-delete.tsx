import type {ActionFunctionArgs} from 'react-router';
import {handleProductDeleted} from '../webhooks/products/deleted';
import {
  runProductWebhookAction,
  topicIs,
} from '../webhooks/products/route-action.server';

export const action = async ({request}: ActionFunctionArgs) => {
  return runProductWebhookAction(
    request,
    (topic) => topicIs(topic, 'PRODUCTS_DELETE', 'products/delete'),
    handleProductDeleted,
  );
};
