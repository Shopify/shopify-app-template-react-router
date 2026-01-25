import { Route } from "./+types/auth.$";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await authenticate.admin(request);

  return null;
};

export const headers: Route.HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
