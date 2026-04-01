/** Build a stable Product GID from REST webhook payloads or GraphQL `id`. */
export function productGidFromPayload(payload: Record<string, unknown>): string | null {
  const g = payload.admin_graphql_api_id;
  if (typeof g === "string" && g.startsWith("gid://")) {
    return g;
  }
  const id = payload.id;
  if (typeof id === "number" || (typeof id === "string" && id.length > 0)) {
    return `gid://shopify/Product/${id}`;
  }
  return null;
}
