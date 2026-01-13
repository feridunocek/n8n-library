"use client";

import { Upload, FileJson, CheckCircle2 } from "lucide-react";
import { Modal } from "./modal";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useSettings } from "@/lib/contexts/settings-context";
import { useWorkflows } from "@/lib/contexts/workflow-context";
import { generateAIAnalysisAction } from "@/lib/actions";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { t } = useSettings();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/json" || droppedFile.name.toLowerCase().endsWith(".json")) {
                setFile(droppedFile);
                uploadFile(droppedFile);
            } else {
                alert(t.upload.errorFile);
            }
        }
    }, [t.upload.errorFile]);

    const { addWorkflow } = useWorkflows();
    const { aiProvider, language, geminiModel, hasOpenaiKey, hasGeminiKey, hasAnthropicKey } = useSettings();

    const hasActiveKey =
        (aiProvider === 'openai' && hasOpenaiKey) ||
        (aiProvider === 'gemini' && hasGeminiKey) ||
        (aiProvider === 'anthropic' && hasAnthropicKey);

    const uploadFile = async (fileToUpload: File) => {
        setIsUploading(true);

        if (!fileToUpload) {
            setIsUploading(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            try {
                const json = JSON.parse(content);

                // Real Analysis Logic
                const nodes = json.nodes || [];
                const nodeCount = nodes.length;

                // Identify Trigger
                const triggerNode = nodes.find((n: any) => n.type.toLowerCase().includes('trigger') || n.type.toLowerCase().includes('webhook')) || nodes[0];
                const triggerName = triggerNode ? (triggerNode.name || triggerNode.type.split('.').pop()) : "Manual Trigger";

                // Basic Steps
                const steps = nodes.slice(0, 5).map((n: any) => `Executes ${n.name} (${n.type.split('.').pop()})`);
                if (nodes.length > 5) steps.push(`...and ${nodes.length - 5} more steps.`);

                let aiData = null;
                // Only attempt AI if key is set
                if (hasActiveKey) {
                    try {
                        aiData = await generateAIAnalysisAction(json, aiProvider, language, geminiModel);
                    } catch (err: any) {
                        console.error("AI Analysis failed", err);
                        alert(`AI Analysis Failed: ${err.message}`);
                        // Fail gracefully, use defaults
                    }
                }

                // Default vs AI Data
                const finalDescription = aiData?.summary || `Imported workflow containing ${nodeCount} nodes. Triggered by ${triggerName}.`;
                const finalUseCases = aiData?.useCases || ["Imported Workflow", "Automation"];
                const finalTechFeatures = aiData?.technicalFeatures || (Array.from(new Set(nodes.map((n: any) => n.type.split('.').pop()))).slice(0, 4).map((t: any) => `Integrates with ${t}`));
                const finalSteps = aiData?.processSteps || steps;
                const finalTags = aiData?.hashtags || ["imported", "new", ...(aiData ? ["ai-analyzed"] : [])];

                // Simulate processing delay if AI didn't take long
                setTimeout(() => {
                    setIsUploading(false);
                    setIsSuccess(true);

                    addWorkflow({
                        title: json.name || fileToUpload.name.replace(".json", ""),
                        description: finalDescription,
                        tags: finalTags,
                        serviceNames: [],
                        color: "from-blue-500/20 to-blue-600/5",
                        details: {
                            summary: finalDescription,
                            nodeCount: nodeCount,
                            trigger: triggerName,
                            useCases: finalUseCases,
                            processSteps: finalSteps,
                            technicalFeatures: finalTechFeatures,
                            jsonContent: JSON.stringify(json, null, 2)
                        }
                    });

                    // Reset
                    setTimeout(() => {
                        onClose();
                        setFile(null);
                        setIsSuccess(false);
                    }, 1500);
                }, hasActiveKey ? 100 : 1500);

            } catch (error) {
                console.error("Invalid JSON", error);
                setIsUploading(false);
                alert("Invalid JSON file");
            }
        };

        reader.readAsText(fileToUpload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t.upload.title}>
            <div className="space-y-4">
                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center"
                        >
                            <CheckCircle2 className="w-8 h-8" />
                        </motion.div>
                        <div className="space-y-1">
                            <h4 className="text-xl font-medium text-green-500">{t.upload.success}</h4>
                            <p className="text-sm text-muted-foreground">{t.upload.processing}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`
                    relative group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300
                    ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/20"}
                `}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        <p className="text-sm text-muted-foreground">{t.upload.analyzing}</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`p-4 rounded-full bg-secondary mb-3 group-hover:bg-primary/20 transition-colors`}>
                                            <Upload className="w-8 h-8 text-primary" />
                                        </div>
                                        <p className="mb-2 text-sm text-foreground font-medium">
                                            <span className="font-semibold text-primary">{t.upload.clickToUpload}</span> {t.upload.dragDrop}
                                        </p>
                                        <p className="text-xs text-muted-foreground">JSON files only (N8N Workflows)</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                accept=".json"
                                disabled={isUploading}
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        const selectedFile = e.target.files[0];
                                        setFile(selectedFile);
                                        uploadFile(selectedFile);
                                    }
                                }}
                            />
                        </div>

                        {file && !isUploading && (
                            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                                <FileJson className="w-5 h-5 text-primary" />
                                <span className="text-sm truncate flex-1">{file.name}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}
