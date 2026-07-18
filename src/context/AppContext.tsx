"use client"

import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export type WindowType = 'hub' | 'readme' | 'commit' | 'explainer' | 'regex' | 'json';

interface AppContextType {
    activeWindow: WindowType;
    setActiveWindow: (window: WindowType) => void;
    dailyUsage: number;
    dailyLimit: number;
    fetchUsage: () => Promise<void>;
    updateUsage: (usage: { dailyUsage: number; dailyLimit?: number }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function ContextProvider({ children }: { children: ReactNode }) {

    const [activeWindow, setActiveWindow] = useState<WindowType>("hub");
    const [dailyUsage, setDailyUsage] = useState(0);
    const [dailyLimit, setDailyLimit] = useState(80);

    const fetchUsage = useCallback(async () => {
        try {
            const res = await axios.get("/api/usage");
            if (res.data.success) {
                const { dailyUsage: du, dailyLimit: dl } = res.data.data;
                setDailyUsage(du);
                setDailyLimit(dl);
            }
        } catch (err) {
            console.error("Failed to fetch rate limit usage:", err);
        }
    }, []);

    const updateUsage = useCallback((usage: { dailyUsage: number; dailyLimit?: number }) => {
        setDailyUsage(usage.dailyUsage);
        if (usage.dailyLimit !== undefined) setDailyLimit(usage.dailyLimit);
    }, []);

    useEffect(() => {
        fetchUsage();
    }, []);

    const value = {
        activeWindow,
        setActiveWindow,
        dailyUsage,
        dailyLimit,
        fetchUsage,
        updateUsage
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