
import type { LoaderFunction } from "react-router";
import { adminMiddleware } from "app/middleware/admin";

export const unstable_middleware = [adminMiddleware]

export const loader: LoaderFunction = async () => {
  return null;
};
