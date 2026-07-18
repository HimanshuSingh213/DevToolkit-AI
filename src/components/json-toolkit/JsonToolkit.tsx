"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion';
import { Check, Copy, AlertTriangle, FileJson, ListTree, Braces, Play } from 'lucide-react';
import { toast } from 'sonner';
import JsonView from "@uiw/react-json-view";
import axios from 'axios';

const cursorDarkHighContrastTheme = {
    '--w-rjv-font-family': 'JetBrains Mono, Fira Code, monospace',
    '--w-rjv-background-color': 'transparent',
    '--w-rjv-color': '#D8DEE9',
    '--w-rjv-key-string': '#D6D6DD',
    '--w-rjv-line-color': '#2A2A2A',
    '--w-rjv-arrow-color': '#D8DEE9',
    '--w-rjv-edit-color': 'var(--w-rjv-color)',
    '--w-rjv-info-color': '#FFFFFF5C',
    '--w-rjv-update-color': '#83D6C5',
    '--w-rjv-copied-color': '#E394DC',
    '--w-rjv-copied-success-color': '#A3BE8C',
    '--w-rjv-curlybraces-color': '#D8DEE9',
    '--w-rjv-colon-color': '#D8DEE9',
    '--w-rjv-brackets-color': '#D8DEE9',
    '--w-rjv-quotes-color': 'transparent',
    '--w-rjv-quotes-string-color': 'var(--w-rjv-type-string-color)',
    '--w-rjv-type-string-color': '#E394DC',
    '--w-rjv-type-int-color': '#EBC88D',
    '--w-rjv-type-float-color': '#EBC88D',
    '--w-rjv-type-bigint-color': '#EBC88D',
    '--w-rjv-type-boolean-color': '#83D6C5',
    '--w-rjv-type-date-color': '#EBC88D',
    '--w-rjv-type-url-color': '#83D6C5',
    '--w-rjv-type-null-color': '#83D6C5',
    '--w-rjv-type-nan-color': '#83D6C5',
    '--w-rjv-type-undefined-color': '#FFFFFF5C'
};



export default function JsonToolkit() {
    const [jsonInput, setJsonInput] = useState("");
    const [activeMode, setActiveMode] = useState<'format' | 'minify' | 'validate'>('format');
    const [activeTab, setActiveTab] = useState<'pretty' | 'tree'>('pretty');
    
    const [processedOutput, setProcessedOutput] = useState("");
    const [parsedJson, setParsedJson] = useState<any>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isProcessed, setIsProcessed] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleProcess = useCallback(() => {
        setValidationError(null);
        setProcessedOutput("");
        setParsedJson(null);
        setIsProcessed(false);

        if (!jsonInput.trim()) {
            toast.error("Please enter a JSON object to process.");
            return;
        }

        try {
            const parsed = JSON.parse(jsonInput.trim());
            setParsedJson(parsed);

            if (activeMode === 'format') {
                const formatted = JSON.stringify(parsed, null, 2);
                setProcessedOutput(formatted);
                setIsProcessed(true);
                toast.success("JSON formatted successfully!");
                axios.post("/api/history", {
                    tool: "json",
                    title: "Formatted JSON payload",
                    output: formatted
                }).catch((err: any) => console.error("History tracking failed:", err));
            } else if (activeMode === 'minify') {
                const minified = JSON.stringify(parsed);
                setProcessedOutput(minified);
                setIsProcessed(true);
                toast.success("JSON minified successfully!");
                axios.post("/api/history", {
                    tool: "json",
                    title: "Minified JSON payload",
                    output: minified
                }).catch((err: any) => console.error("History tracking failed:", err));
            } else if (activeMode === 'validate') {
                setIsProcessed(true);
                toast.success("JSON is valid!");
                axios.post("/api/history", {
                    tool: "json",
                    title: "Validated JSON schema",
                    output: JSON.stringify(parsed, null, 2)
                }).catch((err: any) => console.error("History tracking failed:", err));
            }
        } catch (err: any) {
            setValidationError(err.message || "Invalid JSON syntax.");
            toast.error("JSON validation failed.");
        }
    }, [jsonInput, activeMode]);

    const handleCopy = useCallback(async () => {
        if (!processedOutput && !parsedJson) return;
        
        let textToCopy = processedOutput;
        if (activeMode === 'validate' && parsedJson) {
            textToCopy = JSON.stringify(parsedJson, null, 2);
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            toast.success("JSON copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy JSON.");
        }
    }, [processedOutput, parsedJson, activeMode]);

    const handleClear = useCallback(() => {
        setJsonInput("");
        setProcessedOutput("");
        setParsedJson(null);
        setValidationError(null);
        setIsProcessed(false);
    }, []);

    return (
        <div className="w-full h-full min-h-0 shrink-0 grid grid-cols-2 gap-4 overflow-hidden">

            {/* Input Side */}
            {/* Input and Controls */}
            <div className="relative flex flex-col h-full w-full overflow-hidden pb-24">
                <div className="grow overflow-y-auto flex flex-col gap-4 pr-2 pb-6">
                    <div className="pb-2 border-b border-b-border-soft select-none flex items-center justify-between">
                        <h2 className="text-text text-sm font-mono">SOURCE_JSON_OBJECT</h2>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex flex-col gap-2.5 bg-card border border-border-soft rounded-xl p-4 w-full select-none shadow-sm">
                        <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider px-1">Toolkit Mode</p>
                        <div className="grid grid-cols-3 gap-2 w-full">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => setActiveMode("format")}
                                className={`py-2 rounded-lg text-xs font-semibold border transition duration-200 cursor-pointer outline-none ${
                                    activeMode === "format"
                                        ? 'bg-accent/15 border-accent text-accent shadow-sm'
                                        : 'bg-surface border-border-soft text-text-muted hover:text-text hover:border-border'
                                }`}
                            >
                                Format
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => setActiveMode("minify")}
                                className={`py-2 rounded-lg text-xs font-semibold border transition duration-200 cursor-pointer outline-none ${
                                    activeMode === "minify"
                                        ? 'bg-accent/15 border-accent text-accent shadow-sm'
                                        : 'bg-surface border-border-soft text-text-muted hover:text-text hover:border-border'
                                }`}
                            >
                                Minify
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => setActiveMode("validate")}
                                className={`py-2 rounded-lg text-xs font-semibold border transition duration-200 cursor-pointer outline-none ${
                                    activeMode === "validate"
                                        ? 'bg-accent/15 border-accent text-accent shadow-sm'
                                        : 'bg-surface border-border-soft text-text-muted hover:text-text hover:border-border'
                                }`}
                            >
                                Validate
                            </motion.button>
                        </div>
                    </div>

                    {/* Input Text Area */}
                    <div className="flex flex-col gap-2.5 bg-card border border-border-soft rounded-xl p-4 w-full select-none shadow-sm">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Raw JSON Input</p>
                            <button 
                                onClick={handleClear}
                                className="text-[9px] font-mono text-text-muted hover:text-error transition cursor-pointer bg-transparent border-none outline-none"
                            >
                                Clear
                            </button>
                        </div>
                        <textarea
                            id="jsonInput"
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder={`Paste raw JSON string here... e.g. {"name": "toolkit", "active": true}`}
                            className="w-full min-h-[220px] p-4 bg-surface border border-border-soft rounded-lg text-xs font-mono text-text outline-none focus:border-accent transition duration-200 resize-none leading-relaxed"
                        />
                    </div>
                </div>

                {/* Bottom Action Section */}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black via-black/95 to-transparent pt-10 pb-4 z-20 w-full flex flex-col gap-2">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={handleProcess}
                        className="relative z-20 w-full bg-text text-background font-semibold py-2.5 rounded-lg hover:bg-text-secondary transition duration-200 cursor-pointer shadow-md select-none text-sm tracking-wide flex items-center justify-center gap-2 border-none outline-none"
                    >
                        <Play size={14} className="fill-current" />
                        Process JSON Object
                    </motion.button>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-text-muted select-none h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        <span>Client-Side Engine Active (No AI calls)</span>
                    </div>
                </div>
            </div>

            {/* Output side */}
            {/* Previews and Trees */}
            <div className="relative flex flex-col h-full w-full bg-card border border-border-soft rounded-xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-surface/80 border-b border-b-border-soft select-none">
                    <div className="flex items-center gap-1.5 w-1/4">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>

                    <div className="flex items-center justify-center bg-elevated border border-border-soft rounded-md px-3 py-1 text-[9px] font-mono text-text-muted w-2/5 gap-1.5 shadow-inner">
                        <span className="w-1 h-1 rounded-full bg-success/80" />
                        <span className="truncate">devtoolkit.ai/workspace/json-viewer.json</span>
                    </div>

                    <div className="flex items-center justify-end gap-2 w-1/4">
                        {isProcessed && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 border border-success/20 rounded-md text-[9px] font-mono text-success font-semibold select-none uppercase">
                                <Check size={10} strokeWidth={3} />
                                {activeMode}
                            </span>
                        )}
                        {validationError && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-error/10 border border-error/20 rounded-md text-[9px] font-mono text-error font-semibold select-none uppercase">
                                <AlertTriangle size={10} />
                                INVALID
                            </span>
                        )}
                    </div>
                </div>

                {/* View Toggles (Pretty View / Interactive Tree) */}
                {isProcessed && !validationError && activeMode !== 'minify' && (
                    <div className="p-3 bg-surface/50 border-b border-b-border-soft flex gap-2 select-none justify-start items-center">
                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider mr-2 pl-1">Output View:</span>
                        <div className="flex bg-surface border border-border-soft rounded-lg p-0.5 select-none">
                            <button
                                onClick={() => setActiveTab('pretty')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer border-none ${
                                    activeTab === 'pretty'
                                        ? 'bg-elevated text-text border border-border-soft shadow-sm shadow-black/80'
                                        : 'bg-transparent text-text-muted hover:text-text-secondary'
                                }`}
                            >
                                <Braces size={13} />
                                Pretty View
                            </button>
                            <button
                                onClick={() => setActiveTab('tree')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer border-none ${
                                    activeTab === 'tree'
                                        ? 'bg-elevated text-text border border-border-soft shadow-sm shadow-black/80'
                                        : 'bg-transparent text-text-muted hover:text-text-secondary'
                                }`}
                            >
                                <ListTree size={13} />
                                Interactive Tree
                            </button>
                        </div>
                    </div>
                )}

                {/* Content Output */}
                <div className="grow min-h-0 p-6 overflow-y-auto select-text font-mono text-xs text-text-secondary leading-relaxed bg-surface/30">
                    {validationError ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full flex flex-col items-center justify-center text-center select-none py-12"
                        >
                            <AlertTriangle size={32} className="text-error mb-3 animate-bounce" />
                            <p className="text-xs font-mono text-error uppercase tracking-widest font-semibold">JSON Validation Error</p>
                            <pre className="text-[10px] text-text-muted mt-2 max-w-md p-4 bg-card border border-border-soft rounded-lg text-left whitespace-pre-wrap select-all font-mono leading-relaxed">
                                {validationError}
                            </pre>
                        </motion.div>
                    ) : isProcessed ? (
                        activeMode === 'validate' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full flex flex-col items-center justify-center text-center select-none py-12"
                            >
                                <Check size={36} className="text-success mb-3 p-1.5 bg-success/15 border border-success/30 rounded-full" />
                                <p className="text-xs font-mono text-success uppercase tracking-widest font-semibold">Valid JSON Structure</p>
                                <p className="text-[10px] text-text-muted mt-1 max-w-xs font-sans">The input JSON conforms completely to standard syntactic rules.</p>
                            </motion.div>
                        ) : activeTab === 'tree' && parsedJson ? (
                            <motion.div
                                key="tree"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.15 }}
                                className="w-full text-left py-1"
                            >
                                <JsonView 
                                    value={parsedJson} 
                                    style={cursorDarkHighContrastTheme as React.CSSProperties}
                                    displayDataTypes={false}
                                    displayObjectSize={true}
                                    enableClipboard={false}
                                />
                            </motion.div>
                        ) : (
                            <motion.pre
                                key="pretty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.15 }}
                                className="whitespace-pre select-all text-text-secondary text-xs leading-relaxed text-left w-full font-mono"
                            >
                                {processedOutput}
                            </motion.pre>
                        )
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="grow h-full flex flex-col items-center justify-center text-center text-text-muted select-none py-12"
                        >
                            <FileJson size={32} className="opacity-40 mb-3" />
                            <p className="text-xs font-mono">Awaiting JSON object...</p>
                            <p className="text-[10px] opacity-60 mt-1 max-w-xs font-sans">
                                Paste your JSON string in the left column and click Process to inspect, minify, or format.
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* Footer Copy Buttons */}
                {isProcessed && !validationError && (
                    <div className="p-4 border-t border-t-border-soft bg-surface/80 flex gap-3 select-none">
                        <button
                            onClick={handleCopy}
                            className="grow bg-text text-background font-semibold py-2 rounded-lg hover:bg-text-secondary transition duration-200 cursor-pointer shadow-md text-xs tracking-wide flex items-center justify-center gap-1.5 border-none outline-none"
                        >
                            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                            {copied ? "Copied!" : "Copy Output"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
