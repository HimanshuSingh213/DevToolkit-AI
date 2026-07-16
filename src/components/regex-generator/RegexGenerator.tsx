"use client"

import React, { useEffect, useRef, useState, useMemo } from 'react'
import CopyButton from '../CopyButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Regex } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { regexRequestSchema } from '@/validations/regex.validation';
import { toast } from 'sonner';

interface ExplanationItem {
    token: string;
    meaning: string;
}

interface TestCase {
    value: string;
    shouldMatch: boolean;
    description: string;
}

interface RegexData {
    regex: string;
    explaination: ExplanationItem[];
    testCases: TestCase[];
}


export default function RegexGenerator() {

    const [matchInput, setMatchInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState("");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [actualModel, setActualModel] = useState<string>("llama-3.1-8b-instant");
    const abortControllerRef = useRef<AbortController | null>(null);

    const [regexData, setRegexData] = useState<RegexData | null>(null);
    const [customTestValue, setCustomTestValue] = useState("");
    const [copiedRaw, setCopiedRaw] = useState(false);
    const [copiedLiteral, setCopiedLiteral] = useState(false);

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
        const validation = regexRequestSchema.safeParse({ matchInput });
        if(!validation.success){
            toast.error(validation.error.issues[0].message);
            return;
        }

        // abort any previous pending req if any
        if(abortControllerRef.current){
            abortControllerRef.current.abort();
        }

        
    }

    // const testRegexSafe = (pattern: string, value: string): boolean => {
    //     try {
    //         const reg = new RegExp(pattern);
    //         return reg.test(value);
    //     } catch (err) {
    //         return false;
    //     }
    // }

    // const testResults = useMemo(() => {
    //     if(!regexData) return [];

    //     return regexData.testCases.map((testCase) => {
    //         const isMatch = testRegexSafe(regexData.regex, testCase.value);
    //         return {
    //             ...testCase,
    //             isMatch,
    //             passed: isMatch === testCase.expected
    //         }
    //     })
    // }, [regexData]);

    return (
        <div className="w-full h-full min-h-0 shrink-0 grid grid-cols-2 gap-4 overflow-hidden">
            {/* input side */}
            <div className='relative flex flex-col h-full w-full overflow-hidden pb-24'>
                <div className='grow overflow-y-auto flex flex-col gap-4 pr-2 pb-6'>
                    <div className='pb-2 border-b border-b-border-soft select-none'>
                        <h2 className='text-text text-sm font-mono'>SPECIFICATION_PROMPT</h2>
                    </div>

                    <div className='flex flex-col gap-2.5 bg-card border border-border-soft rounded-xl p-4 w-full select-none shadow-sm'>
                        <div className="flex items-center justify-between px-1">
                            <p className='text-[10px] text-text-muted font-mono uppercase tracking-wider'>Match Expression Request</p>
                        </div>
                        <textarea
                            id="matchInput"
                            value={matchInput}
                            onChange={(e) => setMatchInput(e.target.value)}
                            placeholder="e.g. Validate standard strong password containing minimum 8 letters, 1 number, and 1 uppercase character."
                            className="w-full min-h-[180px] p-4 bg-surface border border-border-soft rounded-lg text-xs font-mono text-text outline-none focus:border-accent transition duration-200 resize-none leading-relaxed"
                        />
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
                            Active Engine: Groq {
                                actualModel === "llama-3.1-8b-instant" ? "Llama 3.1 8B" :
                                    actualModel === "meta-llama/llama-4-scout-17b-16e-instruct" ? "Llama 4 Scout" :
                                        actualModel === "groq/compound-mini" ? "Compound Mini" :
                                            actualModel === "groq/compound" ? "Compound 70B" :
                                                actualModel === "llama-3.3-70b-versatile" ? "Llama 3.3 70B" :
                                                    actualModel
                            }
                        </span>
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
                            <p className="text-xs font-mono text-accent animate-pulse mt-2 uppercase tracking-widest">Generating Regex...</p>
                            <p className="text-[10px] text-text-muted mt-1 max-w-xs font-sans">Compiling matching requirements and validation test suites...</p>
                        </div>
                    ) : generatedMessage ? (
                        <div className='flex flex-col items-center justify-center space-y-3'>
                            {/* Regex generator */}
                            <pre className="whitespace-pre-wrap select-all font-mono leading-relaxed text-accent bg-card rounded-md border border-border-soft p-4">{generatedMessage}</pre>

                            {/* Token breakdown */}
                            <div className='flex flex-col bg-card rounded-md border border-border-soft p-4 space-y-2'>
                                <h3 className='font-mono text-[10px] text-text-muted tracking-widest uppercase'>Token Breakdown</h3>
                                <div className='text-xs text-text-secondary'>
                                    {generatedMessage}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="grow flex flex-col items-center justify-center text-center text-text-muted select-none py-12">
                            <Regex size={32} className="opacity-40 mb-3" />
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
    )
}
