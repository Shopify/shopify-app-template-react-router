import { useEffect, useRef, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import db from "../db.server";
import { syncAllProductsFromShopify } from "../sync/products.server";

type ModalElement = HTMLElement & {
  showOverlay: () => void;
  hideOverlay: () => void;
};

function productStatusBadge(status: string) {
  const lower = status.toLowerCase();
  const tone =
    lower === "active"
      ? "success"
      : lower === "draft"
        ? "warning"
        : lower === "archived"
          ? "critical"
          : "neutral";
  return <s-badge tone={tone}>{status}</s-badge>;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.shopSettings.findUnique({
    where: { shop: session.shop },
  });
  const productCount = await db.product.count({
    where: { shop: session.shop },
  });
  const products = await db.product.findMany({
    where: { shop: session.shop },
    orderBy: { title: "asc" },
    take: 100,
    select: {
      id: true,
      shopifyGid: true,
      title: true,
      status: true,
      price: true,
      lastSyncedAt: true,
    },
  });
  return {
    productSyncCompleted: Boolean(settings?.productSyncCompletedAt),
    demoProductGid: settings?.demoProductGid ?? null,
    productCount,
    products: products.map((p: (typeof products)[number]) => ({
      ...p,
      lastSyncedAt: p.lastSyncedAt.toISOString(),
    })),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "sync") {
    const { synced } = await syncAllProductsFromShopify(
      (query, opts) => admin.graphql(query, opts ?? {}),
      session.shop,
    );
    return { ok: true as const, intent: "sync" as const, synced };
  }

  if (intent === "deleteDemoProduct") {
    const settings = await db.shopSettings.findUnique({
      where: { shop: session.shop },
    });
    const gid = settings?.demoProductGid;
    if (!gid) {
      return {
        ok: false as const,
        error: "No demo product to delete. Generate one first.",
      };
    }

    const response = await admin.graphql(
      `#graphql
      mutation DemoProductDelete($id: ID!) {
        productDelete(input: { id: $id }) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }`,
      { variables: { id: gid } },
    );
    const json = (await response.json()) as {
      data?: {
        productDelete?: {
          deletedProductId?: string | null;
          userErrors?: { message: string }[];
        };
      };
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      return {
        ok: false as const,
        error: json.errors.map((e) => e.message).join("; "),
      };
    }

    const errs = json.data?.productDelete?.userErrors ?? [];
    if (errs.length > 0) {
      return {
        ok: false as const,
        error: errs.map((e) => e.message).join("; "),
      };
    }

    await db.shopSettings.update({
      where: { shop: session.shop },
      data: { demoProductGid: null },
    });

    return { ok: true as const, intent: "deleteDemoProduct" as const };
  }

  if (intent === "generate") {
    const settings = await db.shopSettings.findUnique({
      where: { shop: session.shop },
    });
    if (!settings?.productSyncCompletedAt) {
      return {
        ok: false as const,
        error: "Sync products from your store first.",
      };
    }
    if (settings.demoProductGid) {
      return {
        ok: false as const,
        error: "Delete the current demo product before generating another.",
      };
    }

    const color = ["Red", "Orange", "Yellow", "Green"][
      Math.floor(Math.random() * 4)
    ];
    const response = await admin.graphql(
      `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          product: {
            title: `${color} Snowboard`,
          },
        },
      },
    );
    const responseJson = await response.json();

    const userErrors = responseJson.data?.productCreate?.userErrors ?? [];
    if (userErrors.length > 0) {
      return {
        ok: false as const,
        error: userErrors
          .map((e: { message: string }) => e.message)
          .join("; "),
      };
    }

    const product = responseJson.data!.productCreate!.product!;
    const variantId = product.variants.edges[0]!.node!.id!;

    const variantResponse = await admin.graphql(
      `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
        userErrors {
          field
          message
        }
      }
    }`,
      {
        variables: {
          productId: product.id,
          variants: [{ id: variantId, price: "100.00" }],
        },
      },
    );

    const variantResponseJson = await variantResponse.json();
    const vErrs =
      variantResponseJson.data?.productVariantsBulkUpdate?.userErrors ?? [];
    if (vErrs.length > 0) {
      return {
        ok: false as const,
        error: vErrs.map((e: { message: string }) => e.message).join("; "),
      };
    }

    await db.shopSettings.update({
      where: { shop: session.shop },
      data: { demoProductGid: product.id },
    });

    return {
      ok: true as const,
      intent: "generate" as const,
      product: responseJson!.data!.productCreate!.product,
      variant:
        variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
    };
  }

  return { ok: false as const, error: "Unknown action" };
};

export default function Index() {
  const {
    productSyncCompleted,
    demoProductGid,
    productCount,
    products,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const shopify = useAppBridge();

  const deleteModalRef = useRef<ModalElement | null>(null);
  const [editOpened, setEditOpened] = useState(false);
  const [deleteCompleted, setDeleteCompleted] = useState(false);
  const [expanded, setExpanded] = useState({
    guide: true,
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  });

  const toggleStep = (key: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedSteps =
    (productSyncCompleted ? 1 : 0) +
    (demoProductGid ? 1 : 0) +
    (editOpened ? 1 : 0) +
    (deleteCompleted ? 1 : 0);

  useEffect(() => {
    setEditOpened(false);
  }, [demoProductGid]);

  useEffect(() => {
    if (demoProductGid) {
      setDeleteCompleted(false);
    }
  }, [demoProductGid]);

  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) {
      return;
    }
    if (fetcher.data.ok === false && "error" in fetcher.data) {
      shopify.toast.show(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data, shopify]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) {
      return;
    }
    if (fetcher.data.ok && fetcher.data.intent === "sync") {
      shopify.toast.show(`Synced ${fetcher.data.synced} products`);
    }
  }, [fetcher.state, fetcher.data, shopify]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data?.ok) {
      return;
    }
    if (
      fetcher.data.intent === "sync" ||
      fetcher.data.intent === "generate" ||
      fetcher.data.intent === "deleteDemoProduct"
    ) {
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  useEffect(() => {
    if (fetcher.data?.ok && fetcher.data.intent === "generate" && fetcher.data.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data, shopify]);

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data?.ok &&
      fetcher.data.intent === "deleteDemoProduct"
    ) {
      setDeleteCompleted(true);
      deleteModalRef.current?.hideOverlay();
      shopify.toast.show("Demo product deleted");
    }
  }, [fetcher.state, fetcher.data, shopify]);

  const syncProducts = () =>
    fetcher.submit({ intent: "sync" }, { method: "POST" });
  const generateProduct = () =>
    fetcher.submit({ intent: "generate" }, { method: "POST" });
  const deleteDemoProduct = () =>
    fetcher.submit({ intent: "deleteDemoProduct" }, { method: "POST" });

  const openDeleteModal = () => {
    deleteModalRef.current?.showOverlay();
  };

  const closeDeleteModal = () => {
    deleteModalRef.current?.hideOverlay();
  };

  const handleEditClick = () => {
    if (!demoProductGid) {
      return;
    }
    setEditOpened(true);
    shopify.intents.invoke?.("edit:shopify/Product", {
      value: demoProductGid,
    });
  };

  const primaryLabel = productSyncCompleted
    ? "Sync again"
    : "Sync products from store";

  const canSyncCatalog = true;
  const canUseDemoButtons = productSyncCompleted;
  const canGenerate = canUseDemoButtons && !demoProductGid;
  const canEdit = canUseDemoButtons && Boolean(demoProductGid);
  const canDelete = canUseDemoButtons && Boolean(demoProductGid) && editOpened;

  return (
    <s-page heading="Events tutorial">
      <s-button
        slot="primary-action"
        onClick={syncProducts}
        disabled={!canSyncCatalog}
        {...(isLoading ? { loading: true } : {})}
      >
        {primaryLabel}
      </s-button>

      <s-modal
        ref={deleteModalRef as never}
        id="delete-demo-product-modal"
        heading="Delete demo product?"
        accessibilityLabel="Confirm deleting the generated demo product"
        size="small"
        padding="base"
      >
        <s-paragraph>
          This permanently removes the product you created with{" "}
          <strong>Generate a product</strong> from your store. Continue?
        </s-paragraph>
        <s-button
          slot="primary-action"
          variant="primary"
          tone="critical"
          onClick={() => {
            deleteDemoProduct();
          }}
          {...(isLoading ? { loading: true } : {})}
        >
          Delete product
        </s-button>
        <s-button
          slot="secondary-actions"
          variant="secondary"
          onClick={closeDeleteModal}
          disabled={isLoading}
        >
          Cancel
        </s-button>
      </s-modal>

      <s-section accessibilityLabel="Events tutorial setup guide">
        <s-grid gap="small">
          <s-grid gap="small-200">
            <s-grid
              gridTemplateColumns="1fr auto"
              gap="small-300"
              alignItems="center"
            >
              <s-heading>Events tutorial</s-heading>
              <s-button
                accessibilityLabel="Toggle setup guide"
                variant="tertiary"
                tone="neutral"
                onClick={() => toggleStep("guide")}
                icon={expanded.guide ? "chevron-up" : "chevron-down"}
              />
            </s-grid>
            <s-paragraph>
              Follow the steps to generate traffic, then watch your terminal where{" "}
              <code>shopify app dev</code> is running. Product create, update, and
              delete deliveries are logged there from your Events subscriptions.
            </s-paragraph>
            <s-paragraph color="subdued">
              {completedSteps} of 4 steps completed
            </s-paragraph>
          </s-grid>

          <s-box
            borderRadius="base"
            border="base"
            background="base"
            display={expanded.guide ? "auto" : "none"}
          >
            <s-box>
              <s-grid
                gridTemplateColumns="1fr auto"
                gap="base"
                padding="small"
                alignItems="center"
              >
                <s-checkbox
                  label="Sync catalog from Shopify"
                  checked={productSyncCompleted}
                  disabled
                />
                <s-button
                  accessibilityLabel="Toggle step 1: sync catalog"
                  variant="tertiary"
                  onClick={() => toggleStep("step1")}
                  icon={expanded.step1 ? "chevron-up" : "chevron-down"}
                />
              </s-grid>
              <s-box
                padding="small"
                paddingBlockStart="none"
                display={expanded.step1 ? "auto" : "none"}
              >
                <s-box padding="base" background="subdued" borderRadius="base">
                  <s-stack direction="block" gap="small-200">
                    <s-paragraph>
                      Pulls your product catalog into this app&apos;s database
                      (Admin GraphQL, paginated). You can also use{" "}
                      <s-text type="strong">{primaryLabel}</s-text> in the
                      header.
                    </s-paragraph>
                    <s-stack direction="inline" gap="small-200">
                      <s-button
                        onClick={syncProducts}
                        disabled={!canSyncCatalog}
                        {...(isLoading ? { loading: true } : {})}
                        variant={productSyncCompleted ? "secondary" : "primary"}
                      >
                        {productSyncCompleted ? "Sync again" : "Sync catalog"}
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-box>
              </s-box>
            </s-box>

            <s-divider />

            <s-box>
              <s-grid
                gridTemplateColumns="1fr auto"
                gap="base"
                padding="small"
                alignItems="center"
              >
                <s-checkbox
                  label="Generate a demo product"
                  checked={Boolean(demoProductGid)}
                  disabled
                />
                <s-button
                  accessibilityLabel="Toggle step 2: generate demo product"
                  variant="tertiary"
                  onClick={() => toggleStep("step2")}
                  icon={expanded.step2 ? "chevron-up" : "chevron-down"}
                />
              </s-grid>
              <s-box
                padding="small"
                paddingBlockStart="none"
                display={expanded.step2 ? "auto" : "none"}
              >
                <s-box padding="base" background="subdued" borderRadius="base">
                  <s-stack direction="block" gap="small-200">
                    <s-paragraph>
                      Creates a sample product and sets variant price. Delete the
                      demo product before generating another.
                    </s-paragraph>
                    <s-button
                      onClick={generateProduct}
                      disabled={!canGenerate}
                      {...(isLoading ? { loading: true } : {})}
                    >
                      Generate a product
                    </s-button>
                    {fetcher.data?.ok &&
                      fetcher.data.intent === "generate" &&
                      fetcher.data.product && (
                        <s-stack direction="block" gap="small-200">
                          <s-heading>Last GraphQL responses</s-heading>
                          <s-box
                            padding="base"
                            borderRadius="base"
                            background="base"
                          >
                            <pre style={{ margin: 0, overflow: "auto" }}>
                              <code>
                                {JSON.stringify(
                                  fetcher.data.product,
                                  null,
                                  2,
                                )}
                              </code>
                            </pre>
                          </s-box>
                          <s-text type="strong">productVariantsBulkUpdate</s-text>
                          <s-box
                            padding="base"
                            borderRadius="base"
                            background="base"
                          >
                            <pre style={{ margin: 0, overflow: "auto" }}>
                              <code>
                                {JSON.stringify(
                                  fetcher.data.variant,
                                  null,
                                  2,
                                )}
                              </code>
                            </pre>
                          </s-box>
                        </s-stack>
                      )}
                  </s-stack>
                </s-box>
              </s-box>
            </s-box>

            <s-divider />

            <s-box>
              <s-grid
                gridTemplateColumns="1fr auto"
                gap="base"
                padding="small"
                alignItems="center"
              >
                <s-checkbox
                  label="Edit the demo product in Shopify Admin"
                  checked={editOpened}
                  disabled
                />
                <s-button
                  accessibilityLabel="Toggle step 3: edit in Admin"
                  variant="tertiary"
                  onClick={() => toggleStep("step3")}
                  icon={expanded.step3 ? "chevron-up" : "chevron-down"}
                />
              </s-grid>
              <s-box
                padding="small"
                paddingBlockStart="none"
                display={expanded.step3 ? "auto" : "none"}
              >
                <s-box padding="base" background="subdued" borderRadius="base">
                  <s-stack direction="block" gap="small-200">
                    <s-paragraph>
                      Open the product in Admin and change variant{" "}
                      <s-text type="strong">price</s-text> or{" "}
                      <s-text type="strong">compare-at price</s-text> so
                      an update Event fires (see terminal). The delete button in
                      step 4 stays disabled until you click{" "}
                      <s-text type="strong">Edit product</s-text> here first.
                    </s-paragraph>
                    <s-button
                      onClick={handleEditClick}
                      disabled={!canEdit}
                      variant="secondary"
                    >
                      Edit product
                    </s-button>
                  </s-stack>
                </s-box>
              </s-box>
            </s-box>

            <s-divider />

            <s-box>
              <s-grid
                gridTemplateColumns="1fr auto"
                gap="base"
                padding="small"
                alignItems="center"
              >
                <s-checkbox
                  label="Delete the demo product from your store"
                  checked={deleteCompleted}
                  disabled
                />
                <s-button
                  accessibilityLabel="Toggle step 4: delete demo product"
                  variant="tertiary"
                  onClick={() => toggleStep("step4")}
                  icon={expanded.step4 ? "chevron-up" : "chevron-down"}
                />
              </s-grid>
              <s-box
                padding="small"
                paddingBlockStart="none"
                display={expanded.step4 ? "auto" : "none"}
              >
                <s-box padding="base" background="subdued" borderRadius="base">
                  <s-stack direction="block" gap="small-200">
                    <s-paragraph>
                      Remove the generated product to trigger a delete Event (see
                      terminal). The button stays disabled until you complete step
                      3.
                    </s-paragraph>
                    <s-button
                      onClick={openDeleteModal}
                      disabled={!canDelete}
                      variant="secondary"
                      tone="critical"
                    >
                      Delete product
                    </s-button>
                  </s-stack>
                </s-box>
              </s-box>
            </s-box>
          </s-box>
        </s-grid>
      </s-section>

      <s-section heading="Local catalog">
        <s-stack direction="block" gap="small-200">
          <s-grid
            gap="small-200"
            gridTemplateColumns="repeat(auto-fit, minmax(140px, 1fr))"
          >
            <s-box padding="base" background="subdued" borderRadius="base">
              <s-stack direction="block" gap="small-200">
                <s-text color="subdued">Products stored</s-text>
                <s-heading>{productCount}</s-heading>
              </s-stack>
            </s-box>
            <s-box padding="base" background="subdued" borderRadius="base">
              <s-stack direction="block" gap="small-200">
                <s-text color="subdued">Catalog sync</s-text>
                {productSyncCompleted ? (
                  <s-badge tone="success">Completed</s-badge>
                ) : (
                  <s-badge tone="neutral">Not yet</s-badge>
                )}
              </s-stack>
            </s-box>
          </s-grid>

          {productCount === 0 ? (
            <s-grid
              gap="base"
              justifyItems="center"
              paddingBlock="large-300"
            >
              <s-grid justifyItems="center" maxInlineSize="420px" gap="base">
                <s-stack alignItems="center">
                  <s-heading>No local products yet</s-heading>
                  <p
                    style={{
                      margin: "0.5rem auto 0",
                      maxWidth: "28rem",
                      textAlign: "center",
                      fontSize: "0.8125rem",
                      lineHeight: 1.5,
                      color: "var(--p-color-text-secondary, inherit)",
                    }}
                  >
                    After you sync, product rows from your store appear here. Sync
                    again to refresh; Events deliveries are logged in the terminal.
                  </p>
                </s-stack>
                <s-button-group
                  gap="base"
                  accessibilityLabel="Catalog actions"
                >
                  <s-button
                    slot="primary-action"
                    onClick={syncProducts}
                    disabled={!canSyncCatalog}
                    {...(isLoading ? { loading: true } : {})}
                  >
                    Sync catalog
                  </s-button>
                </s-button-group>
              </s-grid>
            </s-grid>
          ) : (
            <s-section padding="none">
              <s-table>
                <s-table-header-row>
                  <s-table-header listSlot="primary">Product</s-table-header>
                  <s-table-header listSlot="inline">Status</s-table-header>
                  <s-table-header listSlot="labeled" format="numeric">
                    Price
                  </s-table-header>
                  <s-table-header listSlot="labeled">Last synced</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {products.map((row: (typeof products)[number]) => (
                    <s-table-row key={row.id}>
                      <s-table-cell>{row.title}</s-table-cell>
                      <s-table-cell>
                        {productStatusBadge(row.status)}
                      </s-table-cell>
                      <s-table-cell>{row.price || "—"}</s-table-cell>
                      <s-table-cell>
                        {new Date(row.lastSyncedAt).toLocaleString()}
                      </s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
            </s-section>
          )}
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="About this demo">
        <s-stack direction="block" gap="small-200">
          <s-paragraph>
            This demo mirrors your product catalog into a local database (sync)
            and uses Shopify{" "}
            <s-link
              href="https://shopify.dev/docs/apps/build/events"
              target="_blank"
            >
              Events
            </s-link>{" "}
            subscriptions for create, update, and delete. Handlers log each
            delivery to the terminal.
          </s-paragraph>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Resources">
        <s-stack direction="block" gap="small-200">
          <s-stack direction="block" gap="small-100">
            <s-link href="https://reactrouter.com/" target="_blank">
              React Router
            </s-link>
            <s-link
              href="https://shopify.dev/docs/api/app-home/patterns"
              target="_blank"
            >
              App Home patterns
            </s-link>
            <s-link
              href="https://shopify.dev/docs/api/app-home/using-polaris-components"
              target="_blank"
            >
              Polaris web components
            </s-link>
            <s-link
              href="https://shopify.dev/docs/api/admin-graphql"
              target="_blank"
            >
              Admin GraphQL
            </s-link>
            <s-link
              href="https://shopify.dev/docs/apps/build/events/delivery-structure"
              target="_blank"
            >
              Event delivery structure
            </s-link>
            <s-link href="https://www.prisma.io/" target="_blank">
              Prisma
            </s-link>
          </s-stack>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
