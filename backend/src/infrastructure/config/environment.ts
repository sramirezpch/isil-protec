export const env = {
  port: Number(process.env.PORT) || '3000',
  databaseUrl: process.env.DATABASE_URL || '',
  taxIdApiKey: process.env.TAXID_PRO_API_KEY || '',
  taxIdApiUrl: process.env.TAXID_PRO_API_URL || '',
  isProduction: process.env.NODE_ENV === 'production',
  isStaging: process.env.NODE_ENV === 'staging',
  isDev: process.env.NODE_ENV === 'development',
};
