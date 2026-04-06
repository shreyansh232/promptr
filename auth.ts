import NextAuth from "next-auth";
import Github from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

const githubClientId =
  process.env.GITHUB_CLIENT_ID ?? process.env.AUTH_GITHUB_ID ?? "";
const githubClientSecret =
  process.env.GITHUB_CLIENT_SECRET ?? process.env.AUTH_GITHUB_SECRET ?? "";

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) {
        return;
      }

      await db.userProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
        },
      });
    },
  },
  providers: [
    Github({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials || !credentials.email || !credentials.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        if (typeof credentials.password !== "string") {
          return null;
        }

        // Look up existing user — do NOT create one here (that is registration's job)
        const user: any = await db.user.findUnique({ where: { email } });

        if (!user) {
          // User not found — return null to signal "invalid credentials"
          return null;
        }

        if (!user.hashedPassword) {
          // Account exists but was created via OAuth (no password set)
          return null;
        }

        const isMatch = bcrypt.compareSync(
          credentials.password as string,
          user.hashedPassword,
        );

        if (!isMatch) {
          return null;
        }

        return user;
      },
    }),
  ],
});
