import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub, Google],
  callbacks: {
    jwt({token, user}){
      if (user) {
        token.id = user.id
      }
      return token;
    },
    session({session, token}){
      session.user.id = token.id as string
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
})