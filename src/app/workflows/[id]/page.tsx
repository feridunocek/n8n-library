"use client";

import { ArrowLeft, Download, Share2, Zap, Activity, Check, Plus, Trash2, Edit2, Copy } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSettings } from "@/lib/contexts/settings-context";
import { useWorkflows } from "@/lib/contexts/workflow-context";
import { cn } from "@/lib/utils";

export default function WorkflowDetailPage() {
    const params = useParams();
    const { t } = useSettings();
    const { workflows, updateWorkflow } = useWorkflows();
    const id = params.id as string;
    const initialWorkflow = workflows.find((w) => w.id === id);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState("");

    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [description, setDescription] = useState("");

    const [newTag, setNewTag] = useState("");
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        if (initialWorkflow) {
            setTitle(initialWorkflow.title);
            setDescription(initialWorkflow.description);
            setTags(initialWorkflow.tags);
        }
    }, [initialWorkflow]);

    if (!initialWorkflow) {
        return <div className="p-10 text-center">Workflow not found</div>;
    }

    // We use the initialWorkflow for display if not editing, but we rely on local state for the edit form
    // Ideally we should use the workflow from context for display to reflect updates immediately if other components change it
    const workflow = initialWorkflow;

    // Handlers
    const saveTitle = () => {
        setIsEditingTitle(false);
        updateWorkflow(id, { title });
    };

    const saveDesc = () => {
        setIsEditingDesc(false);
        updateWorkflow(id, { description });
    };

    const addTag = () => {
        if (newTag) {
            const updatedTags = [...tags, newTag];
            setTags(updatedTags);
            setNewTag("");
            setIsAddingTag(false);
            updateWorkflow(id, { tags: updatedTags });
        }
    };

    const removeTag = (tagToRemove: string) => {
        const updatedTags = tags.filter(tag => tag !== tagToRemove);
        setTags(updatedTags);
        updateWorkflow(id, { tags: updatedTags });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Back Button */}
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                {t.common.backToDashboard}
            </Link>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/5 pb-8">
                <div className="space-y-4 w-full max-w-2xl">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${workflow?.color} flex-shrink-0 mt-1`}>
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-2 flex-1">
                            {/* Editable Title */}
                            {isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="text-3xl font-bold bg-secondary/50 border border-primary/50 rounded px-2 py-1 w-full focus:outline-none"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                                    />
                                    <button onClick={saveTitle} className="p-2 bg-primary/20 hover:bg-primary/40 rounded text-primary">
                                        <Check className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <h1
                                    onClick={() => setIsEditingTitle(true)}
                                    className="text-3xl font-bold hover:bg-white/5 rounded px-2 -ml-2 py-1 cursor-pointer border border-transparent hover:border-white/10 transition-all flex items-center gap-4 group"
                                >
                                    {title}
                                    <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                </h1>
                            )}

                            {/* Editable Tags */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {tags.map((tag) => (
                                    <div key={tag} className="group relative">
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1 border border-white/5">
                                            #{tag}
                                        </span>
                                        <button
                                            onClick={() => removeTag(tag)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-2 h-2" />
                                        </button>
                                    </div>
                                ))}

                                {isAddingTag ? (
                                    <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                        <input
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            className="text-xs bg-secondary border border-primary/50 rounded-full px-2 py-0.5 w-20 focus:outline-none"
                                            placeholder="Tag..."
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                            onBlur={() => !newTag && setIsAddingTag(false)}
                                        />
                                        <button onClick={addTag} className="text-primary hover:text-white">
                                            <Check className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingTag(true)}
                                        className="text-xs px-2 py-1 rounded-full border border-dashed border-white/20 hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Tag
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Editable Description */}
                    {isEditingDesc ? (
                        <div className="space-y-2">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-secondary/30 border border-primary/50 rounded-lg p-3 text-lg text-muted-foreground focus:outline-none min-h-[100px]"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditingDesc(false)} className="px-3 py-1 text-sm text-gray-400 hover:text-white">Cancel</button>
                                <button onClick={saveDesc} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm flex items-center gap-2">
                                    <Check className="w-3 h-3" /> Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p
                            onClick={() => setIsEditingDesc(true)}
                            className="text-lg text-muted-foreground leading-relaxed hover:bg-white/5 rounded p-2 -ml-2 cursor-pointer border border-transparent hover:border-white/10 transition-all group"
                        >
                            {description}
                            <span className="inline-block ml-2 opacity-0 group-hover:opacity-100">
                                <Edit2 className="w-3 h-3 text-muted-foreground" />
                            </span>
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                        <Share2 className="w-4 h-4" />
                        {t.common.share}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-lg shadow-primary/20">
                        <Download className="w-4 h-4" />
                        {t.common.downloadJSON}
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Column: Process Flow */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-6">{t.workflow.processFlow}</h3>
                        <div className="space-y-8 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-3.5 top-2 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 to-transparent -z-10" />

                            {workflow?.details?.processSteps?.map((step, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                        {idx + 1}
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-gray-300 leading-relaxed">{step}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Technical Specs */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-sm font-semibold text-green-500 uppercase tracking-wider mb-6">{t.workflow.technicalFeatures}</h3>
                        <div className="space-y-3">
                            {workflow?.details?.technicalFeatures?.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-white/5 hover:border-green-500/30 transition-colors group">
                                    <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* JSON Viewer Section */}
            <div className="mt-12">
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-mono font-medium tracking-wider uppercase">{t.workflow.blueprint}</span>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-400 hover:text-white transition-colors">
                            <Copy className="w-3 h-3" />
                            <span className="uppercase">{t.common.copy}</span>
                        </button>
                    </div>
                    <div className="p-6 overflow-x-auto relative group max-h-[600px] overflow-y-auto">
                        {/* Syntax Highlighting Simulation */}
                        <pre className="font-mono text-sm text-blue-300 leading-relaxed whitespace-pre-wrap break-words">
                            <code>{workflow?.details?.jsonContent || "{}"}</code>
                        </pre>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f172a]/20 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
