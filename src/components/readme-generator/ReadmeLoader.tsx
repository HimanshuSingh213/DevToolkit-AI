"use client"

import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const loadingAnimations = [
    "https://lottie.host/3d664398-629f-4c08-b2a4-1c9541e11633/pF3yPJJDLZ.json",
    "https://lottie.host/626d7fe9-f1fc-44ab-b4e0-f79f3a004101/5Vd8XDn7FM.json",
    "https://lottie.host/493f91f9-03da-42b6-acc5-16f94544e57a/2KSIveVF0L.json",
    "https://lottie.host/fcdd39a6-f822-4e71-9f91-474435971a17/HUyABYNNFn.json",
    "https://lottie.host/b8c54851-6d08-49b1-ba63-19ad68f3ef2f/3fkeXUOIqg.json",
    "https://lottie.host/65669eca-e62f-4494-b845-32c30c0ffe1e/aAUdADcyEr.json"
];

const loadingStepsText = [
    "CONTEMPLATING ARCHITECTURAL COMPLEXITIES AND MODULE PATHS...",
    "REFRACTING NEURAL PATTERNS FOR OPTIMAL SCHEMA COHERENCE...",
    "INTERPRETING SYSTEM DESIGNS AND CORE METHODOLOGIES...",
    "SYNTHESIZING DENSE INTELLECTUAL SPECIFICATION ARTIFACTS...",
    "ALIGNING STYLES AGAINST COMPILATION HIGHLIGHT PARITY...",
    "CRYSTALLIZING RICH DOCUMENTATION PARADIGM SEGMENTS..."
];

const fancySubText = [
    "CONTEMPLATING...",
    "REFINING...",
    "PROCESSING...",
    "SYNTHESIZING...",
    "OPTIMIZING...",
    "CRYSTALLIZING..."
];

interface ReadmeLoaderProps {
    loading: boolean;
}

export default function ReadmeLoader({ loading }: ReadmeLoaderProps) {
    const [animationIndex, setAnimationIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading) {
            setAnimationIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setAnimationIndex((prev) => 
                (prev + 1) % loadingAnimations.length
            );
        }, 9000);

        return () => clearInterval(interval);
    }, [loading]);

    if (!loading) return null;
    if (!mounted) return <div className="w-full h-full flex items-center justify-center bg-surface" />;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-surface p-6 select-none">
            <div className="w-80 h-80 select-none pointer-events-none">
                {loadingAnimations.map((src, index) => (
                    <div 
                        key={index} 
                        className={index === animationIndex ? "block" : "hidden"}
                    >
                        <DotLottieReact
                            src={src}
                            loop
                            autoplay
                        />
                    </div>
                ))}
            </div>
            <div className="flex flex-col items-center gap-1.5 -mt-8">
                <p className="text-[10px] font-mono text-accent tracking-widest uppercase animate-pulse">
                    {fancySubText[animationIndex]}
                </p>
                <p className="text-xs font-mono text-text-secondary text-center max-w-[280px]">
                    {loadingStepsText[animationIndex]}
                </p>
            </div>
        </div>
    );
}
