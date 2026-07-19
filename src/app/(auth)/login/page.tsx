"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { signIn } from "next-auth/react"
import { ArrowLeft, ArrowRight, BookOpen, GitCommit, Binary, Database, Sparkles, Terminal } from "lucide-react"

// SVG Icons
const GitHubIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
)

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
)

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  const handleSignIn = async (provider: "github" | "google") => {
    setLoadingProvider(provider)
    try {
      await signIn(provider, { callbackUrl: "/workspace" })
    } catch (err) {
      console.error(`Sign in with ${provider} failed:`, err)
      setLoadingProvider(null)
    }
  }

  const features = [
    {
      title: "README Generator",
      description: "Creates comprehensive codebase specs and audits layout logic in a collapsed 2-pass pipeline.",
      icon: BookOpen,
    },
    {
      title: "Commit Message Generator",
      description: "Standardizes sloppy change-logs into clean conventional syntax structures.",
      icon: GitCommit,
    },
    {
      title: "Regex Sandbox",
      description: "Generates secure and testable regular patterns from basic conversational English prompts.",
      icon: Binary,
    },
    {
      title: "JSON Schema Analyzer",
      description: "Beautifies nested keys, maps hierarchical paths, and verifies schema configurations.",
      icon: Database,
    },
  ]

  return (
    <div className="relative flex min-h-screen w-full flex-row overflow-hidden bg-background font-sans text-text">
      {/* Background radial glows */}
      <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-accent/5 blur-[150px] pointer-events-none" />
      <div className="absolute -right-[10%] -bottom-[10%] h-[50%] w-[50%] rounded-full bg-accent/5 blur-[150px] pointer-events-none" />

      {/* Left side: Premium feature showcase (Desktop only) */}
      <div className="relative hidden w-[55%] flex-col justify-between border-r border-border-soft bg-surface/30 p-12 lg:flex select-none">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-sm tracking-widest text-text hover:opacity-90 transition duration-200">
          <Terminal size={16} className="text-accent" />
          <span>DEVTOOLKIT<span className="text-accent font-semibold">.AI</span></span>
        </Link>

        {/* Feature showcase */}
        <div className="my-auto flex flex-col gap-10 max-w-lg">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-accent-soft px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
              <Sparkles size={11} />
              AI-Powered Workspace
            </span>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">
              One platform.<br />
              All your shipping pipeline automated.
            </h2>
            <p className="text-sm font-light leading-relaxed text-text-muted">
              Sync your repository layouts, query deep logic spec generators, and format code configurations directly from a high-performance workspace context.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex gap-4 items-start group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-soft bg-surface text-text-muted group-hover:border-accent/40 group-hover:text-accent transition duration-300">
                    <Icon size={18} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-semibold tracking-wide font-mono text-text">{item.title}</h4>
                    <p className="text-xs font-light leading-relaxed text-text-muted">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs font-mono text-text-disabled">
          © {new Date().getFullYear()} DevToolkit.AI. Powered by Groq and Gemini.
        </div>
      </div>

      {/* Right side: Modern interactive glass-card login form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md flex flex-col gap-1">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text transition-colors duration-200 group self-start ml-1 mb-3"
          >
            <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Back to home</span>
          </Link>

          {/* Card Container */}
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full p-1.5 rounded-2xl bg-surface border border-border-soft overflow-hidden"
          >
            <div className="w-full rounded-xl bg-card border border-border-soft p-8 shadow-2xl shadow-black/80 flex flex-col gap-6">
              
              {/* Header info */}
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Link href="/" className="lg:hidden inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-text mb-1">
                  <Terminal size={12} className="text-accent" />
                  <span>DEVTOOLKIT<span className="text-accent font-semibold">.AI</span></span>
                </Link>
                <h1 className="text-xl font-semibold tracking-tight text-text">Welcome Back</h1>
                <p className="text-[11px] text-text-muted font-light max-w-[280px] leading-relaxed">
                  Sign in to customize settings, track daily limits, and review operation logs.
                </p>
              </div>

              <div className="h-px bg-border-soft w-full my-0.5" />

            {/* Providers grid wrapper */}
            <div className="flex flex-col gap-4">
              {/* GitHub Button */}
              <div className="p-1 rounded-md bg-surface border border-border-soft overflow-hidden w-full">
                <button
                  disabled={loadingProvider !== null}
                  onClick={() => handleSignIn("github")}
                  className="w-full text-left group relative flex flex-row items-center justify-between p-3 bg-card hover:bg-elevated border border-border-soft hover:border-t-white rounded-xl shadow-xl shadow-black/60 hover:shadow-none hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98]"
                >
                  <div className="flex flex-row items-center flex-1">
                    <div className="flex items-center justify-center h-11 w-11 rounded-lg bg-surface border border-border-soft text-text-muted group-hover:border-text-secondary/40 group-hover:text-text transition duration-300">
                      {loadingProvider === "github" ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-muted border-t-white" />
                      ) : (
                        <GitHubIcon />
                      )}
                    </div>
                    <div className="flex flex-col ml-4 gap-0.5">
                      <span className="font-semibold font-mono text-text text-sm transition duration-200">
                        GitHub OAuth
                      </span>
                      <span className="text-[10px] text-text-muted font-light leading-relaxed">
                        Continue with your GitHub account
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-text-muted group-hover:text-text group-hover:translate-x-1 transition duration-200">
                    <ArrowRight size={16} />
                  </div>
                </button>
              </div>

              {/* Google Button */}
              <div className="p-1 rounded-md bg-surface border border-border-soft overflow-hidden w-full">
                <button
                  disabled={loadingProvider !== null}
                  onClick={() => handleSignIn("google")}
                  className="w-full text-left group relative flex flex-row items-center justify-between p-3 bg-card hover:bg-elevated border border-border-soft hover:border-t-white rounded-xl shadow-xl shadow-black/60 hover:shadow-none hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98]"
                >
                  <div className="flex flex-row items-center flex-1">
                    <div className="flex items-center justify-center h-11 w-11 rounded-lg bg-surface border border-border-soft text-text-muted group-hover:border-text-secondary/40 group-hover:text-text transition duration-300">
                      {loadingProvider === "google" ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-muted border-t-white" />
                      ) : (
                        <GoogleIcon />
                      )}
                    </div>
                    <div className="flex flex-col ml-4 gap-0.5">
                      <span className="font-semibold font-mono text-text text-sm transition duration-200">
                        Google Account
                      </span>
                      <span className="text-[10px] text-text-muted font-light leading-relaxed">
                        Continue with your Google account
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-text-muted group-hover:text-text group-hover:translate-x-1 transition duration-200">
                    <ArrowRight size={16} />
                  </div>
                </button>
              </div>
            </div>

            {/* Legal / Notes */}
            <p className="text-[10px] text-center text-text-disabled leading-relaxed max-w-[260px] mx-auto">
              By accessing this workspace, you agree to our security policy and standard session configurations.
            </p>

          </div>
        </motion.div>
      </div>
      </div>
    </div>
  )
}