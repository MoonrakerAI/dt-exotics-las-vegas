import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  email: string
  name: string
  role: string
}

// In a real app, this would be in a database
const users: User[] = [
  {
    id: "1",
    email: "chris@moonraker.ai",
    name: "Chris Morin",
    role: "admin"
  }
]

// In a real app, this would be in a database with hashed passwords
const userCredentials = [
  {
    email: "chris@moonraker.ai",
    // This is the hashed version of "AI2025!"
    passwordHash: "$2b$12$SnyzwfjCsYV35e6hKZBtCub4sFX.P2bv/BxE1oPhd4l395gUbR1KG"
  }
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null
        
        const userCred = userCredentials.find(u => u.email === credentials.email)
        if (!userCred) return null
        
        const isValid = await bcrypt.compare(credentials.password as string, userCred.passwordHash)
        if (!isValid) return null
        
        const user = users.find(u => u.email === credentials.email)
        return user || null
      }
    })
  ],
  pages: {
    signIn: "/admin/login"
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as User).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).id = token.sub
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  }
})