"use client";

import Link from "next/link";
import { ArrowRight, Clock, MoreHorizontal, LayoutGrid, List as ListIcon, Heart, Search, ArrowUpDown, Zap, Trash2 } from "lucide-react";
import { useSettings } from "@/lib/contexts/settings-context";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWorkflows } from "@/lib/contexts/workflow-context";
import { iconMap } from "@/lib/data";

type SortOption = "newest" | "oldest" | "az" | "za";
type ViewMode = "grid" | "list";

import { Suspense } from "react";

function WorkflowsContent() {
    const { t, language, favorites, toggleFavorite } = useSettings();
    const { workflows, deleteWorkflow } = useWorkflows();
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";

    const filteredWorkflows = useMemo(() => {
        let result = [...workflows];

        // Filter by Favorites
        if (showFavoritesOnly) {
            result = result.filter(w => favorites.includes(w.id));
        }

        // Filter by Search
        if (searchQuery) {
            result = result.filter(w =>
                w.title.toLowerCase().includes(searchQuery) ||
                w.description.toLowerCase().includes(searchQuery) ||
                w.tags.some(tag => tag.toLowerCase().includes(searchQuery.replace('#', '')))
            );
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case "newest": return b.id.localeCompare(a.id);
                case "oldest": return a.id.localeCompare(b.id);
                case "az": return a.title.localeCompare(b.title);
                case "za": return b.title.localeCompare(a.title);
                default: return 0;
            }
        });

        return result;
    }, [favorites, showFavoritesOnly, searchQuery, sortBy, workflows]); // Added workflows dependency

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {t.myWorkflows?.title || "My Workflows"}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">{filteredWorkflows.length} workflows found</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center p-1 bg-secondary/30 rounded-lg border border-white/5">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn("p-2 rounded-md transition-all", viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn("p-2 rounded-md transition-all", viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white")}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Favorites Toggle */}
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium",
                            showFavoritesOnly
                                ? "bg-red-500/10 border-red-500/50 text-red-500"
                                : "bg-secondary/30 border-white/5 text-muted-foreground hover:bg-secondary/50"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", showFavoritesOnly && "fill-current")} />
                        {t.myWorkflows?.favorites || "Favorites"}
                    </button>

                    {/* Sort Dropdown (Simulated) */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border border-white/5 rounded-lg text-sm text-muted-foreground hover:text-white transition-colors">
                            <ArrowUpDown className="w-4 h-4" />
                            <span>{t.myWorkflows?.sort || "Sort"}</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-20">
                            <button onClick={() => setSortBy("newest")} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-gray-300">Newest First</button>
                            <button onClick={() => setSortBy("oldest")} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-gray-300">Oldest First</button>
                            <button onClick={() => setSortBy("az")} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-gray-300">A-Z</button>
                            <button onClick={() => setSortBy("za")} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-gray-300">Z-A</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn(
                "grid gap-6",
                viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
                {filteredWorkflows.map((workflow) => (
                    <div key={workflow.id} className={cn(
                        "group relative bg-card border border-white/5 rounded-2xl hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden",
                        viewMode === "list" ? "p-4 flex items-center gap-6" : "p-6"
                    )}>
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", workflow.color)} />

                        {/* List View Layout */}
                        {viewMode === "list" ? (
                            <>
                                <div className="relative z-10 p-2 bg-secondary/50 rounded-lg">
                                    {workflow.serviceNames.slice(0, 1).map((serviceName, index) => {
                                        const Icon = iconMap[serviceName];
                                        return Icon ? <Icon key={index} className="w-6 h-6 text-primary" /> : null;
                                    })}
                                </div>
                                <div className="relative z-10 flex-1 min-w-0">
                                    <Link href={`/workflows/${workflow.id}`} className="hover:underline">
                                        <h3 className="text-lg font-semibold truncate hover:text-primary transition-colors">{workflow.title}</h3>
                                    </Link>
                                    <p className="text-sm text-muted-foreground truncate">{workflow.description}</p>
                                </div>
                                <div className="relative z-10 flex items-center gap-4">
                                    <button
                                        onClick={(e) => { e.preventDefault(); toggleFavorite(workflow.id); }}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <Heart className={cn("w-5 h-5 transition-colors", favorites.includes(workflow.id) ? "text-red-500 fill-current" : "text-muted-foreground")} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (confirm("Are you sure you want to delete this workflow?")) {
                                                deleteWorkflow(workflow.id);
                                            }
                                        }}
                                        className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                        title="Delete Workflow"
                                    >
                                        <Trash2 className="w-5 h-5 text-muted-foreground hover:text-red-500 transition-colors" />
                                    </button>
                                    <Link href={`/workflows/${workflow.id}`} className="px-4 py-2 bg-secondary/50 rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors">
                                        View
                                    </Link>
                                </div>
                            </>
                        ) : (
                            // Grid View Layout
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex -space-x-2">
                                        {workflow.serviceNames.map((serviceName, idx) => {
                                            const Icon = iconMap[serviceName];
                                            if (!Icon) return null;
                                            return (
                                                <div key={idx} className="w-8 h-8 rounded-full bg-background border border-white/10 flex items-center justify-center relative z-0 group-hover:z-10 transition-all">
                                                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (confirm("Are you sure you want to delete this workflow?")) {
                                                    deleteWorkflow(workflow.id);
                                                }
                                            }}
                                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100 duration-300"
                                            title="Delete Workflow"
                                        >
                                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); toggleFavorite(workflow.id); }}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors z-20"
                                        >
                                            <Heart className={cn("w-4 h-4 transition-colors", favorites.includes(workflow.id) ? "text-red-500 fill-current" : "text-muted-foreground")} />
                                        </button>
                                    </div>
                                </div>

                                <Link href={`/workflows/${workflow.id}`} className="block flex-1">
                                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{workflow.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{workflow.description}</p>

                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            <span>2h ago</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                            View Details
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function WorkflowsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WorkflowsContent />
        </Suspense>
    );
}
