export const env = {
    port: Number(process.env.port) || '3000',
    databaseUrl: process.env.DATABASE_URL || '',
    isProduction: process.env.NODE_EMV === 'production',
    isStaging: process.env.NODE_ENV === 'staging',
    isDev: process.env.NODE_ENV === 'development' || true
}