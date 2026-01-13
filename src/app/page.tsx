"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Clock, MoreHorizontal, Play, Tag, FolderOpen, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSettings } from "@/lib/contexts/settings-context";
import { useWorkflows } from "@/lib/contexts/workflow-context";
import { iconMap } from "@/lib/data";

// ...

function HomeContent() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder");
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  const { t } = useSettings();
  const { workflows, deleteWorkflow } = useWorkflows();

  let filteredWorkflows = workflows;

  if (folderId) {
    filteredWorkflows = filteredWorkflows.filter(w => w.tags.includes(folderId));
  }

  if (searchQuery) {
    filteredWorkflows = filteredWorkflows.filter(w =>
      w.title.toLowerCase().includes(searchQuery) ||
      w.tags.some(tag => tag.toLowerCase().includes(searchQuery.replace('#', '')))
    );
  }

  const folderName = folderId
    ? folderId.charAt(0).toUpperCase() + folderId.slice(1)
    : t.sidebar.dashboard;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            {folderId && (
              <>
                <Link href="/" className="hover:text-foreground transition-colors">{t.sidebar.dashboard}</Link>
                <span>/</span>
              </>
            )}
            <span className="flex items-center gap-1">
              {folderId && <FolderOpen className="w-3 h-3" />}
              {folderName}
            </span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {folderId ? `${folderName} Workflows` : "Recent Workflows"}
          </h2>
        </div>
      </div>

      {filteredWorkflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-2xl bg-white/5">
          <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No workflows found in this folder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <Link key={workflow.id} href={`/workflows/${workflow.id}`} className="group relative bg-card border border-white/5 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${workflow.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
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
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{workflow.title}</h3>
                <p className="text-sm text-muted-foreground mb-6 h-10 line-clamp-2">{workflow.description}</p>

                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  {workflow.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-secondary/50 text-secondary-foreground border border-white/5">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>2h ago</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                    View Details
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
