"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Regex, Copy } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { regexRequestSchema } from '@/validations/regex.validation';
import { toast } from 'sonner';
import axios from 'axios';
import useApp from '@/context/AppContext';

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
    explanation: ExplanationItem[];
    testCases: TestCase[];
}


export default function RegexGenerator() {
    const { dailyUsage, dailyLimit, updateUsage, fetchUsage } = useApp();
    const isLimitExceeded = dailyUsage >= dailyLimit;

    const [matchInput, setMatchInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [actualModel, setActualModel] = useState<string>("llama-3.1-8b-instant");
    const abortControllerRef = useRef<AbortController | null>(null);

    const [regexData, setRegexData] = useState<RegexData | null>(null);
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

    const formatTime = useCallback((time: number): string => {
        const mins = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, "0")}`;
    }, []);

    const handleGenerate = useCallback(async () => {
        const validation = regexRequestSchema.safeParse({ matchInput });
        if (!validation.success) {
            toast.error(validation.error.issues[0].message);
            return;
        }

        // abort any previous pending req if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setRegexData(null);

        const systemConfig = `You are an expert Regular Expression (Regex) assistant. Your job is to output a strictly formatted JSON object containing a generated regex pattern, a        
  step-by-step breakdown explanation of the tokens, and exactly 4 comprehensive test cases representing acceptable and unacceptable inputs.

    The output MUST be a valid JSON object matching this exact schema:
    {
      "title": "A short, descriptive 3-6 word title in English of what this regex does (e.g., 'Email Address Validator')",
      "regex": "the regex string pattern (properly escaped for JSON, e.g. use double backslashes \\\\d)",
      "explanation": [
        { "token": "^", "meaning": "Asserts start of line" },
        { "token": "\\\\d{4}", "meaning": "Matches exactly 4 digits" }
      ],
      "testCases": [
        { "value": "test_value_1", "shouldMatch": true, "description": "matches standard format" },
        { "value": "test_value_2", "shouldMatch": false, "description": "fails due to missing digit prefix" }
      ]
    }

    Rules:
    - Focus heavily on the requested regex specifications.
    - Provide exactly 8 high-fidelity test cases, with a mix of valid (shouldMatch: true) and invalid (shouldMatch: false) inputs.
    - Output the result strictly in valid JSON format matching the schema above.`;

        const userPrompt = `Generate a regular expression for the following request:\n"${matchInput.trim()}"`;

        try {
            const res = await axios.post("/api/grok", {
                systemConfig,
                userPrompt
            }, { signal: controller.signal });

            if (res.data.success) {
                let parsed: any = null;
                const rawText = res.data.data.result.text.trim();

                try {
                    parsed = JSON.parse(rawText);
                } catch {
                    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
                    try {
                        parsed = JSON.parse(cleaned);
                    } catch {
                        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            try {
                                parsed = JSON.parse(jsonMatch[0]);
                            } catch {}
                        }
                    }
                }

                if (!parsed) {
                    toast.error("Failed to parse generated regex format. Please try again.");
                    return;
                }

                setRegexData(parsed);
                setActualModel(res.data.data.result.modelUsed);
                toast.success("Regex created successfully.");
                if (res.data.data.usage) {
                    updateUsage(res.data.data.usage);
                }
                
                const patternTitle = (parsed?.title || `Regex: ${parsed?.regex || "Pattern"}`).slice(0, 150);
                axios.post("/api/history", {
                    tool: "regex",
                    title: patternTitle,
                    output: res.data.data.result.text
                }).catch(() => {});
            }
            else {
                const apiError = res.data.error || "";
                if (apiError.toLowerCase().includes("too large") || apiError.toLowerCase().includes("413") || apiError.toLowerCase().includes("tpm") || apiError.toLowerCase().includes("tokens")) {
                    toast.error("The request is too large for the AI model. Please reduce the size of your input and try again.");
                } else if (apiError.toLowerCase().includes("rate limit") || apiError.toLowerCase().includes("429") || apiError.toLowerCase().includes("limit exceeded")) {
                    toast.error("API rate limit reached. Please wait a few seconds and try again.");
                } else {
                    toast.error("Failed to generate regex. Please try again.");
                }
            }
        } catch (err: any) {
            if (axios.isCancel(err)) {
                console.log("Request aborted.")
            }
            else {
                if (err.response?.status === 429) {
                    fetchUsage();
                }
                const serverError = err.response?.data?.error || err.message || "";
                if (serverError.toLowerCase().includes("too large") || serverError.toLowerCase().includes("413") || serverError.toLowerCase().includes("tpm") || serverError.toLowerCase().includes("tokens")) {
                    toast.error("The request is too large for the AI model. Please reduce the size of your input and try again.");
                } else if (serverError.toLowerCase().includes("rate limit") || serverError.toLowerCase().includes("429") || serverError.toLowerCase().includes("limit exceeded")) {
                    toast.error("API rate limit reached. Please wait a few seconds and try again.");
                } else {
                    toast.error("Failed to generate regex. Please try again.");
                }
            }
        }
        finally {
            setLoading(false);
        }
    }, [matchInput, fetchUsage, updateUsage]);

    const handleCopyRaw = useCallback(async () => {

        if (!regexData) return;

        try {
            await navigator.clipboard.writeText(regexData?.regex);
            setCopiedRaw(true);
            toast.success("Raw regex copied!");
            setTimeout(() => {
                setCopiedRaw(false)
            }, 2000);
        } catch (err) {
            toast.error("Failed to copy raw pattern.");
        }
    }, [regexData])

    const handleCopyLiteral = useCallback(async () => {

        if (!regexData) return;

        try {
            await navigator.clipboard.writeText(`/${regexData.regex}/`);
            setCopiedLiteral(true);
            toast.success("JS literal regex copied.");
            setTimeout(() => {
                setCopiedLiteral(false);
            }, 2000)
        } catch (err) {
            toast.error("Failed to copy JS literal pattern.")
        }
    }, [regexData])
    return (
        <div className="w-full h-full min-h-0 shrink-0 grid grid-cols-2 gap-4 overflow-hidden">
            {/* input side */}
            <div className='relative flex flex-col h-full w-full overflow-hidden pb-24'>
                <div className='grow overflow-y-auto flex flex-col gap-4 pr-2 pb-6'>

                    <h2 className='text-text text-sm font-mono pb-2 border-b border-b-divider select-none'>SPECIFICATION_PROMPT</h2>

                    <div className='flex flex-col gap-2.5 bg-card border border-border-soft rounded-xl p-4 w-full select-none shadow-sm'>
                        <div className="flex items-center justify-between px-1">
                            <p className='text-[10px] text-text-muted font-mono uppercase tracking-wider'>Match Expression Request</p>
                        </div>
                        <textarea
                            id="matchInput"
                            value={matchInput}
                            maxLength={1000}
                            onChange={(e) => setMatchInput(e.target.value)}
                            placeholder={`e.g. Validate standard strong password containing minimum 8 letters, 1 number, and 1 uppercase character.${"\n"}(max 1000 characters allowed)`}
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
                            disabled={loading || isLimitExceeded}
                            className="relative z-20 w-full bg-text text-background font-semibold py-2.5 rounded-lg hover:bg-text-secondary transition duration-200 cursor-pointer shadow-md select-none text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-none outline-none"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {isLimitExceeded ? "Daily Limit Exceeded" : "Generate Regex Pattern"}
                        </button>
                    </div>

                    <div className="flex items-center justify-between px-1 text-[10px] font-mono text-text-muted select-none">
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
                        {regexData && !loading && (
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
                    ) : regexData ? (
                        <div className="flex flex-col items-center w-full grow justify-start space-y-3">
                            <div className="flex flex-col w-full bg-card rounded-md border border-border-soft p-4 space-y-2">
                                <div className="flex items-center justify-between select-none w-full">
                                    <h3 className="font-mono text-[10px] text-text-secondary uppercase text-left tracking-widest">Regex</h3>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={handleCopyRaw}
                                            className="px-2 py-0.5 text-[9px] font-mono text-text bg-surface hover:bg-elevated border border-border-soft rounded-sm transition cursor-pointer select-none outline-none flex items-center gap-1"
                                        >
                                            {copiedRaw ? <Check size={8} className="text-success" /> : <Copy size={8} />}
                                            Raw
                                        </button>
                                        <button
                                            onClick={handleCopyLiteral}
                                            className="px-2 py-0.5 text-[9px] font-mono text-text bg-surface hover:bg-elevated border border-border-soft rounded-sm transition cursor-pointer select-none outline-none flex items-center gap-1"
                                        >
                                            {copiedLiteral ? <Check size={8} className="text-success" /> : <Copy size={8} />}
                                            JS Slashes
                                        </button>
                                    </div>
                                </div>
                                <pre className="whitespace-pre-wrap select-all text-accent text-sm mt-1">{regexData?.regex}</pre>
                            </div>

                            <div className="flex flex-col bg-card rounded-md border border-border-soft p-4 space-y-2 w-full">
                                <h3 className="font-mono text-[10px] text-text-muted tracking-widest uppercase text-left">Token Breakdown</h3>
                                <div className="text-xs text-text-secondary space-y-1">
                                    {regexData?.explanation?.map((item, idx) => (
                                        <p key={idx} className="font-mono text-[11px] text-left">
                                            <span className="text-accent font-semibold select-all">{item.token}</span> <span className="text-accent">{"-->"}</span> {item.meaning}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col bg-card rounded-md border border-border-soft p-4 space-y-2 w-full">
                                <h3 className="font-mono text-[10px] text-text-muted tracking-widest uppercase text-left">Preconfigured Test Suits</h3>
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {regexData?.testCases?.map((test, idx) => (
                                        <div key={idx} className="rounded-md bg-surface gap-3 p-2 border border-border-soft space-y-1 w-full">
                                            <div className="flex flex-row justify-between gap-3 items-center w-full">
                                                <p className="bg-elevated px-2 py-1 rounded-md text-[11px] text-text font-mono font-medium truncate">{test.value}</p>
                                                <span className={`text-[9px] uppercase px-1 py-0.5 font-medium tracking-wider rounded-md font-mono border ${test.shouldMatch
                                                        ? "bg-success-soft text-success border-success/20"
                                                        : "bg-error-soft text-error border-error/20"
                                                    }`}>{test.shouldMatch ? "MATCH" : "NO MATCH"}</span>
                                            </div>
                                            <p className="text-[10px] text-text-muted leading-relaxed select-none text-left pl-1">{test.description}</p>
                                        </div>
                                    ))}
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

            </div>
        </div>
    )
}
