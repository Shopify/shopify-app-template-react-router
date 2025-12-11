import { PrismaClient } from "../app/generated/client";
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient;
}

const adapter = new PrismaBetterSqlite3({
  url: 'file:../prisma/dev.sqlite'
})

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient({ adapter });
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient({ adapter });

export default prisma;
