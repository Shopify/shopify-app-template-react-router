# Events get-started: step outline

# Create an Events subscription

Suppose you're building an app that keeps a merchant's external product catalog in sync with Shopify. The external catalog already exists. Your app's job is to reflect changes as they happen.

When a product is created in Shopify, your app needs to add it to the external catalog. When it's deleted, your app needs to remove it. When a variant's price or compare at price changes, your app needs to patch the corresponding record. In this tutorial, you'll set up Events subscriptions for all three actions.

## **What you'll learn**

In this tutorial, you'll learn how to do the following tasks:

* Write Events subscriptions in `shopify.app.toml` for create, delete, and update actions.  
* Process deliveries in route handlers.  
* Use `triggers` and a custom `query` to receive only the data your app needs.  
* Use `fields_changed` and `query_variables` to process update deliveries.  
* Test that your endpoints receive deliveries when products are created, deleted, and updated.

## **Requirements**

[Shopify CLI version 3.92 or higher](https://shopify.dev/docs/api/shopify-cli#upgrade)

Events require Shopify CLI version 3.92 or higher. Run `shopify version` to check, and see [upgrade instructions](https://shopify.dev/docs/api/shopify-cli#upgrade) if needed.

[Scaffold an app](https://shopify.dev/docs/apps/build/scaffold-app)

Scaffold an app that uses the [React Router template](https://github.com/Shopify/shopify-app-template-react-router).

For HTTPS delivery behavior and scaling later, see [HTTPS delivery considerations](https://shopify.dev/docs/apps/build/webhooks/ignore-duplicates#https-delivery-considerations) on Shopify.dev (optional for this walkthrough).

## **Project**

[View on GitHub](https://github.com/Shopify/shopify-app-template-react-router/blob/nge-subscribe-example-https)

## **Repo region tags**

This repo wraps tutorial-sized snippets in `# [START …]` / `# [END …]` (TOML) or `// [START …]` / `// [END …]` (TypeScript) so excerpts can be pulled by label. Use the **tag name** (the string after `START` / `END`) when searching the codebase.

| Tutorial | Snippet | File | Region tag pair |
| -------- | ------- | ---- | ----------------- |
| Part 1 — Step 1 | Access scopes | `shopify.app.toml` | `events-access-scopes` |
| Part 1 — Step 1 | `[events]` + first subscription (create) | `shopify.app.toml` | `events-create-configuration` |
| Part 1 — Step 2 | Create route handler | `app/routes/events.app.products-create.tsx` | `events-handler-product-create` |
| Part 1 — Step 3 | Delete subscription | `shopify.app.toml` | `events-delete-configuration` |
| Part 1 — Step 3 | Delete route handler | `app/routes/events.app.products-delete.tsx` | `events-handler-product-delete` |
| Part 2 — Step 5 | Update subscription header (`handle` / `topic` / `actions`) | `shopify.app.toml` | `events-update-configuration` |
| Part 2 — Step 5 | `triggers` | `shopify.app.toml` | `events-update-triggers` |
| Part 2 — Step 5 | `uri` for update | `shopify.app.toml` | `events-update-uri` |
| Part 2 — Step 5 | `query` | `shopify.app.toml` | `events-update-query` |
| Part 2 — Step 5 | `query_filter` | `shopify.app.toml` | `events-update-query-filter` |
| Part 2 — Step 5 | Update route handler | `app/routes/events.app.products-update.tsx` | `events-handler-product-update` |

## **Part 1: Create, delete, and test subscriptions**

### Step 1: Configure your Events subscription

**Repo tags:** `events-access-scopes` (scopes block) · `events-create-configuration` (`[events]` + create `[[events.subscription]]`).

**1\. Update your access scopes**

Add the required scope for the topic you're subscribing to. For the Product topic, add `write_products`.

```
[access_scopes]
scopes = "write_products"
```

**2\. Configure the subscription**

Set `api_version` in `[events]`. The version determines which topics are available.

```
[events]
api_version = "unstable"
```

Add an `[[events.subscription]]` block with a unique `handle` to identify deliveries from this subscription.

```
[[events.subscription]]
handle = "create_product_events"
```

Set `topic` to the resource name and `actions` to the operations to listen for.

```
topic = "Product"
actions = ["create"]
```

Set `uri` to the relative path of the route that will handle deliveries.

```
uri = "/events/app/products-create"
```

---

### Step 2: Process the delivery

**Repo tag:** `events-handler-product-create` in `app/routes/events.app.products-create.tsx`.

**1\. Log to the terminal**

Use `authenticate.webhook` from your app’s `shopify.server` module. Shopify’s library validates the request; you read `shop`, `topic`, and `payload` (the JSON body).

Add a route `action` that logs one short line, then the full `payload` so you can inspect it in the terminal where `shopify app dev` is running.

Create route (`app/routes/events.app.products-create.tsx`):

```ts
import { authenticate } from "../shopify.server";

export const action = async ({ request }: { request: Request }) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} Event for ${shop}`);
  console.log(JSON.stringify(payload, null, 2));

  return new Response(null, { status: 200 });
};
```

**Example (update delivery):** the second log line is stringified JSON. On an update with a `query` configured, you will often see `fields_changed`, `query_variables`, and `data` *inside* that object (see [Event delivery structure](https://shopify.dev/docs/apps/build/events/delivery-structure)). Illustrative fragment:

```json
{
  "topic": "Product",
  "action": "update",
  "handle": "update_product_events",
  "fields_changed": [
    "product[gid://shopify/Product/123].variants[gid://shopify/ProductVariant/456].price"
  ],
  "query_variables": {
    "productId": "gid://shopify/Product/123",
    "variantsId": "gid://shopify/ProductVariant/456"
  },
  "data": { "...": "GraphQL result from your subscription query" }
}
```

---

### Step 3: Add a delete subscription

**Repo tags:** `events-delete-configuration` (`shopify.app.toml`) · `events-handler-product-delete` (`app/routes/events.app.products-delete.tsx`).

**1\. Add the subscription to your app configuration**

Add a second `[[events.subscription]]` block for the same topic with `actions = ["delete"]` and a new route URI.

```
[[events.subscription]]
handle = "delete_product_events"

topic = "Product"
actions = ["delete"]

uri = "/events/app/products-delete"
```

**2\. Define a route for delete deliveries**

Use the same `action` as create in `app/routes/events.app.products-delete.tsx` (same imports, same body). Shopify sends delete deliveries to the URI you set for the delete subscription only.

---

### Step 4: Test your subscriptions

**Repo tags:** none (you are exercising the regions from Steps 1–3 in a running dev store).

1. Save your TOML file and run `shopify app dev`. Subscriptions are automatically created or updated and are now active in your dev store.  
2. Create a new product in your test shop. Watch the terminal running `shopify app dev` — you should see a short log line and the full `payload` JSON.  
3. Delete a product. Your delete route should receive a delivery and log again.

---

## **Part 2: Handle product updates**

### Step 5: Add an update subscription

**Repo tags:** `events-update-configuration` · `events-update-triggers` · `events-update-uri` · `events-update-query` · `events-update-query-filter` (all in `shopify.app.toml`; mirrored in `shopify.wipb.toml`). Handler: `events-handler-product-update` in `app/routes/events.app.products-update.tsx`.

**1\. Define the subscription**

```
[[events.subscription]]
handle = "update_product_events"

topic = "Product"
actions = ["update"]
```

**2\. Add triggers**

Narrow deliveries to the specific field paths your sync logic needs. Without triggers, every update to the topic fires a delivery.

```
triggers = [
  "product.variants.price",
  "product.variants.compareAtPrice"
]
```

**3\. Add a query**

When a trigger fires, Shopify executes this query and includes the result in the `data` field. Without a query, the delivery has no `data` field.

```
query = """
query price_change($productId: ID!, $variantsId: ID!){
  productVariant(id: $variantsId) {
    id
    price
    compareAtPrice
  }
  product(id: $productId) {
      id
      title
      status
  }
}
"""
```

**4\. Add a query filter**

Suppress deliveries for resources that shouldn't be processed. The filter evaluates after the query runs, so you can filter on any field returned by your query.

```
query_filter = "product.status:'ACTIVE'"
```

**5\. Define a route for update deliveries**

Reuse the same `action` as create in `app/routes/events.app.products-update.tsx`. Your `triggers`, `query`, and `query_filter` in TOML control what shows up inside `payload` when you print it.

---

### Step 6: Test the update subscription

**Repo tags:** none (manual verification of Step 5 config + `events-handler-product-update`).

1. Save your TOML file and run `shopify app dev`. The subscription is automatically created or updated.  
2. Change the price or compare-at price of a product variant on an **ACTIVE** product. In the printed JSON, look for `fields_changed`, `query_variables`, and `data` when your subscription includes a `query`.  
3. Update an inactive product's price or an active product's title only — in both cases no delivery should be received (inactive products are excluded by `query_filter`; title changes are outside your `triggers`).

---

### Step 7: Deploy your app

**Repo tags:** none (CLI pushes the same `shopify.app.toml` regions you edited above).

Run `shopify app deploy` to release your subscriptions to production.

## **Next steps**

- [Delivery filtering](https://shopify.dev/docs/apps/build/events/delivery-filtering)

  [Narrow update deliveries with trigger paths and suppress deliveries with `query_filter`.](https://shopify.dev/docs/apps/build/events/delivery-filtering)

- [Delivery structure](https://shopify.dev/docs/apps/build/events/delivery-structure)

  [Shape payloads with `query` and understand what each delivery contains.](https://shopify.dev/docs/apps/build/events/delivery-structure)
