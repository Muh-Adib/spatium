import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { validateCredentials, getValidatedAuthSecret } from '@/lib/auth/credentials'

export { validateCredentials, getValidatedAuthSecret }

declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id?: string
      role?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: getValidatedAuthSecret(),
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/pawon',
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
        token.role = user.role || 'EDITOR'
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = (token.role as string) || 'EDITOR'
        session.user.id = String(token.id || token.sub || '')
      }
      return session
    },
  },
})
