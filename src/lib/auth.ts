import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// NextAuth config. Uses credentials provider backed by Prisma users table.
// Passwords are bcrypt-hashed. Sessions are JWT-based (db adapter not needed
// because we keep our own User/Membership tables and re-derive the active
// organization on each request via session.tenantId).

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
    tenantId?: string;
    tenantRole?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
    name?: string | null;
    tenantId?: string;
    tenantRole?: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // Production (Vercel, HTTPS): use secure cookies so auth works over HTTPS.
  // Without this, NextAuth sets insecure cookies and the session is lost
  // immediately after login on Vercel.
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: undefined,
      },
    },
    callbackUrl: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Host-" : ""
      }next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const email = creds.email.toLowerCase().trim();
        const user = await db.user.findUnique({
          where: { email },
          include: {
            memberships: { select: { organizationId: true, role: true } },
          },
        });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email!;
        token.name = user.name;
        // Pick the first membership as the active tenant. UI can switch later.
        const m = await db.membership.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });
        if (m) {
          token.tenantId = m.organizationId;
          token.tenantRole = m.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.email = token.email;
        session.user.name = token.name;
        session.tenantId = token.tenantId;
        session.tenantRole = token.tenantRole;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  // NOTE: Do NOT set `url` here — NextAuth v4 does not have a `url` option.
  // The deployment URL is read from the NEXTAUTH_URL env var automatically.
};

// Helper: generate a random token for email verification / invites / api keys
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

// Helper: hash a password with bcrypt
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
