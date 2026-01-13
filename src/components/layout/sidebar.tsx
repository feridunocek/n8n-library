"use client";

import Link from "next/link";
import { Folder, Home, Library, Settings, Command } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/contexts/settings-context";
import { useWorkflows } from "@/lib/contexts/workflow-context";

const FOLDER_DEFINITIONS = [
    { name: "HR Workflows", id: "hr" },
    { name: "Marketing", id: "marketing" },
    { name: "Sales", id: "sales" },
    { name: "DevOps", id: "devops" },
];

export function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeFolder = searchParams.get("folder");
    const { t } = useSettings();
    const { workflows } = useWorkflows();

    const navigation = [
        { name: t.sidebar.dashboard, href: "/", icon: Home, exact: true },
        { name: t.sidebar.myWorkflows, href: "/workflows", icon: Library },
        { name: t.sidebar.settings, href: "/settings", icon: Settings },
    ];

    const folders = FOLDER_DEFINITIONS.map(def => ({
        ...def,
        count: workflows.filter(w => w.tags.includes(def.id)).length
    }));

    return (
        <div className="flex flex-col h-screen w-64 bg-card border-r border-border p-4">
            <div className="flex items-center gap-2 px-2 py-6 mb-2">
                <div className="bg-primary/20 p-2 rounded-lg">
                    <Command className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    N8N Hub
                </h1>
            </div>

            <div className="space-y-1 mb-8">
                {navigation.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href && !activeFolder
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="mt-4">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {t.sidebar.folders}
                </h3>
                <div className="space-y-1">
                    {folders.map((folder) => {
                        const isActive = activeFolder === folder.id;
                        return (
                            <Link
                                key={folder.id}
                                href={`/?folder=${folder.id}`}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                                    isActive
                                        ? "bg-white/10 text-foreground"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Folder className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-gray-500 group-hover:text-primary")} />
                                    {folder.name}
                                </div>
                                <span className="text-xs text-gray-600 bg-gray-900/50 px-2 py-0.5 rounded-full" suppressHydrationWarning>
                                    {folder.count}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
