"use client"

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonProps {
    text: string;
    label?: string;
    iconOnly?: boolean;
    className?: string;
    successMessage?: string;
}

export default function CopyButton({ text, label, iconOnly = false, className = "", successMessage = "Copied to clipboard!" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(successMessage);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy text");
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-elevated border border-border-soft hover:bg-surface text-text-muted hover:text-text rounded-md text-[10px] font-mono transition duration-200 cursor-pointer outline-none ${className}`}
        >
            {copied ? (
                <>
                    <Check size={11} className="text-success" strokeWidth={3} />
                    {!iconOnly && <span>{label ? "COPIED" : "Copied"}</span>}
                </>
            ) : (
                <>
                    <Copy size={11} />
                    {!iconOnly && <span>{label || "Copy"}</span>}
                </>
            )}
        </button>
    );
}
