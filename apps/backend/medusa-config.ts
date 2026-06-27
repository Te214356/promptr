// Medusa backend configuration — 2026-06-21
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      pool: { min: 0, max: 2, idleTimeoutMillis: 10000 },
    } as Record<string, unknown>,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/moyasar",
            id: "moyasar",
            options: {
              publishableKey: process.env.MOYASAR_PUBLISHABLE_KEY,
              secretKey: process.env.MOYASAR_SECRET_KEY,
            },
          },
        ],
      },
    },
  ],
})
