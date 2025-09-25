import { createContext } from "react-router";
import { authenticate } from "./shopify.server";

export const authenticatedAdminContext =
  createContext<Awaited<ReturnType<typeof authenticate.admin>>>();
