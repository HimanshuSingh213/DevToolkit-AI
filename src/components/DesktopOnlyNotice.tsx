"use client"

import React, { useState } from 'react'
import { Monitor, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function DesktopOnlyNotice() {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText("https://dev-toolkit-ai.vercel.app")
      setCopied(true)
      toast.success("Desktop link copied to clipboard!")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error("Failed to copy link.")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full p-6 bg-background text-text select-none">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 text-center space-y-6">
        {/* Solid Icon Container */}
        <div className="mx-auto w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center">
          <Monitor className="w-8 h-8 text-accent" />
        </div>

        {/* Solid Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-background border border-border text-accent font-mono text-xs">
          <span>Desktop Required</span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-text tracking-tight font-sans">
            Desktop Experience Required
          </h1>
          <p className="text-xs text-text-muted leading-relaxed font-sans">
            DevToolkit.AI workspace tools (README editor, Git commit generator, Regex sandbox, and JSON validator) are designed for desktop screens. Please open this URL on your laptop or desktop browser.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-accent text-background font-semibold text-xs hover:opacity-90 active:scale-[0.99] transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Desktop Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
