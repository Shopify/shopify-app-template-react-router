import { Route } from "./+types/app";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import { authenticatedAdminContext } from "../context";

const adminAuthMiddleware: Route.MiddlewareFunction = async ({
  request,
  context,
}) => {
  const adminContext = await authenticate.admin(request);
  context.set(authenticatedAdminContext, adminContext);
};

export const middleware: Route.MiddlewareFunction[] = [adminAuthMiddleware];

export const loader = async () => {
  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/additional">Additional page</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: Route.HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
