"use client"

import React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'

export default function AuthAwareCTA({
  authedLabel = 'Open Workspace',
  guestLabel = 'Get started, it’s free',
  variant = 'primary',
}: {
  authedLabel?: string
  guestLabel?: string
  variant?: 'primary' | 'secondary'
}) {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  const isAuthed = !!session?.user

  const base =
    'group inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all duration-200'
  const styles =
    variant === 'primary'
      ? `${base} bg-accent text-black hover:bg-accent-hover`
      : `${base} border border-border-soft bg-card text-text hover:border-accent/40 hover:bg-elevated`

  if (isLoading) {
    return <div className="h-[46px] w-48 animate-pulse rounded-lg bg-elevated/60" />
  }

  return (
    <Link href={isAuthed ? '/workspace' : '/login'} className={styles}>
      {isAuthed ? authedLabel : guestLabel}
      <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  )
}
