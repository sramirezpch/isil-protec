import { defineConfig } from 'drizzle-kit';
import { env } from '../../config/environment';

export default defineConfig({
  dialect: 'postgresql',
  schema: 'src/infrastructure/postgres/db/schema/*.ts',
  out: './src/infrastructure/postgres/db/migrations',
  dbCredentials: { url: env.databaseUrl },
});
