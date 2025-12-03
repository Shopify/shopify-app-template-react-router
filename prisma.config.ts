import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  // the main entry for your schema
  schema: 'prisma/schema.prisma',
  // where migrations should be generated
  migrations: {
    path: 'prisma/migrations',
  },
  // The database URL 
  datasource: {
    url: 'file:./prisma/dev.sqlite',
  },
})