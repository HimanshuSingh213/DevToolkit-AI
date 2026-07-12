"use client"

import React from 'react'
import { ArrowLeft } from 'lucide-react'
import useApp from '@/context/AppContext'

const windowTitles: Record<string, string> = {
  readme: "README Generator",
  commit: "Commit Message Generator",
  explainer: "Code Explainer",
  regex: "Regex Generator",
  json: "JSON Toolkit"
}

export default function NavBar() {
  const { activeWindow, setActiveWindow } = useApp()

  const handleBack = () => setActiveWindow('hub')

  return (
    <div className='h-14 w-full bg-surface border-b border-border-soft flex flex-row items-center px-6 justify-between select-none'>
      {activeWindow === 'hub' ? (
        /* Standard NavBar Brand */
        <div className="flex flex-row items-center gap-2">
          <span className="font-semibold text-text tracking-tight">DevToolkit<span className="text-accent">.AI</span></span>
        </div>
      ) : (
        /* Subpage NavBar Navigation */
        <div className="flex flex-row items-center gap-3">
          <button
            onClick={handleBack}
            className="group flex items-center justify-center p-1.5 hover:bg-elevated rounded-lg text-text-muted hover:text-text border border-transparent hover:border-border-soft transition duration-200 cursor-pointer"
            title="Back to Workspace"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          
          <div className="h-4 w-[1px] bg-border-soft" />
          
          <span className="text-sm font-medium text-text">
            {windowTitles[activeWindow] || "Workspace"}
          </span>
        </div>
      )}

      {/* Version Tag */}
      <div className="flex flex-row items-center">
        <span className="text-xs text-text-disabled font-mono">v0.1.0</span>
      </div>
    </div>
  )
}
