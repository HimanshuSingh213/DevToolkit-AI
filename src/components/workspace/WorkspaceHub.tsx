"use client"

import React from 'react'
import { BookOpen, GitCommit, Code2, Binary, Database, ArrowRight } from 'lucide-react'

type WindowType = 'hub' | 'readme' | 'commit' | 'regex' | 'json'

const options = [
  {
    id: "readme" as WindowType,
    title: "README Generator",
    description: "Generate high-quality, professional Markdown documentations directly formatted for GitHub.",
    tag: "AI",
    tagType: "ai",
    icon: BookOpen,
  },
  {
    id: "commit" as WindowType,
    title: "Commit Message Generator",
    description: "Convert informal, messy patch summaries into strict, semantic conventional commit outputs.",
    tag: "AI",
    tagType: "ai",
    icon: GitCommit,
  },
  {
    id: "regex" as WindowType,
    title: "Regex Generator",
    description: "Convert colloquial English string requests into exact safe patterns with built-in sandbox testing.",
    tag: "AI",
    tagType: "ai",
    icon: Binary,
  },
  {
    id: "json" as WindowType,
    title: "JSON Toolkit",
    description: "Synthesize payload structures. Validate schemas, beautify hierarchies, and traverse nodes.",
    tag: "FORMATTER ENGINE",
    tagType: "engine",
    icon: Database,
  }
]

import useApp from '@/context/AppContext'

export default function WorkspaceHub() {
  const { setActiveWindow } = useApp()

  return (
    <div className="flex flex-col space-y-8">
      {/* Heading Section */}
      <div className='flex flex-col items-start justify-center gap-2'>
        <div className='flex flex-row gap-2'>
          <span className='uppercase text-xs tracking-wider font-mono text-accent bg-accent-soft py-1 px-2 rounded-sm'>Workspace hub</span>
        </div>
        <h1 className='text-4xl font-medium text-text'>Welcome back.</h1>
        <p className='text-sm text-text-secondary font-light'>What would you like to build today? Select a utility to begin working.</p>
      </div>

      {/* Feature Options */}
      <div className="flex flex-col gap-4">
        {options.map((option) => {
          const Icon = option.icon
          return (
            <div 
              key={option.title}
              className='p-2 rounded-md bg-surface border border-border-soft overflow-hidden'
            >
              <button
                onClick={() => setActiveWindow(option.id)}
                className="w-full text-left group relative flex flex-row items-center justify-between p-5 bg-card hover:bg-elevated border border-border-soft hover:border-t-white rounded-xl shadow-xl shadow-black/60 hover:shadow-none hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="flex flex-row items-center flex-1">
                  {/* Icon Container */}
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-surface border border-border-soft text-text-muted">
                    <Icon size={20} />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col ml-4 gap-1">
                    <div className="flex flex-row items-center gap-2">
                      <span className="font-medium font-mono text-text text-base transition duration-200">
                        {option.title}
                      </span>
                      {option.tagType === 'ai' ? (
                        <span className="text-[10px] tracking-wider font-mono font-semibold text-accent bg-accent-soft px-1.5 py-0.5 rounded-sm uppercase">
                          {option.tag}
                        </span>
                      ) : (
                        <span className="text-[10px] tracking-wider font-mono font-semibold text-text-muted bg-border px-1.5 py-0.5 rounded-sm uppercase">
                          {option.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-text-muted font-light leading-relaxed max-w-3xl">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Right Arrow */}
                <div className="ml-4 text-text-muted group-hover:text-text group-hover:translate-x-1 transition duration-200">
                  <ArrowRight size={18} />
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
