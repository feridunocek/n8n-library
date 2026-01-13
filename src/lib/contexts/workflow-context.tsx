"use client";

import React, { createContext, useContext, useState, useOptimistic } from "react";
import { Workflow } from "@/lib/data";
import { createWorkflowAction, deleteWorkflowAction, updateWorkflowAction } from "@/lib/actions";

interface WorkflowContextType {
    workflows: Workflow[];
    addWorkflow: (workflow: any) => Promise<void>;
    updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<void>;
    deleteWorkflow: (id: string) => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({
    children,
    initialWorkflows = []
}: {
    children: React.ReactNode;
    initialWorkflows?: Workflow[]
}) {
    // optimistic UI could be added here, but for now simple state synced with server actions
    const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);

    const addWorkflow = async (workflowData: any) => {
        // Optimistic update
        const tempId = Math.random().toString();
        const newWorkflow: Workflow = {
            id: tempId,
            ...workflowData,
            createdAt: new Date(), // Mock dates
            updatedAt: new Date()
        };
        setWorkflows(prev => [newWorkflow, ...prev]);

        try {
            const created = await createWorkflowAction(workflowData);
            // Replace temp with real
            setWorkflows(prev => prev.map(w => w.id === tempId ? { ...w, id: created.id } : w));
        } catch (error) {
            console.error("Failed to create workflow", error);
            // Revert
            setWorkflows(prev => prev.filter(w => w.id !== tempId));
            alert("Failed to save workflow.");
        }
    };

    const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
        setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
        try {
            await updateWorkflowAction(id, updates);
        } catch (error) {
            console.error("Failed to update", error);
            // We should probably revert here too, or fetch fresh data
        }
    };

    const deleteWorkflow = async (id: string) => {
        const previous = workflows;
        setWorkflows(prev => prev.filter(w => w.id !== id));
        try {
            await deleteWorkflowAction(id);
        } catch (error) {
            console.error("Failed to delete", error);
            setWorkflows(previous);
        }
    };

    return (
        <WorkflowContext.Provider value={{ workflows, addWorkflow, updateWorkflow, deleteWorkflow }}>
            {children}
        </WorkflowContext.Provider>
    );
}

export function useWorkflows() {
    const context = useContext(WorkflowContext);
    if (context === undefined) {
        throw new Error("useWorkflows must be used within a WorkflowProvider");
    }
    return context;
}
