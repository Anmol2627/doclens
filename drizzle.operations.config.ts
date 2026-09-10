import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/data/server/db-schema-operations.ts',
  out: './drizzle-operations',
  dialect: 'sqlite', // 'postgresql' | 'mysql' | 'sqlite'
});
