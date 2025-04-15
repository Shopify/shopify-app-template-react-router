import {
  AppProxyProvider,
  AppProxyForm,
} from "@shopify/shopify-app-remix/react";
import { authenticate } from "app/shopify.server";
import { LoaderFunctionArgs, useLoaderData } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const {session} = await authenticate.public.appProxy(request);

  if (session && session.sub) {
    return { appUrl: `https://${session.sub}/a/proxy` };
  }

  return new Response("Unauthorized", {
    status: 401,
  })
}

export async function action({ request }: LoaderFunctionArgs) {
  await authenticate.public.appProxy(request);

  const formData = await request.formData();
  const field = formData.get("field")?.toString();

  // Perform actions
  if (field) {
    console.log("Field:", field);
  }

  // Return JSON to the client
  return { message: "Success!" };
}

export default function App() {
  const { appUrl } = useLoaderData();
  console.log({appUrl})

  return (
    <AppProxyProvider appUrl={appUrl}>
      <AppProxyForm action="/a/proxy/" method="post">
        <input type="text" name="field" />

        <input type="submit" name="Submit" />
      </AppProxyForm>
    </AppProxyProvider>
  );
}
