import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Cache the Prisma client on the global object so Vercel serverless functions
// reuse the same connection pool across warm invocations. Without this, every
// cold start creates a new PrismaClient and the DB connection pool exhausts
// quickly under load.
//
// Query logging is disabled in production (it generates massive logs and
// slows down responses on serverless).
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
