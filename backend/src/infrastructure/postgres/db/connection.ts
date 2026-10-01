import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../../config/environment';

export const db = drizzle(env.databaseUrl);
