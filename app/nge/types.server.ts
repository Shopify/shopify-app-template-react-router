export const NEXT_GEN_ACTIONS = new Set<string>(['create', 'update', 'delete']);

export type NextGenAction = 'create' | 'update' | 'delete';

/**
 * Next Gen Events JSON body (Shopify).
 *
 * - `topic` — Resource name for the event (e.g. Product).
 * - `action` — What happened: create, update, or delete.
 * - `handle` — Subscription handle from TOML (useful when several subscriptions share a topic).
 * - `data` — GraphQL query result; only when the subscription defines a query.
 * - `errors` — GraphQL errors when the query fails (bad field, deleted resource, etc.).
 * - `fields_changed` — Dot-notation paths with embedded GIDs for changed fields / entities.
 * - `query_variables` — Resolved entity IDs, flat key-value (same names as query variables).
 *
 * Forwarding uses `rawBody`, so any extra keys Shopify adds are still sent verbatim.
 */
export type NextGenEventPayload = {
  topic: string;
  action: NextGenAction;
  handle?: string;
  data?: unknown;
  errors?: ReadonlyArray<Record<string, unknown>>;
  fields_changed?: string[];
  query_variables?: Record<string, unknown>;
};

export function isNextGenAction(value: unknown): value is NextGenAction {
  return typeof value === 'string' && NEXT_GEN_ACTIONS.has(value);
}
