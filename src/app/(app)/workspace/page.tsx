"use client"

import { motion, AnimatePresence } from 'framer-motion'
import WorkspaceHub from '@/components/workspace/WorkspaceHub'
import useApp from '@/context/AppContext'
import ReadmeGenerator from '@/components/readme-generator/ReadmeGenerator'
import CommitGenerator from '@/components/commit-msg-generator/CommitGenerator'

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center text-sm text-text-muted hover:text-text gap-1 mb-4 transition cursor-pointer bg-transparent border-none outline-none"
  >
    ← Back to Workspace
  </button>
)





const RegexGenerator = ({ onBack }: { onBack: () => void }) => (
  <div>
    <BackButton onClick={onBack} />
    <h2 className="text-2xl font-medium text-text mb-2">Regex Generator</h2>
    <p className="text-sm text-text-muted font-light">Convert colloquial English requests into exact regex patterns.</p>
  </div>
)

const JsonToolkit = ({ onBack }: { onBack: () => void }) => (
  <div>
    <BackButton onClick={onBack} />
    <h2 className="text-2xl font-medium text-text mb-2">JSON Toolkit</h2>
    <p className="text-sm text-text-muted font-light">Synthesize, validate, and beautify JSON hierarchies.</p>
  </div>
)

export default function page() {
  const { activeWindow, setActiveWindow } = useApp()

  const handleBack = () => setActiveWindow('hub')

  return (
    <div className='flex flex-1 flex-col w-full p-4 overflow-hidden'>
      <AnimatePresence mode="wait">
        {activeWindow === 'hub' ? (
          <motion.div
            key="workspace-hub"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className='w-full max-w-5xl mx-auto my-12 px-4'
          >
            <WorkspaceHub />
          </motion.div>
        ) : (
          <motion.div
            key={activeWindow}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className=''
          >
            {activeWindow === 'readme' && <ReadmeGenerator />}
            {activeWindow === 'commit' && <CommitGenerator onBack={handleBack} />}
            {activeWindow === 'regex' && <RegexGenerator onBack={handleBack} />}
            {activeWindow === 'json' && <JsonToolkit onBack={handleBack} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
