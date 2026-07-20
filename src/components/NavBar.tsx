"use client"

import React, { useState, useEffect } from 'react'
import { ArrowLeft, LogOut } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import useApp from '@/context/AppContext'
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
);

const windowTitles: Record<string, string> = {
  readme: "README Generator",
  commit: "Commit Message Generator",
  explainer: "Code Explainer",
  regex: "Regex Generator",
  json: "JSON Toolkit"
}

export default function NavBar() {
  const { activeWindow, setActiveWindow } = useApp()
  const { data: session, status } = useSession()

  const handleBack = () => setActiveWindow('hub')

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const isLoading = status === 'loading' || !session?.user;
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkIsDesktop()
    window.addEventListener('resize', checkIsDesktop)
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  if (isDesktop === false) return null

  return (
    <div className='hidden md:flex h-14 w-full bg-surface border-b border-border-soft flex-row items-center px-6 justify-between select-none'>
      {activeWindow === 'hub' ? (
        <div className="flex flex-row items-center gap-2">
          <span className="font-semibold text-text tracking-tight">
            DevToolkit<span className="text-accent">.AI</span>
          </span>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-3">
          <button
            onClick={handleBack}
            className="group flex items-center justify-center p-1.5 hover:bg-elevated rounded-lg text-text-muted hover:text-text border border-transparent hover:border-border-soft transition duration-200 cursor-pointer"
            title="Back to Workspace"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          
          <div className="h-4 w-px bg-border-soft" />
          
          <span className="text-sm font-medium text-text">
            {windowTitles[activeWindow] || "Workspace"}
          </span>
        </div>
      )}

      <div className="flex flex-row items-center gap-4">
        <LiquidTooltip text="HimanshuSingh213" placement="bottom">
          <a
            href="https://github.com/HimanshuSingh213"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-text transition duration-200 cursor-pointer flex items-center justify-center p-1"
          >
            <GithubIcon size={18} />
          </a>
        </LiquidTooltip>

        <div className="h-4 w-px bg-border-soft" />

        {isLoading ? (
          <div className="flex flex-row items-center gap-3">
            <div className="w-28 h-3.5 bg-elevated/60 rounded animate-pulse" />
            <div className="w-7 h-7 rounded-full bg-elevated/60 animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-row items-center gap-3">
            <span className="text-xs font-mono text-text-muted select-text">
              {session?.user?.name}
            </span>

            {session?.user?.image ? (
              <Image
                src={session.user!.image!}
                alt={session.user!.name || "User Avatar"}
                width={28}
                height={28}
                className="w-7 h-7 rounded-full border border-border-soft object-cover select-none pointer-events-none"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-elevated border border-border-soft flex items-center justify-center text-[10px] font-semibold text-accent font-mono select-none">
                {getInitials(session?.user?.name)}
              </div>
            )}

            <div className="h-4 w-px bg-border-soft" />

            <LiquidTooltip text="Sign Out" placement="bottom">
              <button
                onClick={() => signOut()}
                className="text-text-muted hover:text-red-400 transition duration-200 cursor-pointer flex items-center justify-center p-1"
              >
                <LogOut size={15} />
              </button>
            </LiquidTooltip>
          </div>
        )}
      </div>
    </div>
  )
}
