"use client";

import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { UploadModal } from "../ui/upload-modal";
import { useSettings } from "@/lib/contexts/settings-context";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import { useWorkflows } from "@/lib/contexts/workflow-context";
import { useMemo } from "react";

import { Button } from "@/components/ui/button"; // Assuming Button component exists, or use HTML standard buttons
import Link from "next/link";
import { User } from "next-auth"; // Should import User type

export function Header({ user }: { user?: User }) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const { t } = useSettings();
    const { workflows } = useWorkflows();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const popularTags = useMemo(() => {
        const tagCounts: Record<string, number> = {};
        workflows.forEach(w => {
            w.tags.forEach(tag => {
                // Ensure tag format, assuming tags stored without # need it, or with it need cleaning
                // Based on previous code, they seem to be stored as just strings, maybe without #
                // Let's normalize: ensure they start with # for display if they are "hashtags"
                // But wait, the previous static list had #. The workflow tags might be just "automation".
                // Let's assume they are just strings. We'll add # for display if missing.
                const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
                tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
            });
        });

        return Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag);
    }, [workflows]);

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    const handleTagClick = (tag: string) => {
        // Tag search should probably just set the search term to include the tag
        // If searching hashtags specifically, ensure it starts with #
        const term = tag.startsWith('#') ? tag : `#${tag}`;
        handleSearch(term);
    };

    return (
        <>
            <header className="border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-30 flex flex-col justify-center px-6 py-3 gap-2">
                <div className="flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t.common.searchPlaceholder}
                            className="w-full bg-secondary/20 text-sm text-foreground pl-10 pr-4 py-2 rounded-lg border border-transparent focus:border-primary/50 focus:bg-secondary/40 focus:outline-none transition-all placeholder:text-muted-foreground"
                            onChange={(e) => handleSearch(e.target.value)}
                            defaultValue={searchParams.get('search')?.toString()}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <button
                                onClick={() => setIsUploadOpen(true)}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                {t.common.uploadJSON}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-md"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Popular Tags */}
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground font-medium">{t.common.popular}</span>
                    {popularTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className="px-2 py-0.5 rounded-full bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </header>

            <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
        </>
    );
}
