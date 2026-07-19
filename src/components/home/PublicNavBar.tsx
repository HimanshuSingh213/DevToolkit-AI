"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { ArrowRight, LogOut, Menu, X } from 'lucide-react'
import { LiquidTooltip } from '@/components/rareui/LiquidTooltip/LiquidTooltip'

const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const navLinks = [
  { href: '#tools', label: 'Tools' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#stack', label: 'Stack' },
]

function getInitials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

export default function PublicNavBar() {
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLoading = status === 'loading'
  const isAuthed = !!session?.user

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-soft bg-background/70 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold text-text tracking-tight">
          DevToolkit<span className="text-accent">.AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-mono text-sm text-text-muted">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors duration-200 hover:text-text"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <LiquidTooltip text="HimanshuSingh213" placement="bottom">
            <a
              href="https://github.com/HimanshuSingh213/DevToolkit-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-1 text-text-muted transition-colors duration-200 hover:text-text cursor-pointer"
            >
              <GithubIcon size={18} />
            </a>
          </LiquidTooltip>

          <div className="h-4 w-px bg-border-soft" />

          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 animate-pulse rounded-lg bg-elevated/60" />
            </div>
          ) : isAuthed ? (
            <div className="flex items-center gap-3">
              <Link
                href="/workspace"
                className="group flex items-center gap-2 rounded-lg border border-border-soft bg-card px-3 py-1.5 text-sm text-text transition-all duration-200 hover:border-accent/40 hover:bg-elevated"
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User avatar'}
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft font-mono text-[9px] font-semibold text-accent">
                    {getInitials(session?.user?.name)}
                  </span>
                )}
                <span className="font-mono text-xs text-text-muted">Workspace</span>
                <ArrowRight size={13} className="text-text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center justify-center p-1.5 text-text-muted transition-colors duration-200 hover:text-red-400"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-black transition-colors duration-200 hover:bg-accent-hover"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center justify-center p-1 text-text md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border-soft bg-surface md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-mono text-sm text-text-muted transition-colors duration-200 hover:text-text"
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px w-full bg-border-soft" />
              {isAuthed ? (
                <Link
                  href="/workspace"
                  className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black"
                >
                  Open Workspace <ArrowRight size={14} />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black"
                >
                  Sign in
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
