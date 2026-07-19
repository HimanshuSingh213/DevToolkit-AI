"use client"

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, GitCommit, Binary, Database, type LucideIcon } from 'lucide-react'

type Tool = {
  id: string
  title: string
  tag: string
  tagType: 'ai' | 'engine'
  icon: LucideIcon
  code: string
  caption: string
}

const tools: Tool[] = [
  {
    id: 'readme',
    title: 'readme-generator.md',
    tag: 'AI',
    tagType: 'ai',
    icon: BookOpen,
    code: `## Features

- Real-time collaborative editing
- Offline-first local sync
- Plugin API for custom workflows`,
    caption: 'synthesized from 340 files · gemini-2.5-flash',
  },
  {
    id: 'commit',
    title: 'commit-generator',
    tag: 'AI',
    tagType: 'ai',
    icon: GitCommit,
    code: `feat(auth): rotate refresh tokens on session renewal

Prevents stale sessions from silently failing once
the access token TTL expires.`,
    caption: '+42 −18 · 3 files changed',
  },
  {
    id: 'regex',
    title: 'regex-generator',
    tag: 'AI',
    tagType: 'ai',
    icon: Binary,
    code: `// match a US phone number, optional country code
^(\\+1[\\s-]?)?\\(?\\d{3}\\)?[\\s-]?\\d{3}[\\s-]?\\d{4}$`,
    caption: 'tested against 12 sample strings · 12/12 passed',
  },
  {
    id: 'json',
    title: 'json-toolkit',
    tag: 'FORMATTER',
    tagType: 'engine',
    icon: Database,
    code: `{
  "user": {
    "id": "usr_8f2a91",
    "plan": "pro",
    "quota": { "used": 62, "limit": 80 }
  }
}`,
    caption: 'validated · 0 schema errors',
  },
]

const TYPE_SPEED_MS = 14
const HOLD_MS = 2600

export default function HeroTerminal() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [typedLength, setTypedLength] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const active = tools[activeIndex]

  // Typewriter effect for the active tool's code block
  useEffect(() => {
    if (reducedMotion.current) {
      setTypedLength(active.code.length)
      return
    }
    setTypedLength(0)
    const interval = setInterval(() => {
      setTypedLength((len) => {
        if (len >= active.code.length) {
          clearInterval(interval)
          return len
        }
        return len + 1
      })
    }, TYPE_SPEED_MS)
    return () => clearInterval(interval)
  }, [activeIndex, active.code])

  // Auto-advance through tools once typing settles, unless paused/hovered
  useEffect(() => {
    if (reducedMotion.current || paused) return
    const typingDuration = active.code.length * TYPE_SPEED_MS
    const timeout = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % tools.length)
    }, typingDuration + HOLD_MS)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, paused])

  const isTypingDone = typedLength >= active.code.length

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="w-full max-w-xl overflow-hidden rounded-xl border border-border-soft bg-card shadow-2xl shadow-black/60"
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-border-soft bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="font-mono text-xs text-text-muted">{active.title}</span>
        </div>
        {active.tagType === 'ai' ? (
          <span className="rounded-sm bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
            {active.tag}
          </span>
        ) : (
          <span className="rounded-sm bg-border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {active.tag}
          </span>
        )}
      </div>

      {/* Code body */}
      <div className="min-h-[190px] px-5 py-5">
        <pre className="whitespace-pre-wrap wrap-break-word font-mono text-[13px] leading-relaxed text-text-secondary">
          {active.code.slice(0, typedLength)}
          <span className={`ml-px inline-block h-[14px] w-[7px] translate-y-[2px] bg-accent align-middle ${isTypingDone ? 'animate-pulse' : ''}`} />
        </pre>
      </div>

      {/* Caption */}
      <div className="flex items-center gap-2 border-t border-border-soft bg-surface px-5 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        <span className="font-mono text-[11px] text-text-muted">
          {isTypingDone ? active.caption : 'generating…'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-border-soft">
        {tools.map((tool, i) => {
          const Icon = tool.icon
          const isActive = i === activeIndex
          return (
            <button
              key={tool.id}
              onClick={() => setActiveIndex(i)}
              className={`flex flex-1 items-center justify-center gap-1.5 border-r border-border-soft py-2.5 font-mono text-[11px] transition-colors duration-200 last:border-r-0 ${
                isActive ? 'bg-elevated text-text' : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{tool.id}</span>
              {isActive && (
                <motion.span layoutId="hero-tab-dot" className="ml-1 h-1 w-1 rounded-full bg-accent" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
