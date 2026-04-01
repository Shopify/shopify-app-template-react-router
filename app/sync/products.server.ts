import db from "../db.server";

type AdminGraphql = (query: string, options?: { variables?: object }) => Promise<Response>;

function firstVariantPrice(node: {
  variants?: {
    edges?: Array<{ node?: { price?: unknown } }>;
  };
}): string {
  const raw = node.variants?.edges?.[0]?.node?.price;
  if (typeof raw === "string") {
    return raw.trim();
  }
  if (
    raw &&
    typeof raw === "object" &&
    raw !== null &&
    "amount" in raw &&
    typeof (raw as { amount?: unknown }).amount === "string"
  ) {
    return (raw as { amount: string }).amount.trim();
  }
  return "";
}

/**
 * Paginate Admin GraphQL `products` and upsert into `Product`, then mark shop sync complete.
 */
export async function syncAllProductsFromShopify(
  adminGraphql: AdminGraphql,
  shop: string,
): Promise<{ synced: number }> {
  let cursor: string | null = null;
  let hasNextPage = true;
  let synced = 0;

  while (hasNextPage) {
    const response = await adminGraphql(
      `#graphql
      query SyncProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              status
              variants(first: 1) {
                edges {
                  node {
                    price
                  }
                }
              }
            }
          }
        }
      }`,
      { variables: { cursor } },
    );

    const json = (await response.json()) as {
      data?: {
        products?: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          edges: Array<{
            node: {
              id: string;
              title: string;
              handle: string;
              status: string;
              variants?: {
                edges?: Array<{ node?: { price?: unknown } }>;
              };
            };
          }>;
        };
      };
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }

    const products = json.data?.products;
    if (!products) {
      break;
    }

    for (const { node } of products.edges) {
      const price = firstVariantPrice(node);
      await db.product.upsert({
        where: {
          shop_shopifyGid: { shop, shopifyGid: node.id },
        },
        create: {
          shop,
          shopifyGid: node.id,
          title: node.title,
          handle: node.handle,
          status: node.status.toLowerCase(),
          price,
        },
        update: {
          title: node.title,
          handle: node.handle,
          status: node.status.toLowerCase(),
          price,
          lastSyncedAt: new Date(),
        },
      });
      synced += 1;
    }

    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
  }

  await db.shopSettings.upsert({
    where: { shop },
    create: { shop, productSyncCompletedAt: new Date() },
    update: { productSyncCompletedAt: new Date() },
  });

  return { synced };
}
