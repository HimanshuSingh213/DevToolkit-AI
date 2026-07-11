import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
        
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-zinc-400 mt-1">Sign in to your account</p>
        </div>

        <div className="flex flex-col gap-3">
          {/* GitHub Sign In */}
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/workspace" })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 font-medium text-white transition hover:bg-zinc-700 active:scale-[0.98]"
            >
              Continue with GitHub
            </button>
          </form>

          {/* Google Sign In */}
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/workspace" })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 font-medium text-black transition hover:bg-zinc-100 active:scale-[0.98]"
            >
              Continue with Google
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}