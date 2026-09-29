export const env = {
    port: Number(process.env.PORT) || '3000',
    databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:cacahuete123@localhost:5432/db-proyecto-tecnologico',
    isProduction: process.env.NODE_ENV === 'production',
    isStaging: process.env.NODE_ENV === 'staging',
    isDev: process.env.NODE_ENV === 'development' || true
}