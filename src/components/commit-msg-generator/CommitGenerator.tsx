"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GitCommit, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CopyButton from '@/components/CopyButton';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import axios from 'axios';
import { toast } from 'sonner';
import useApp from '@/context/AppContext';

const preprocessDiff = (diff: string): string => {
    if (!diff) return "";
    return diff
        .split(/^diff --git /m)
        .filter(file => !file.includes("package-lock.json") && !file.includes("pnpm-lock.yaml") && !file.includes("yarn.lock"))
        .join("\ndiff --git ");
};

export default function CommitGenerator() {
    const { dailyUsage, dailyLimit, updateUsage, fetchUsage } = useApp();
    const isLimitExceeded = dailyUsage >= dailyLimit;

    const [diffInput, setDiffInput] = useState("");
    const [tone, setTone] = useState<"conventional" | "emoji" | "minimalist">("conventional");
    const [loading, setLoading] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState("");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [actualModel, setActualModel] = useState<string>("llama-3.1-8b-instant");
    const abortControllerRef = useRef<AbortController | null>(null);

    const cleanedDiff = useMemo(() => preprocessDiff(diffInput), [diffInput]);

    useEffect(() => {
        const defaultModel = cleanedDiff.trim().length < 20000 ? "llama-3.1-8b-instant" : "groq/compound-mini";
        setActualModel(defaultModel);
    }, [cleanedDiff]);

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

        const systemConfig = `You are an expert git semantic commit message engine. Your task is to output a strictly formatted JSON object containing a short title and a conventional commit message based on the user's input.

    The output MUST be a valid JSON object matching this exact schema:
    {
      "title": "A short, descriptive 3-5 word summary in English of the changes (e.g. 'Implement OAuth Logins')",
      "commitMessage": "the conventional commit message generated based on the selected tone style"
    }

CRITICAL SEMANTIC COMMIT RULES (for the "commitMessage" value):
- GITHUB STANDARD CONVENTIONAL COMMITS: Use standard conventional commit types (e.g. 'feat' for new features, 'fix' for bug fixes, 'refactor' for code refactoring, 'docs' for documentation, 'chore' for build/dependencies, 'style' for formatting, 'perf' for performance).
- DEEP FILE-BY-FILE ANALYSIS: Carefully read every modified file and line in the provided git diff. Identify the exact technical actions taken in each file (e.g., 'enforce strict JSON output format', 'implement multi-stage parsing for AI responses', 'update fallback sequence'). Do NOT write vague or generic summaries.
- SINGLE SENTENCE FORMAT: The "commitMessage" must contain EXACTLY one single line of text (one sentence). Do NOT output multiple lines, bullet points, bodies, or footers.
- MULTIPLE CHANGES: Combine all distinct logical changes from the diff into a clear, comma-separated single sentence. Structure: <type>(<scope>): <precise change 1>, <precise change 2>, <precise change 3>.
- IMPERATIVE MOOD: Use present-tense, imperative mood for all actions (e.g., 'implement', 'refactor', 'fix', 'add' instead of 'implemented', 'refactored', 'fixed', 'added').
- TONE STYLES:
  - If tone is 'conventional': Output a strictly single-line conventional commit message starting with <type>(<scope>): followed by your comma-separated sentence. Do NOT use emojis.
  - If tone is 'emoji': Same as conventional, but prepend a relevant Gitmoji icon to the header.
  - If tone is 'minimalist': Output a strictly single-line, direct description without conventional prefix or scope (e.g., 'refactor commit and regex generators to enforce strict JSON output format, improve error handling for parsing responses').

- Output the result strictly in valid JSON format matching the schema above.`;

        const userPrompt = `Selected Tone Style: ${tone}\n\nUser Input (Git Diff or Summary):\n${cleanedDiff.trim()}`;
        const targetModel = "llama-3.3-70b-versatile";
        setActualModel(targetModel);

        try {
            const response = await axios.post("/api/grok", {
                systemConfig,
                userPrompt,
                model: targetModel
            }, {
                signal: controller.signal
            });

            if (response.data.success) {
                const rawText = response.data.data.result.text;
                let commitMessage = "";
                let historyTitle = "";

                let parsed: any = null;
                const trimmed = rawText.trim();

                try {
                    parsed = JSON.parse(trimmed);
                } catch {
                    const cleaned = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
                    try {
                        parsed = JSON.parse(cleaned);
                    } catch {
                        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            try {
                                parsed = JSON.parse(jsonMatch[0]);
                            } catch {}
                        }
                    }
                }

                if (parsed && typeof parsed === "object") {
                    commitMessage = parsed.commitMessage || rawText.trim();
                    historyTitle = parsed.title || commitMessage.split("\n")[0].trim();
                } else {
                    commitMessage = rawText.trim();
                    historyTitle = commitMessage.split("\n")[0].trim();
                }

                setGeneratedMessage(commitMessage);
                setActualModel(response.data.data.result.modelUsed);
                toast.success("Commit message generated successfully!");
                if (response.data.data.usage) {
                    updateUsage(response.data.data.usage);
                }
                
                // Save to history
                axios.post("/api/history", {
                    tool: "commit",
                    title: historyTitle.slice(0, 150),
                    output: commitMessage
                }).catch(() => {});
            } else {
                const apiError = response.data.error || "";
                if (apiError.toLowerCase().includes("too large") || apiError.toLowerCase().includes("413") || apiError.toLowerCase().includes("tpm") || apiError.toLowerCase().includes("tokens")) {
                    toast.error("The changes are too large for the AI model. Please reduce the size of your input and try again.");
                } else if (apiError.toLowerCase().includes("rate limit") || apiError.toLowerCase().includes("429") || apiError.toLowerCase().includes("limit exceeded")) {
                    toast.error("API rate limit reached. Please wait a few seconds and try again.");
                } else {
                    toast.error("Failed to generate commit message. Please try again.");
                }
            }
        } catch (error: any) {
            if (axios.isCancel(error)) {
                return;
            }
            if (error.response?.status === 429) {
                fetchUsage();
            }
            const serverError = error.response?.data?.error || error.message || "";
            if (serverError.toLowerCase().includes("too large") || serverError.toLowerCase().includes("413") || serverError.toLowerCase().includes("tpm") || serverError.toLowerCase().includes("tokens")) {
                toast.error("The changes are too large for the AI model. Please reduce the size of your input and try again.");
            } else if (serverError.toLowerCase().includes("rate limit") || serverError.toLowerCase().includes("429") || serverError.toLowerCase().includes("limit exceeded")) {
                toast.error("API rate limit reached. Please wait a few seconds and try again.");
            } else {
                toast.error("Failed to generate commit message. Please try again.");
            }
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full min-h-0 shrink-0 grid grid-cols-2 gap-4 overflow-hidden">
            <div className='relative flex flex-col h-full w-full overflow-hidden pb-24'>
                <div className='grow overflow-y-auto flex flex-col gap-4 pr-2 pb-6'>

                    <h2 className='text-text text-sm font-mono pb-2 border-b border-b-divider select-none'>DIFF_INPUT_BUFFER</h2>


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
                                    className={`relative z-10 text-[10px] font-mono py-2 text-center transition-all duration-200 ease-in-out cursor-pointer rounded-md border outline-none ${tone === style
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
                            disabled={loading || isLimitExceeded}
                            className="relative z-20 w-full bg-text text-background font-semibold py-2.5 rounded-lg hover:bg-text-secondary transition duration-200 cursor-pointer shadow-md select-none text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none outline-none"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {isLimitExceeded ? "Daily Limit Exceeded" : "Generate Commit Message"}
                        </button>
                    </div>

                    <div className="flex items-center justify-between px-1 text-[10px] font-mono text-text-muted select-none h-4">
                        {loading ? (
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                                <div className="w-24 h-2 bg-border-soft rounded-sm animate-pulse" />
                            </div>
                        ) : (
                            <>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    <span>
                                        Active Engine: Groq {
                                            actualModel === "llama-3.1-8b-instant" ? "Llama 3.1 8B" :
                                                actualModel === "meta-llama/llama-4-scout-17b-16e-instruct" ? "Llama 4 Scout" :
                                                    actualModel === "groq/compound-mini" ? "Compound Mini" :
                                                        actualModel === "groq/compound" ? "Compound 70B" :
                                                            actualModel === "llama-3.3-70b-versatile" ? "Llama 3.3 70B" :
                                                                actualModel
                                        }
                                    </span>
                                </span>
                                <span>
                                    Usage: {dailyUsage}/{dailyLimit} req today
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* output */}
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
                                {formatTime(elapsedTime)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grow min-h-0 p-6 overflow-y-auto select-text font-mono text-xs text-text-secondary leading-relaxed bg-surface/30">
                    {loading ? (
                        <div className="grow flex flex-col items-center justify-center text-center select-none py-12">
                            <div className="w-48 h-48 select-none pointer-events-none">
                                <DotLottieReact
                                    src="https://lottie.host/65669eca-e62f-4494-b845-32c30c0ffe1e/aAUdADcyEr.json"
                                    loop
                                    autoplay
                                />
                            </div>
                            <p className="text-xs font-mono text-accent animate-pulse mt-2 uppercase tracking-widest">Generating Message...</p>
                            <p className="text-[10px] text-text-muted mt-1 max-w-xs font-sans">Translating code adjustments into professional conventional syntax...</p>
                        </div>
                    ) : generatedMessage ? (
                        <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed">{generatedMessage}</pre>
                    ) : (
                        <div className="grow flex flex-col items-center justify-center text-center text-text-muted select-none py-12">
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
