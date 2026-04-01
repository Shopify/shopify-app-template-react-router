export const NEXT_GEN_ACTIONS = new Set<string>(['create', 'update', 'delete']);

export type NextGenAction = 'create' | 'update' | 'delete';

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
