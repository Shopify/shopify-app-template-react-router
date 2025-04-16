import { authenticate, isEmbeddedApp, appUrl } from "app/shopify.server";

import {
  unstable_createContext,
  unstable_MiddlewareFunction,
} from "react-router";

type AuthenticateAdminReturnType = Awaited<
  ReturnType<typeof authenticate.admin>
>;

export const adminContext =
  unstable_createContext<AuthenticateAdminReturnType>();

export const adminMiddleware: unstable_MiddlewareFunction = async (
  { context, request },
  next,
) => {
  const thisContext = await authenticate.admin(request);
  const responsesFromUtils: Response[] = [];

  context.set(adminContext, {
    ...thisContext,
    redirect: (...args) => {
      const response = thisContext.redirect(...args);
      responsesFromUtils.push(response);
      return response;
    },
    billing: {
      ...thisContext.billing,
      request: async (...args) => {
        try {
          return await thisContext.billing.request(...args);
        } catch (e) {
          if (e instanceof Response) {
            responsesFromUtils.push(e);
          }
          throw e;
        }
      }
    }
  });

  const response = (await next()) as Response;
  const firstUtilResponse = responsesFromUtils[0];
  const isDocumentRequest = !request.headers.get("authorization");

  // Something in thisContext threw a response
  if (firstUtilResponse instanceof Response) {
    if (isDocumentRequest) {
      ensureDocumentResponseHeaders({
        sessionToken: thisContext.sessionToken,
        response: firstUtilResponse,
      });
    }
    return firstUtilResponse;
  }

  if (isDocumentRequest) {
    ensureDocumentResponseHeaders({
      sessionToken: thisContext.sessionToken,
      response,
    });

    return response;
  }

  const origin = request.headers.get("Origin");
  const isCorsRequest =
    origin && request.headers.get("Origin") !== appUrl ? true : false;

  if (isCorsRequest) {
    ensureCorsResponseHeaders(response);
  }

  return response;
};



function ensureDocumentResponseHeaders({
  sessionToken,
  response,
}: {
  sessionToken: AuthenticateAdminReturnType["sessionToken"] | undefined;
  response: Response;
}) {
  if (isEmbeddedApp) {
    const frameAncestors = [
      "https://admin.shopify.com",
      "https://*.spin.dev",
      "https://admin.myshopify.io",
      "https://admin.shop.dev",
    ];
    const shop = sessionToken?.dest;

    if (shop) {
      frameAncestors.unshift(shop);
    }

    ensureAppBridgePreload(response);
    ensureFrameAncestors(response, frameAncestors);
  } else {
    ensureFrameAncestors(response, ["none"]);
  }
}

function ensureAppBridgePreload(response: Response) {
  const existingLinkHeader = response.headers.get("Link") || "";
  const appBridgeLink =
    "<https://cdn.shopify.com/shopifycloud/app-bridge.js>; rel=preload; as=script;";

  if (!existingLinkHeader.includes(appBridgeLink)) {
    const linkHeader = new Set([
      ...existingLinkHeader.split(", ").filter(Boolean),
      appBridgeLink,
    ]);

    response.headers.set("Link", Array.from(linkHeader).join(", "));
  }
}

function ensureFrameAncestors(response: Response, frameAncestors: string[]) {
  const existingCSP = response.headers.get("Content-Security-Policy");

  if (existingCSP && existingCSP.includes("frame-ancestors")) {
    const updatedCSP = existingCSP.replace(
      /frame-ancestors ([^;]+);/,
      (match, existingAncestors) => {
        const newAncestors = frameAncestors
          .filter((anchor) => !existingAncestors.includes(anchor))
          .join(" ");

        return newAncestors
          ? `frame-ancestors ${existingAncestors} ${newAncestors};`
          : match;
      },
    );
    response.headers.set("Content-Security-Policy", updatedCSP);
  } else {
    response.headers.set(
      "Content-Security-Policy",
      `${existingCSP ? `${existingCSP}; ` : ""}frame-ancestors ${frameAncestors.join(" ")};`,
    );
  }
}

function ensureCorsResponseHeaders(response: Response) {
  const accessControlAllowHeaders =
    response.headers.get("Access-Control-Allow-Origin") || "";

  const uniqAccessControlAllowHeaders = new Set([
    ...accessControlAllowHeaders.split(", "),
    "Authorization",
    "Content-Type",
  ]);

  response.headers.set(
    "Access-Control-Allow-Headers",
    Array.from(uniqAccessControlAllowHeaders).join(", "),
  );

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Expose-Headers",
    "X-Shopify-API-Request-Failure-Reauthorize-Url",
  );
}
