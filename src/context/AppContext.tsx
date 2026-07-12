"use client"

import { createContext, ReactNode, useContext, useState } from "react";

export type WindowType = 'hub' | 'readme' | 'commit' | 'explainer' | 'regex' | 'json';

interface AppContextType {
    activeWindow: WindowType;
    setActiveWindow: (window: WindowType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function ContextProvider({ children }: { children: ReactNode }) {

    const [activeWindow, setActiveWindow] = useState<WindowType>("hub");


    const value = {
        activeWindow,
        setActiveWindow
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export default function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within a ContextProvider");
    }
    return context;
}