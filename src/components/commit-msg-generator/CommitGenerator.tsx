"use client"

import React, { useState, useEffect, useRef } from 'react';
import { GitCommit, Copy, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CopyButton from '@/components/CopyButton';
import axios from 'axios';
import { toast } from 'sonner';

interface CommitGeneratorProps {
    onBack: () => void;
}

export default function CommitGenerator({ onBack }: CommitGeneratorProps) {
    const [diffInput, setDiffInput] = useState("");
    const [tone, setTone] = useState<"conventional" | "emoji" | "minimalist">("conventional");
    const [loading, setLoading] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState("");
    const [elapsedTime, setElapsedTime] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (loading) {
            setElapsedTime(0);
            intervalId = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [loading]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const formatTime = (time: number): string => {
        const mins = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, "0")}`;
    };

    const handleGenerate = async () => {
        if (!diffInput.trim()) {
            toast.error("Please provide a diff or describe your changes.");
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setGeneratedMessage("");

        const systemConfig = `You are an expert git semantic commit message engine. Your task is to output a single, professionally formatted commit message based on the user's input.

CRITICAL INSTRUCTIONS:
- First, inspect the user's input. If it is a raw 'git diff', analyze the changed lines, file paths, and function names to extract precise technical context.
- DO NOT generate generic, lazy commit messages like 'feat: update config' or 'fix: fix error'. Be descriptive and specific about WHAT changed and WHERE (e.g., 'feat(config): integrate next-auth session variables in next.config.ts').
- IMPACT RANKING (PRIORITIZE LARGE CHANGES): Analyze the scale of modifications. Newly created files, pages, or components with substantial lines of code are HIGH impact and MUST be featured in the commit message header or primary bullets. Small changes in config files (like package.json, next.config, eslint, or lockfiles) are LOW impact and should only be mentioned as secondary bullets or omitted entirely. Never let minor config edits dominate if new features/files were introduced.
- PRIMARY FEATURE HIERARCHY: Identify the single most important user-facing feature, page, or component being introduced. This primary change MUST be the subject line header. Group config/dependencies modifications as secondary bullet points.
- INTELLIGENT CONTEXT ANALYSIS: When analyzing file additions or modifications, do not just list that a file or folder was added/edited. Read the code changes to determine its purpose. State clearly what feature, design, module, or component the file implements (e.g. 'feat(ui): implement CopyButton component for reusable clipboard actions' instead of 'add CopyButton.tsx'). Explain the purpose and the 'why' of the modifications.
- Format the commit message using the requested style:
  - If tone is 'conventional': Follow Conventional Commits specification. Structure: <type>(<scope>): <short description> followed by detailed bullet points explaining the changes. Do NOT use emojis.
  - If tone is 'emoji': Same as conventional, but prepend a relevant Gitmoji icon to the header.
  - If tone is 'minimalist': Output a strictly single-line, direct, descriptive message (no scope, no bullets).

CRITICAL LENGTH RULES:
- Target length: Keep the message precisely 2 to 3 lines long total (including header, blank line, and body bullet points).
- Keep descriptions brief but technically accurate, specifying the exact changes made.

Rules:
- Output EXACTLY one commit message.
- DO NOT wrap the output in markdown code blocks (\`\`\`), and do not write introduction or outro remarks.`;

        const userPrompt = `Selected Tone Style: ${tone}\n\nUser Input (Git Diff or Summary):\n${diffInput.trim()}`;

        try {
            const response = await axios.post("/api/grok", {
                systemConfig,
                userPrompt,
                model: userPrompt.length < 12000 ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile"
            }, {
                signal: controller.signal
            });

            if (response.data.success) {
                setGeneratedMessage(response.data.data);
                toast.success("Commit message generated successfully!");
            } else {
                toast.error(response.data.error || "Failed to generate commit message");
            }
        } catch (error: any) {
            if (axios.isCancel(error)) {
                console.log("Request aborted.");
                return;
            }
            toast.error(error.response?.data?.error || error.message || "Failed to generate commit message");
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-[calc(100vh-80px)] shrink-0 grid grid-cols-2 gap-4 overflow-hidden">
            <div className='relative flex flex-col h-full w-full overflow-hidden pb-24'>
                <div className='grow overflow-y-auto flex flex-col gap-4 pr-2 pb-6'>
                    <div className='pb-2 border-b border-b-border-soft select-none'>
                        <h2 className='text-text text-sm font-mono'>DIFF_INPUT_BUFFER</h2>
                    </div>

                    <div className='flex flex-col gap-2.5 bg-card border border-border-soft rounded-xl p-4 w-full select-none shadow-sm'>
                        <div className="flex items-center justify-between px-1">
                            <p className='text-[10px] text-text-muted font-mono uppercase tracking-wider'>Smart input parser</p>
                            <span className="text-[9px] font-mono text-accent bg-accent-soft px-1.5 py-0.5 rounded-sm uppercase font-semibold">Diff or Text</span>
                        </div>
                        <p className="text-[10px] text-text-muted leading-relaxed px-1">
                            Copy your local changes to clipboard using the helper commands below and paste the diff here, or simply describe your modifications in plain English.
                        </p>
                        <textarea
                            id="diffinput"
                            value={diffInput}
                            onChange={(e) => setDiffInput(e.target.value)}
                            placeholder="Paste raw git diff or type a quick list of changes..."
                            className="w-full min-h-[180px] p-4 bg-surface border border-border-soft rounded-lg text-xs font-mono text-text outline-none focus:border-accent transition duration-200 resize-none leading-relaxed"
                        />
                    </div>

                    <div className="flex flex-col gap-2 p-3 bg-surface/40 border border-border-soft rounded-lg select-none">
                        <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                            <span>CLIPBOARD_PIPE_HELPER</span>
                            <span>Fetch your diff in 1 click</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="flex items-center justify-between p-2 bg-elevated border border-border-soft rounded-md">
                                <div className="flex items-center min-w-0">
                                    <span className="shrink-0 px-1.5 py-0.5 rounded-sm bg-accent-soft/30 border border-accent/20 text-accent text-[8px] font-mono font-semibold mr-1.5 uppercase select-none">Win</span>
                                    <span className="truncate text-text-secondary select-all">git diff | Set-Clipboard</span>
                                </div>
                                <CopyButton 
                                    text="git diff | Set-Clipboard" 
                                    successMessage="Windows command copied!"
                                    iconOnly
                                    className="px-1 py-1 bg-transparent border-none hover:bg-transparent text-text-muted hover:text-text cursor-pointer"
                                />
                            </div>
                            <div className="flex items-center justify-between p-2 bg-elevated border border-border-soft rounded-md">
                                <div className="flex items-center min-w-0">
                                    <span className="shrink-0 px-1.5 py-0.5 rounded-sm bg-elevated border border-border text-text-muted text-[8px] font-mono font-semibold mr-1.5 uppercase select-none">Mac</span>
                                    <span className="truncate text-text-secondary select-all">git diff | pbcopy</span>
                                </div>
                                <CopyButton 
                                    text="git diff | pbcopy" 
                                    successMessage="Mac/Linux command copied!"
                                    iconOnly
                                    className="px-1 py-1 bg-transparent border-none hover:bg-transparent text-text-muted hover:text-text cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 bg-card border border-border-soft rounded-xl p-4 shadow-sm w-full select-none">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-mono text-text-muted uppercase tracking-wider">Output Tone Style</label>
                            <span className="text-[9px] font-mono text-accent bg-accent-soft px-1.5 py-0.5 rounded-sm uppercase font-semibold">Semantic</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-surface p-1 border border-border-soft rounded-lg relative overflow-hidden">
                            {(['conventional', 'emoji', 'minimalist'] as const).map((style) => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => setTone(style)}
                                    className={`relative z-10 text-[10px] font-mono py-2 text-center transition-all duration-200 ease-in-out cursor-pointer rounded-md border outline-none ${
                                        tone === style 
                                            ? "text-accent bg-accent-soft/20 border-accent/30 font-semibold" 
                                            : "text-text-muted border-transparent hover:text-text hover:bg-surface/50"
                                    }`}
                                >
                                    {style.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black via-black/95 to-transparent pt-10 pb-4 z-20 w-full flex flex-col gap-2">
                    <div className="relative w-full">
                        <div className="relative overflow-visible h-0 w-full">
                            <AnimatePresence>
                                {loading && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: -30, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        className='absolute top-0 left-2 z-10 h-8 flex items-center justify-center pl-3 pr-6 select-none'
                                        style={{
                                            clipPath: 'polygon(0 0, 100% 0, calc(100% - 9px) 100%, 0 100%)'
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-border-soft -z-20" />
                                        <div 
                                            className="absolute top-[1.5px] left-[1.5px] right-[1.5px] bottom-0 bg-surface rounded-tl-md -z-10"
                                            style={{
                                                clipPath: 'polygon(0 0, 100% 0, calc(100% - 9px) 100%, 0 100%)'
                                            }}
                                        />
                                        <span className="relative z-20 flex items-center gap-1.5 font-mono text-[10px] text-accent font-semibold tracking-wide">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                                            </span>
                                            ELAPSED_TIME: {formatTime(elapsedTime)} min
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading}
                            className="relative z-20 w-full bg-text text-background font-semibold py-2.5 rounded-lg hover:bg-text-secondary transition duration-200 cursor-pointer shadow-md select-none text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none outline-none"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Generate Commit Message
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-text-muted select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        <span>
                            Active Engine: Groq {diffInput.trim().length < 12000 ? "Llama 3.1 8B" : "Llama 3.3 70B"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative flex flex-col h-full w-full bg-card border border-border-soft rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-surface/80 border-b border-b-border-soft select-none">
                    <div className="flex items-center gap-1.5 w-1/4">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>

                    <div className="flex items-center justify-center bg-elevated border border-border-soft rounded-md px-3 py-1 text-[9px] font-mono text-text-muted w-2/5 gap-1.5 shadow-inner">
                        <span className="w-1 h-1 rounded-full bg-success/80" />
                        <span className="truncate">devtoolkit.ai/workspace/git-commit.txt</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 w-1/4">
                        {generatedMessage && !loading && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 border border-success/20 rounded-md text-[9px] font-mono text-success font-semibold select-none">
                                <Check size={10} strokeWidth={3} />
                                GENERATED
                            </span>
                        )}
                    </div>
                </div>

                <div className="grow p-6 overflow-y-auto select-text font-mono text-xs text-text-secondary leading-relaxed bg-surface/30">
                    {generatedMessage ? (
                        <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">{generatedMessage}</pre>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-text-muted select-none my-12">
                            <GitCommit size={32} className="opacity-40 mb-3" />
                            <p className="text-xs font-mono">Awaiting input changes...</p>
                            <p className="text-[10px] opacity-60 mt-1 max-w-xs font-sans">Paste a git diff or describe your changes to generate a semantic commit message.</p>
                        </div>
                    )}
                </div>

                {generatedMessage && (
                    <div className="p-4 border-t border-t-border-soft bg-surface/80 flex gap-3 select-none">
                        <CopyButton 
                            text={generatedMessage} 
                            label="Copy Message" 
                            successMessage="Commit message copied!"
                            className="grow bg-text text-background font-semibold py-2 rounded-lg hover:bg-text-secondary transition duration-200 cursor-pointer shadow-md text-xs tracking-wide flex items-center justify-center gap-1.5 border-none outline-none"
                        />
                        <CopyButton 
                            text={`git commit -m "${generatedMessage.replace(/"/g, '\\"')}"`} 
                            label="Copy Git Command" 
                            successMessage="Git command copied!"
                            className="grow bg-elevated text-text border border-border-soft font-semibold py-2 rounded-lg hover:bg-surface transition duration-200 cursor-pointer shadow-md text-xs tracking-wide flex items-center justify-center gap-1.5 outline-none"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
