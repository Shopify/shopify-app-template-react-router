import type { PrismaConfig } from "prisma";

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: "file:./prisma/dev.sqlite",
  },
} satisfies PrismaConfig;