import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = (NextAuth as any)({
  providers: [GitHub, Google],
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user && user.email) {
        try {
          const dbConnect = (await import("@/lib/dbConnect")).default;
          const UserModel = (await import("@/models/user.model")).default;
          
          await dbConnect();
          let dbUser = await UserModel.findOne({ email: user.email });
          if (!dbUser) {
            dbUser = await UserModel.create({
              name: user.name || "User",
              email: user.email,
              avatar: user.image || "",
              provider: account?.provider === "github" ? "github" : "google"
            });
          }
          token.id = dbUser._id.toString();
        } catch (err) {
          console.error("Failed to sync user with database:", err);
          token.id = user.id;
        }
      }
      return token;
    },
    session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
})