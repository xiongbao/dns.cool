import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { Pool } from 'pg'

function resolveBaseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.V0_RUNTIME_URL
}

function resolveTrustedOrigins() {
  const origins = new Set<string>()
  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000')
    for (const key of [
      'V0_RUNTIME_URL',
      'V0_DEV_APP_URL',
      'V0_BUILD_URL',
      'V0_SANDBOX_URL',
    ]) {
      const value = process.env[key]
      if (value) origins.add(value)
    }
  } else {
    if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`)
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
      origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  }
  return [...origins]
}

export const auth = betterAuth({
  baseURL: resolveBaseURL(),
  trustedOrigins: resolveTrustedOrigins(),
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
