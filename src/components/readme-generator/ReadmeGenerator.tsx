"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Folder, GitBranch, Loader2, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { codeToHtml } from 'shiki';
import ReadmeLoader from './ReadmeLoader';

export default function ReadmeGenerator() {
    const [isManual, setIsManual] = useState("github");
    const [githubUrl, setGithubUrl] = useState("");
    const [customInstructions, setCustomInstructions] = useState("");

    const [title, setTitle] = useState("");
    const [version, setVersion] = useState("v1.0.0 / alpha");
    const [description, setDescription] = useState("");
    const [techStack, setTechStack] = useState<string[]>(["Next.js", "TypeScript", "MongoDB", "Tailwind CSS", "Docker"]);
    const [tagInput, setTagInput] = useState("");
    const [tone, setTone] = useState("Developer-Focused");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const toneOptions = ["Developer-Focused", "User-Friendly", "Technical/Academic", "Minimalist"];
    const [contextEnhancer, setContextEnhancer] = useState("");

    const [loading, setLoading] = useState(false);
    const [outputReadme, setOutputReadme] = useState("");
    const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
    const [copied, setCopied] = useState(false);
    const [highlightedHtml, setHighlightedHtml] = useState("");
    const abortControllerRef = useRef<AbortController | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (loading) {
            setElapsedTime(0);
            interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1)
            }, 1000);
        }

        return () => clearInterval(interval)
    }, [loading])

    const formatTime = (time: number): string => {
        const mins = Math.floor(time / 60);
        const sec = Math.floor(time % 60);

        return `${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, "0")}`;
    }

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (!outputReadme) {
            setHighlightedHtml("");
            return;
        }

        const highlight = async () => {
            try {
                const html = await codeToHtml(outputReadme, {
                    lang: 'markdown',
                    theme: 'github-dark-high-contrast'
                });
                setHighlightedHtml(html);
            } catch (err) {
                console.error("Syntax highlight error:", err);
                setHighlightedHtml("");
            }
        };

        highlight();
    }, [outputReadme]);

    const CompileManualdata = () => {
        return `
[Project Attributes]
Title: ${title.trim()}
Version/Release: ${version.trim()}
Target Tone: ${tone}

[Description]
${description.trim()}

[Tech Stack]
${techStack.join(", ")}
        `.trim();
    };

    const parseGithubUrl = (url: string) => {
        const regex = /github\.com\/([^/]+)\/([^/]+)/;
        const match = url.match(regex);

        if (!match) return null;

        const owner = match[1];
        const repo = match[2].split("/")[0].replace(/\.git$/, '');

        let branch = 'main';
        const pathParts = match[2].split('/');

        if (pathParts[1] === 'tree' || pathParts[1] === 'blob') {
            branch = pathParts[2];
        }

        return { owner, repo, branch };
    }

    const repoInfo = useMemo(() => parseGithubUrl(githubUrl), [githubUrl]);

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = tagInput.trim();
            if (value && !techStack.includes(value)) {
                setTechStack([...techStack, value]);
            }
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTechStack(techStack.filter(tag => tag !== tagToRemove));
    };

    const handleCopyToClipboard = async () => {
        if (!outputReadme) return;
        try {
            await navigator.clipboard.writeText(outputReadme);
            setCopied(true);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy content.");
        }
    };

    const handleGenerate = async () => {
        if (isManual === 'github') {
            if (!githubUrl.trim()) {
                toast.error("Please enter a GitHub repository URL");
                return;
            }
            if (!repoInfo) {
                toast.error("Invalid GitHub URL format");
                return;
            }
        } else {
            if (!title.trim()) {
                toast.error("Project Title is required");
                return;
            }
            if (!description.trim()) {
                toast.error("Project Description is required");
                return;
            }
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);

        try {
            const requestBody = isManual === 'github'
                ? {
                    mode: "github",
                    githubUrl: githubUrl.trim(),
                    customInstructions: customInstructions.trim() || undefined
                }
                : {
                    mode: "manual",
                    manualData: CompileManualdata(),
                    customInstructions: contextEnhancer.trim() || undefined
                };

            const response = await axios.post("/api/gemini", requestBody, {
                signal: controller.signal
            });

            if (response.data.success) {
                setOutputReadme(response.data.data.readme);
                toast.success("README generated successfully!");
            } else {
                toast.error(response.data.error || "Failed to generate README");
            }
        } catch (error: any) {
            if (axios.isCancel(error)) {
                console.log("Generation request aborted.");
                return;
            }
            const errorMsg = error.response?.data?.error || error.message || "Failed to generate README";
            toast.error(errorMsg);
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full min-h-0 shrink-0 grid grid-cols-2 gap-4 overflow-hidden">
            {/* input side */}
            <div className='relative flex flex-col h-full w-full overflow-hidden pb-24'>
                <div className='flex-1 overflow-y-auto flex flex-col gap-4 pr-2 pb-6'>
                    <h2 className='text-text text-sm font-mono pb-2 border-b border-b-divider'>Configuration_Schema</h2>

                    <div className='flex flex-col gap-2.5 bg-card border border-border-soft rounded-xl p-4 w-full select-none shadow-sm'>
                        <p className='text-xs text-text-muted font-mono uppercase tracking-wider px-1'>Source Engine</p>
                        <div className='relative p-1 grid grid-cols-2 w-full bg-surface border border-border-soft rounded-lg overflow-hidden'>
                            <button
                                onClick={() => setIsManual("github")}
                                className={`relative z-10 text-xs font-semibold tracking-wide py-2 text-center transition-colors duration-200 ease-in-out cursor-pointer rounded-md ${isManual === "github" ? "text-text" : "text-text-muted hover:text-text-secondary"
                                    }`}
                            >
                                Github Repository Link
                            </button>
                            <button
                                onClick={() => setIsManual("manual")}
                                className={`relative z-10 text-xs font-semibold tracking-wide py-2 text-center transition-colors duration-200 ease-in-out cursor-pointer rounded-md ${isManual === "manual" ? "text-text" : "text-text-muted hover:text-text-secondary"
                                    }`}
                            >
                                Manual Setup
                            </button>

                            <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-md bg-elevated border border-border-soft shadow-sm shadow-black/80 transition-transform duration-300 ease-in-out ${isManual === "manual" ? "translate-x-full" : "translate-x-0"
                                }`} />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {isManual === "github" ? (
                            <motion.div
                                key="github-form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-4 w-full bg-card border border-border-soft rounded-xl p-4 shadow-sm"
                            >
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-mono text-text-muted uppercase tracking-wider">Github Repo URL</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. https://github.com/username/project"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        className="w-full px-3 py-2 bg-surface border border-border-soft rounded-lg text-text text-sm outline-none focus:outline-none focus:border-accent transition duration-200"
                                    />

                                    {repoInfo && (
                                        <div className="flex flex-row items-center gap-2 mt-2 px-1 text-[11px] font-mono text-text-muted select-none">
                                            <span className="flex items-center gap-1.5">
                                                <Folder size={12} className="text-text-muted" />
                                                Repo: <span className="text-text font-medium">{repoInfo.owner} / {repoInfo.repo}</span>
                                            </span>
                                            <span className="h-3 w-px bg-border-soft" />
                                            <span className="flex items-center gap-1.5">
                                                <GitBranch size={12} className="text-text-muted" />
                                                Branch: <span className="text-accent bg-accent-soft px-1.5 py-0.5 rounded-sm font-semibold">{repoInfo.branch}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-mono text-text-muted uppercase tracking-wider">Custom Focus (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. focus on auth and database setup"
                                        value={customInstructions}
                                        onChange={(e) => setCustomInstructions(e.target.value)}
                                        className="w-full px-3 py-2 bg-surface border border-border-soft rounded-lg text-text text-sm outline-none focus:outline-none focus:border-accent transition duration-200"
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="manual-form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-5 w-full bg-card border border-border-soft rounded-xl p-4 shadow-sm"
                            >
                                <div className="flex flex-col gap-3">
                                    <label className="text-xs font-mono text-text-muted uppercase tracking-wider px-1">Project Attributes</label>
                                    <div className="flex flex-row gap-3 w-full">
                                        <input
                                            type="text"
                                            placeholder="Project Title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-surface border border-border-soft rounded-lg text-text text-sm outline-none focus:outline-none focus:border-accent transition duration-200"
                                        />
                                        <input
                                            type="text"
                                            placeholder="v1.0.0 / alpha"
                                            value={version}
                                            onChange={(e) => setVersion(e.target.value)}
                                            className="w-[30%] px-3 py-2 bg-surface border border-border-soft rounded-lg text-text text-sm outline-none focus:outline-none focus:border-accent transition duration-200 text-center font-mono"
                                        />
                                    </div>
                                    <textarea
                                        placeholder="What critical problem does this tool solve? Describe the core value proposition, primary use case, and what makes this project essential for developers..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full min-h-[120px] px-3 py-2.5 bg-surface border border-border-soft rounded-lg text-text text-sm outline-none focus:outline-none focus:border-accent transition duration-200 resize-y leading-relaxed"
                                    />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-row justify-between items-center px-1">
                                        <label className="text-xs font-mono text-text-muted uppercase tracking-wider">Tech Stack</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="bg-surface border border-border-soft rounded-md px-3 py-1.5 text-xs text-text flex items-center gap-1.5 cursor-pointer font-medium hover:border-text-muted transition duration-200 outline-none select-none"
                                            >
                                                {tone}
                                                <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isDropdownOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={() => setIsDropdownOpen(false)}
                                                    />
                                                    <div className="absolute right-0 mt-1.5 w-44 bg-elevated border border-border-soft rounded-lg shadow-xl py-1 z-50 overflow-hidden select-none">
                                                        {toneOptions.map((option) => (
                                                            <button
                                                                key={option}
                                                                type="button"
                                                                onClick={() => {
                                                                    setTone(option);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-xs transition duration-150 cursor-pointer ${tone === option
                                                                    ? 'text-accent bg-accent-soft/20 font-semibold'
                                                                    : 'text-text-muted hover:text-text hover:bg-surface/50'
                                                                    }`}
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 p-2 bg-surface/30 border border-border-soft rounded-lg">
                                        <div className="flex flex-wrap gap-1.5">
                                            {techStack.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-elevated/40 border border-border-soft text-text select-none"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="text-text-muted hover:text-error transition cursor-pointer p-0.5 rounded hover:bg-elevated leading-none"
                                                    >
                                                        <X size={10} strokeWidth={3} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Add technology (press Enter)"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagInputKeyDown}
                                            className="w-full px-2 py-1.5 bg-surface border border-border-soft rounded-md text-text text-xs outline-none focus:outline-none focus:border-accent transition duration-200"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="text-xs font-mono text-text-muted uppercase tracking-wider px-1">Context Enhancer</label>
                                    <textarea
                                        placeholder="Provide custom guardrails here (e.g., Explain NextAuth environment requirements, focus details on Docker scripts, add a comparison table for similar tools...)"
                                        value={contextEnhancer}
                                        onChange={(e) => setContextEnhancer(e.target.value)}
                                        className="w-full min-h-[100px] px-3 py-2.5 bg-surface border border-border-soft rounded-lg text-text text-sm outline-none focus:outline-none focus:border-accent transition duration-200 resize-y leading-relaxed"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black via-black/95 to-transparent pt-10 pb-4 z-20 w-full flex flex-col gap-2">
                    <div className="relative w-full">
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
                                    {/* Border Backdrop */}
                                    <div className="absolute inset-0 bg-border-soft -z-20" />
                                    {/* Surface Background */}
                                    <div 
                                        className="absolute top-[1.5px] left-[1.5px] right-[1.5px] bottom-0 bg-surface rounded-tl-md -z-10"
                                        style={{
                                            clipPath: 'polygon(0 0, 100% 0, calc(100% - 9px) 100%, 0 100%)'
                                        }}
                                    />
                                    {/* Timer Text */}
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

                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading}
                            className="relative z-20 w-full bg-text text-background font-semibold py-2.5 rounded-lg hover:bg-text-secondary transition duration-200 cursor-pointer shadow-md select-none text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Generate README
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-text-muted select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        <span>Active Engines: Gemini 3.1 Flash Lite & Gemma 4</span>
                    </div>
                </div>
            </div>

            {/* output side */}
            <div className="relative flex flex-col h-full w-full bg-card border border-border-soft rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-surface/80 border-b border-b-border-soft select-none">
                    <div className="flex items-center gap-1.5 w-1/4">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>

                    <div className="flex items-center justify-center bg-elevated border border-border-soft rounded-md px-3 py-1 text-[9px] font-mono text-text-muted w-2/5 gap-1.5 shadow-inner">
                        <span className="w-1 h-1 rounded-full bg-success/80" />
                        <span className="truncate">devtoolkit.ai/workspace/readme-preview.md</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 w-[45%] shrink-0">
                        {outputReadme && !loading && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[9px] font-mono text-emerald-500 font-semibold select-none shadow-xs">
                                <Check size={10} strokeWidth={3} />
                                {formatTime(elapsedTime)}
                            </span>
                        )}
                        <div className="flex p-0.5 bg-elevated border border-border-soft rounded-lg">
                            <button
                                onClick={() => setActiveTab("preview")}
                                className={`px-2.5 py-1 text-[9px] font-semibold tracking-wide rounded-md transition cursor-pointer ${activeTab === "preview"
                                    ? "bg-surface text-text border border-border-soft shadow-sm"
                                    : "text-text-muted hover:text-text"
                                    }`}
                            >
                                Preview
                            </button>
                            <button
                                onClick={() => setActiveTab("raw")}
                                className={`px-2.5 py-1 text-[9px] font-semibold tracking-wide rounded-md transition cursor-pointer ${activeTab === "raw"
                                    ? "bg-surface text-text border border-border-soft shadow-sm"
                                    : "text-text-muted hover:text-text"
                                    }`}
                            >
                                Raw MD
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full p-4 overflow-hidden relative">
                    {outputReadme && (
                        <button
                            onClick={handleCopyToClipboard}
                            className="absolute top-6 right-6 z-10 text-text-muted hover:text-text p-2 bg-elevated border border-border-soft rounded-lg transition duration-150 flex items-center justify-center cursor-pointer outline-none shadow-md"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                    )}

                    {loading ? (
                        <ReadmeLoader loading={loading} />
                    ) : outputReadme ? (
                        <div className="w-full h-full overflow-hidden">
                            {activeTab === "preview" ? (
                                <div className="w-full bg-surface border border-border-soft rounded-lg p-6 select-text shadow-sm max-w-none text-left overflow-y-auto h-full markdown-body">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {outputReadme}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="w-full h-full bg-surface border border-border-soft rounded-lg p-4 text-xs font-mono select-text overflow-y-auto shiki-preview focus:border-border-soft">
                                    {highlightedHtml ? (
                                        <div
                                            className="shiki-code-wrap"
                                            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                                        />
                                    ) : (
                                        <pre className="text-text-muted whitespace-pre-wrap">{outputReadme}</pre>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-border-soft rounded-lg text-text-muted/60 p-6 text-center">
                            <Folder size={32} className="stroke-[1.5] mb-2 text-text-muted/30" />
                            <p className="text-xs font-mono">No document generated yet</p>
                            <p className="text-[10px] font-light text-text-muted/40 mt-1 max-w-[200px]">
                                Select a source and click generate to synthesize your project README.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
