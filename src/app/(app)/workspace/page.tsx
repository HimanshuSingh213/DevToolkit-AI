"use client"

import { motion, AnimatePresence } from 'framer-motion'
import WorkspaceHub from '@/components/workspace/WorkspaceHub'
import useApp from '@/context/AppContext'
import ReadmeGenerator from '@/components/readme-generator/ReadmeGenerator'
import CommitGenerator from '@/components/commit-msg-generator/CommitGenerator'
import RegexGenerator from '@/components/regex-generator/RegexGenerator'
import JsonToolkit from '@/components/json-toolkit/JsonToolkit'

export default function page() {
  const { activeWindow, setActiveWindow } = useApp()

  const handleBack = () => setActiveWindow('hub')

  return (
    <div className={`flex flex-col grow w-full h-full p-4 min-h-0 ${activeWindow === 'hub' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
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
            className='w-full h-full flex flex-col grow min-h-0'
          >
            {activeWindow === 'readme' && <ReadmeGenerator />}
            {activeWindow === 'commit' && <CommitGenerator />}
            {activeWindow === 'regex' && <RegexGenerator />}
            {activeWindow === 'json' && <JsonToolkit />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
