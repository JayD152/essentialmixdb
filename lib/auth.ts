import NextAuth, { NextAuthOptions, DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: { id: string; name?: string | null; isAdmin?: boolean; isBanned?: boolean } & DefaultSession['user'];
  }
}

export const authOptions: NextAuthOptions = {
  // No DB adapter required: JWT strategy with Credentials provider only
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Account',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        mode: { label: 'Mode', type: 'text' } // "login" | "register"
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password || '';
        const mode = credentials?.mode || 'login';
        if (!username || password.length < 4) return null;
  const existing = await prisma.user.findFirst({ where: { name: username } }) as any;
        if (mode === 'register') {
          if (existing) return null; // username taken
          const hash = await bcrypt.hash(password, 10);
          const user = await (prisma as any).user.create({ data: { name: username, passwordHash: hash } });
          return user;
        } else {
          if (!existing) return null;
            // banned check
          if (existing?.isBanned) return null;
          if (!existing?.passwordHash) return null;
          const ok = await bcrypt.compare(password, existing.passwordHash);
          if (!ok) return null;
          return existing;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).uid = (user as any).id;
        (token as any).adm = (user as any).isAdmin ?? false;
      } else if (token && (token as any).uid) {
        // refresh admin + ban flag every hour (simple heuristic)
        const last = (token as any).rfh || 0;
        if (Date.now() - last > 1000 * 60 * 60) {
          const u = await prisma.user.findUnique({ where: { id: (token as any).uid } }) as any;
          if (u) {
            (token as any).adm = u.isAdmin;
            (token as any).ban = u.isBanned;
          }
          (token as any).rfh = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).uid || token.sub;
        (session.user as any).isAdmin = (token as any).adm || false;
        (session.user as any).isBanned = (token as any).ban || false;
      }
      return session;
    }
  }
};

export default NextAuth(authOptions);
