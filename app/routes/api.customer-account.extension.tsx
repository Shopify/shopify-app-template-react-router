import { authenticate } from "app/shopify.server";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const { cors } = await authenticate.public.customerAccount(request);

  return cors(new Response(
    JSON.stringify({
      message: "Hello from the customer account extension!",
    }),
  ));
}
