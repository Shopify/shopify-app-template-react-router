import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient;
}

/**
 * In development, do not reuse a global PrismaClient. After `prisma generate`, the
 * old singleton would still embed the previous schema (e.g. missing `demoProductGid`)
 * until the process restarts; skipping the global avoids that stale instance.
 */
const prisma =
  process.env.NODE_ENV !== "production"
    ? new PrismaClient()
    : (global.prismaGlobal ??= new PrismaClient());

export default prisma;
