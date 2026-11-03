import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { validateCredentials, getValidatedAuthSecret } from '@/lib/auth/credentials'

export { validateCredentials, getValidatedAuthSecret }

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: getValidatedAuthSecret(),
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    Credentials({
      name: 'Studio Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        return validateCredentials(credentials?.email, credentials?.password)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'EDITOR'
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        ;(session.user as any).role = token.role || 'EDITOR'
        ;(session.user as any).id = token.id || token.sub
      }
      return session
    },
  },
})
