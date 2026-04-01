# Next Gen Events demo (order of operations)

- Configure `shopify.app.toml` (or your app config) for the Next Gen event subscription(s): URI, topic, handle, query when you need `data`.

- **X** — Minimal supporting code under `@app/nge` (enough for the first NGE endpoint to work). Teach / show first:
  - `@app/routes/nge.app.products-create.tsx` wired to `runNextGenEventAction` with `expectedActions: ['create']`.
  - `@app/nge/route-action.server.ts` — includes debug forward: copies `shopify-*` / `x-shopify-*` on the outbound POST so your listener sees the same metadata as Shopify sent, not only the JSON body.
  - `@app/nge/config.server.ts` — set `WEBHOOK_DEBUG_FORWARD_URL` in `.env` early so forwarded deliveries are testable end-to-end.
  - `@app/nge/types.server.ts`

- Add `@app/routes/nge.app.products-delete.tsx` (Product + delete), plus the matching TOML subscription / URL.

- **Y** — Trust + idempotency (explain after create/delete are on the wire):
  - `@app/nge/hmac.server.ts` — request is signed over the **raw** body; `SHOPIFY_API_SECRET` + `shopify-hmac-sha256` prove authenticity before you trust JSON.
  - `@app/nge/dedupe-delivery.server.ts` — duplicate deliveries vs distinct ones (`shopify-webhook-id` vs shared `shopify-event-id`).

- Add `@app/routes/nge.app.products-update.tsx` (Product + update). Subscription can include a GraphQL query so payloads carry **`data`** (and possibly **`errors`**). More interesting than create-only.

- **Z** — Richer payloads on update:
  - In the handler or logs: `data`, `errors`, `fields_changed`, `query_variables` from `@app/nge/types.server.ts`.

Everything in `@app/nge` can stay in the tree from the start; X / Y / Z is **what you walk through in order**, not three different installs.
