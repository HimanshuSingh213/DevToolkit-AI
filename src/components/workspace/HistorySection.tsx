import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface HistoryItem {
    _id: string;
    tool: "readme" | "commit" | "regex" | "json";
    title: string;
    output: any;
    createdAt: string;
}

export default function HistorySection() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchHistory = useCallback(async (pageToLoad: number) => {
        if (pageToLoad === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const res = await axios.get(`/api/history?page=${pageToLoad}&limit=10`);
            if (res.data.success) {
                const { history: newHistory, hasMore: moreAvailable } = res.data.data;
                setHistory(prev => pageToLoad === 1 ? newHistory : [...prev, ...newHistory]);
                setHasMore(moreAvailable);
            }
        } catch (err) {
            toast.error("Failed to load history entries.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(1);
    }, [fetchHistory]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchHistory(nextPage);
    };

    const handleClearAll = async () => {
        try {
            const res = await axios.delete("/api/history");
            if (res.data.success) {
                setHistory([]);
                setHasMore(false);
                setPage(1);
                toast.success("Recent history cleared!");
            }
        } catch (err) {
            toast.error("Failed to clear history.");
        }
    };

    const handleCopy = async (id: string, output: any) => {
        try {
            const textToCopy = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
            await navigator.clipboard.writeText(textToCopy);
            setCopiedId(id);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            toast.error("Failed to copy content.");
        }
    };

    const formatHistoryDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const min = String(d.getUTCMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
    };

    const getToolBadge = (tool: string) => {
        switch (tool) {
            case "readme": return "README Generator";
            case "commit": return "Commit Message Generator";
            case "regex": return "Regex Generator";
            case "json": return "JSON Toolkit";
            default: return "Tool Output";
        }
    };

    // Render loading skeletons
    const renderSkeletons = (count: number) => {
        return Array.from({ length: count }).map((_, idx) => (
            <div 
                key={`skeleton-${idx}`}
                className="flex flex-row items-center justify-between p-4 bg-card animate-pulse border-b border-b-border-soft last:border-none"
            >
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-2 h-2 rounded-full bg-border-soft shrink-0" />
                    <div className="h-3 bg-border-soft rounded w-1/2 sm:w-2/3" />
                    <div className="h-2.5 bg-border-soft/60 rounded w-20 hidden sm:inline-block ml-2" />
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="h-4 bg-border-soft rounded w-28" />
                    <div className="h-4 bg-border-soft rounded w-4" />
                </div>
            </div>
        ));
    };

    if (loading && page === 1) {
        return (
            <div className="flex flex-col gap-4 mt-12 pb-16">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <h3 className="text-[10px] font-mono font-bold tracking-wider text-text-muted uppercase">RECENT HISTORY</h3>
                    </div>
                </div>
                <div className="bg-surface/50 border border-border-soft rounded-xl overflow-hidden shadow-lg shadow-black/30">
                    {renderSkeletons(3)}
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col gap-4 mt-12 pb-16">
                <div className="flex items-center justify-between select-none px-1">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <h3 className="text-[10px] font-mono font-bold tracking-wider text-text-muted uppercase">RECENT HISTORY</h3>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-10 px-4 bg-surface/30 border border-dashed border-border-soft rounded-xl text-center select-none shadow-sm">
                    <span className="text-xs font-mono text-text-muted">No recent generations found</span>
                    <span className="text-[10px] text-text-muted/50 mt-1.5 leading-relaxed">
                        Your generated READMEs, commit messages, and regex inputs will appear here automatically.
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 mt-12 pb-16">
            {/* Header row */}
            <div className="flex items-center justify-between select-none px-1">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <h3 className="text-[10px] font-mono font-bold tracking-wider text-text-muted uppercase">RECENT HISTORY</h3>
                </div>
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-error transition cursor-pointer font-mono border-none bg-transparent outline-none"
                >
                    <Trash2 size={12} />
                    Clear all
                </button>
            </div>

            {/* History Cards container */}
            <div className="bg-surface/50 border border-border-soft rounded-xl divide-y divide-border-soft overflow-hidden shadow-lg shadow-black/30">
                {history.map((item) => (
                    <div 
                        key={item._id}
                        className="flex flex-row items-center justify-between p-4 bg-card hover:bg-elevated/40 transition duration-200"
                    >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                            <span className="text-xs font-mono text-text truncate max-w-50 sm:max-w-lg">
                                {item.title}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted select-none whitespace-nowrap hidden sm:inline pl-2">
                                {formatHistoryDate(item.createdAt)}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-4">
                            <span className="px-2.5 py-0.5 rounded border border-border-soft bg-elevated/30 text-[10px] font-mono text-text-muted select-none">
                                {getToolBadge(item.tool)}
                            </span>
                            <button
                                onClick={() => handleCopy(item._id, item.output)}
                                className="text-text-muted hover:text-text cursor-pointer transition p-1 hover:bg-surface rounded border-none bg-transparent outline-none"
                            >
                                {copiedId === item._id ? (
                                    <Check size={14} className="text-success" />
                                ) : (
                                    <Copy size={14} />
                                )}
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Render more skeletons when paginating */}
                {loadingMore && renderSkeletons(2)}
            </div>

            {/* Pagination Controls */}
            {hasMore && !loadingMore && (
                <button
                    onClick={handleLoadMore}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border-soft bg-card text-xs font-mono text-text-muted hover:text-text hover:bg-elevated transition duration-200 cursor-pointer shadow-md select-none mt-2 outline-none"
                >
                    <RefreshCw size={12} className="animate-spin-slow" />
                    Show more
                </button>
            )}
        </div>
    );
}
