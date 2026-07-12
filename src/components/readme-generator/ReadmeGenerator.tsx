"use client"

import React, { useState } from 'react';

export default function ReadmeGenerator() {

    const [isManual, setIsManual] = useState("github");


    return (
        <div className="w-full h-full shrink-0 grid grid-cols-2 gap-2">
            {/* Input Area */}
            <div className='flex flex-col gap-2 overflow-y-scroll w-full'>

                <h2 className='text-text text-sm font-mono pb-2 border-b border-b-border-soft'>Configuration_Schema</h2>

                {/* Source selection */}
                <div className='flex flex-col gap-2.5 bg-card border border-border-soft rounded-xl p-4 w-full select-none shadow-sm'>
                    <p className='text-xs text-text-muted font-mono uppercase tracking-wider px-1'>Source Engine</p>
                    <div className='relative p-1 grid grid-cols-2 w-full bg-surface border border-border-soft rounded-lg overflow-hidden'>
                        <button
                            onClick={() => setIsManual("github")}
                            className={`relative z-10 text-xs font-semibold tracking-wide py-2 text-center transition-colors duration-200 ease-in-out cursor-pointer rounded-md ${
                              isManual === "github" ? "text-text" : "text-text-muted hover:text-text-secondary"
                            }`}
                        >
                            Github Repository Link
                        </button>
                        <button
                            onClick={() => setIsManual("manual")}
                            className={`relative z-10 text-xs font-semibold tracking-wide py-2 text-center transition-colors duration-200 ease-in-out cursor-pointer rounded-md ${
                              isManual === "manual" ? "text-text" : "text-text-muted hover:text-text-secondary"
                            }`}
                        >
                            Manual Setup
                        </button>

                        {/* Sliding highlight pill */}
                        <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-md bg-elevated border border-border-soft shadow-sm shadow-black/80 transition-transform duration-300 ease-in-out ${
                          isManual === "manual" ? "translate-x-full" : "translate-x-0"
                        }`} />
                    </div>
                </div>
                {/* Generate Button Area */}
                <div className='fixed bottom-0 left-0'>

                </div>
            </div>

            {/* Output Area */}
            <div></div>
        </div>
    )
}
