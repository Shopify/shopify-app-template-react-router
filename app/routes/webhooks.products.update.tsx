import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} Event for ${shop}`);
  console.log(JSON.stringify(payload, null, 2));

  return new Response(null, { status: 200 });
};
