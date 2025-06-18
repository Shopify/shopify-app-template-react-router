import { useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { NavMenu } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const href = (event.target as HTMLElement)?.getAttribute("href");
      if (href) navigate(href);
    };

    document.addEventListener("shopify:navigate", handleNavigate);

    return () =>
      document.removeEventListener("shopify:navigate", handleNavigate);
  }, [navigate]);

  return (
    <>
      <script
        src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        data-api-key={apiKey}
        data-link-behavior="remix"
      />
      <script src="https://cdn.shopify.com/shopifycloud/app-bridge-ui-experimental.js"></script>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/additional">Additional page</Link>
      </NavMenu>
      <Outlet />
    </>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
