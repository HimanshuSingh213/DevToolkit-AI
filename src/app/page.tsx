import { BookOpen, GitCommit, Binary, Database, Zap, Sparkles, ShieldCheck } from 'lucide-react'

import PublicNavBar from '@/components/home/PublicNavBar'
import HeroTerminal from '@/components/home/HeroTerminal'
import AuthAwareCTA from '@/components/home/AuthAwareCTA'
import Reveal from '@/components/home/Reveal'

const stack = [
  'Next.js', 'TypeScript', 'Groq SDK', 'Google Gemini',
  'MongoDB', 'NextAuth.js', 'Tailwind CSS', 'Framer Motion', 'Zod',
]

const tools = [
  {
    title: 'README Generator',
    description: 'Generate high-quality, professional Markdown documentation directly formatted for GitHub.',
    tag: 'AI',
    tagType: 'ai' as const,
    icon: BookOpen,
  },
  {
    title: 'Commit Message Generator',
    description: 'Convert informal, messy patch summaries into strict, semantic conventional commit outputs.',
    tag: 'AI',
    tagType: 'ai' as const,
    icon: GitCommit,
  },
  {
    title: 'Regex Generator',
    description: 'Convert colloquial English string requests into exact, safe patterns with a built-in test sandbox.',
    tag: 'AI',
    tagType: 'ai' as const,
    icon: Binary,
  },
  {
    title: 'JSON Toolkit',
    description: 'Validate schemas, beautify hierarchies, and traverse nested structures.',
    tag: 'FORMATTER',
    tagType: 'engine' as const,
    icon: Database,
  },
]

const fallbackChain = [
  'llama-3.1-8b-instant',
  'llama-4-scout-17b-16e-instruct',
  'groq/compound-mini',
  'llama-3.3-70b-versatile',
]

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PublicNavBar />

      <main className="flex-1">
        {/* ---------------- Hero ---------------- */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-14 px-6 pb-20 pt-16 md:pt-24 lg:flex-row lg:items-center lg:gap-10">
          <Reveal className="flex flex-1 flex-col items-start gap-6">
            <span className="rounded-sm bg-accent-soft px-2 py-1 font-mono text-xs uppercase tracking-wider text-accent">
              Developer Productivity Suite
            </span>
            <h1 className="text-4xl font-medium leading-[1.15] tracking-tight text-text md:text-5xl">
              Four AI tools. One workspace.
              <br />
              Zero context-switching.
            </h1>
            <p className="max-w-md text-base font-light leading-relaxed text-text-secondary">
              DevToolkit AI writes your READMEs, drafts semantic commit messages, builds regex
              patterns, and formats JSON — routed across Groq and Gemini with automatic fallback,
              so a rate limit never blocks your build.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <AuthAwareCTA />
              <a
                href="https://github.com/HimanshuSingh213/DevToolkit-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border-soft bg-card px-5 py-3 text-sm font-medium text-text transition-all duration-200 hover:border-text/20 hover:bg-elevated"
              >
                View source
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="flex w-full flex-1 justify-center lg:justify-end">
            <HeroTerminal />
          </Reveal>
        </section>

        {/* ---------------- Stack strip ---------------- */}
        <section id="stack" className="border-y border-border-soft bg-surface/60">
          <Reveal className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-6 py-8">
            {stack.map((name) => (
              <span key={name} className="font-mono text-xs tracking-wide text-text-muted">
                {name}
              </span>
            ))}
          </Reveal>
        </section>

        {/* ---------------- Tools / Features ---------------- */}
        <section id="tools" className="mx-auto w-full max-w-6xl px-6 py-24">
          <Reveal className="mb-12 flex flex-col items-start gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Inside the workspace</span>
            <h2 className="text-3xl font-medium text-text">Built for the parts of shipping nobody enjoys.</h2>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tools.map((tool, i) => {
              const Icon = tool.icon
              return (
                <Reveal key={tool.title} delay={i * 0.05}>
                  <div className="p-2 rounded-md bg-surface border border-border-soft overflow-hidden h-full">
                    <div className="group flex h-full flex-col gap-4 rounded-xl border border-border-soft bg-card p-6 shadow-xl shadow-black/60 transition-all duration-300 hover:-translate-y-1 hover:border-t-white hover:bg-elevated hover:shadow-none">
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-soft bg-surface text-text-muted">
                          <Icon size={19} />
                        </div>
                        {tool.tagType === 'ai' ? (
                          <span className="rounded-sm bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                            {tool.tag}
                          </span>
                        ) : (
                          <span className="rounded-sm bg-border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            {tool.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="font-mono text-base font-medium text-text">{tool.title}</h3>
                        <p className="text-sm font-light leading-relaxed text-text-muted">{tool.description}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* ---------------- Architecture ---------------- */}
        <section id="architecture" className="border-t border-border-soft bg-surface/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <Reveal className="mb-12 flex flex-col items-start gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Under the hood</span>
              <h2 className="text-3xl font-medium text-text">A dual-engine that keeps working when a model doesn't.</h2>
              <p className="max-w-2xl text-sm font-light leading-relaxed text-text-secondary">
                Every request is routed to whichever engine fits the task, and every payload is
                validated with Zod before it reaches a model — malformed input never gets that far.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Reveal>
                <div className="flex h-full flex-col gap-5 rounded-xl border border-border-soft bg-card p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Zap size={18} />
                    </div>
                    <div>
                      <h3 className="font-mono text-sm font-medium text-text">Generation path — Groq</h3>
                      <p className="text-xs text-text-muted">Low-latency completion for commits &amp; regex</p>
                    </div>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-text-secondary">
                    If a model returns a rate-limit error, the request moves to the next model in
                    a prioritized fallback chain instead of failing outright.
                  </p>
                  <div className="flex flex-col gap-2 rounded-lg border border-border-soft bg-surface p-4">
                    {fallbackChain.map((model, i) => (
                      <div key={model} className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-soft font-mono text-[10px] text-text-muted">
                          {i + 1}
                        </span>
                        <span className="font-mono text-xs text-text-muted">{model}</span>
                        {i === 0 && (
                          <span className="ml-auto rounded-sm bg-accent-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent">
                            default
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <div className="flex h-full flex-col gap-5 rounded-xl border border-border-soft bg-card p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="font-mono text-sm font-medium text-text">Synthesis path — Gemini</h3>
                      <p className="text-xs text-text-muted">Deep-context analysis for READMEs</p>
                    </div>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-text-secondary">
                    Repository analysis is quota-hungry, so requests rotate across a pool of API
                    keys round-robin — multiplying the effective rate limit instead of hitting one wall.
                  </p>
                  <div className="flex flex-col gap-3 rounded-lg border border-border-soft bg-surface p-4">
                    <div className="flex items-center gap-2">
                      {['Key A', 'Key B', 'Key C'].map((k) => (
                        <span
                          key={k}
                          className="flex-1 rounded-md border border-border-soft bg-card py-2 text-center font-mono text-[11px] text-text-muted"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <ShieldCheck size={13} className="text-success" />
                      <span>Round-robin rotation, no single key absorbs the full load.</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------- Closing CTA ---------------- */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-28 text-center">
          <Reveal className="flex flex-col items-center gap-4">
            <h2 className="max-w-lg text-3xl font-medium text-text">
              Stop context-switching between five different tabs.
            </h2>
            <p className="max-w-md text-sm font-light leading-relaxed text-text-secondary">
              Sign in with GitHub or Google and get straight to the workspace.
            </p>
            <div className="pt-2">
              <AuthAwareCTA guestLabel="Start for free" authedLabel="Back to Workspace" />
            </div>
          </Reveal>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-border-soft">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-text-muted md:flex-row">
          <span className="font-mono">
            DevToolkit<span className="text-accent">.AI</span> — built by{' '}
            <a
              href="https://github.com/HimanshuSingh213"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text"
            >
              Himanshu Singh
            </a>
          </span>
          <div className="flex items-center gap-5 font-mono text-xs">
            <a
              href="https://github.com/HimanshuSingh213/DevToolkit-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text"
            >
              Source
            </a>
            <a
              href="https://dev-toolkit-ai.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text"
            >
              Live
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
