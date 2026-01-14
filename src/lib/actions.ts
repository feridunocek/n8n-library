'use server';

import { signIn, signOut } from '@/../auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma'; // We need a singleton Prisma client
import { Workflow } from '@/lib/data';
import { auth } from '@/../auth';
import { encrypt, decrypt } from '@/lib/encryption';

const bcrypt = require('bcryptjs');

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function registerUserAction(prevState: string | undefined, formData: FormData) {
    const user = Object.fromEntries(formData);
    const username = user.username as string;
    const password = user.password as string;

    if (!username || !password) return "Username and password required";

    try {
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return "Username already taken";

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                username,
                password: hashedPassword
            }
        });

        // Return success message or handle client-side redirect
        return "success";
    } catch (e) {
        console.error(e);
        return "Registration failed";
    }
}

export async function getWorkflowsAction() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const workflows = await prisma.workflow.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    });

    // Map database model to App Workflow type
    return workflows.map((w: any) => ({
        id: w.id, // String
        title: w.title,
        description: w.description,
        tags: w.tags,
        // Wait, the logic in 'data.ts' had serviceNames. I should update schema if I want them, or derive them.
        // For now returning empty or we need to fix the schema/mapping.
        // Let's re-check the schema I wrote. I didn't add serviceNames. I added features, useCases, process, json.
        // I will extract serviceNames from JSON if needed or just ignore.
        color: "from-blue-500/20 to-blue-600/5", // Default color, or store in DB? I didn't store color.
        // We can also parse w.json to fill gaps if we want perfectly compatible return
        ...parseWorkflowJson(w.json, w)
    }));
}

function parseWorkflowJson(json: any, dbRecord: any) {
    // Helper to fill UI fields from stored JSON if DB columns are missing
    const nodes = json.nodes || [];
    return {
        serviceNames: Array.from(new Set(nodes.map((n: any) => n.type.split('.').pop()))) as string[],
        details: {
            summary: dbRecord.description,
            nodeCount: nodes.length,
            trigger: "Manual/Webhook", // Simplified
            useCases: dbRecord.useCases,
            processSteps: dbRecord.process,
            technicalFeatures: dbRecord.features,
            jsonContent: JSON.stringify(json, null, 2)
        }
    };
}

export async function createWorkflowAction(workflow: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // workflow comes from UI.
    // We need to map it to DB schema.
    // Ensure we save JSON properly.
    const json = JSON.parse(workflow.details.jsonContent);

    return await prisma.workflow.create({
        data: {
            userId: session.user.id,
            title: workflow.title,
            description: workflow.description,
            tags: workflow.tags,
            useCases: workflow.details.useCases,
            process: workflow.details.processSteps,
            features: workflow.details.technicalFeatures,
            json: json
        }
    });
}

export async function updateWorkflowAction(id: string, updates: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Check ownership
    // const existing = await prisma.workflow.findUnique(...) 
    // For now assuming ID is enough and prisma where clause handles it if we include userId.

    // updates might be partial. 
    // Warning: Prisma update needs valid fields.
    const data: any = {};
    if (updates.title) data.title = updates.title;
    if (updates.description) data.description = updates.description;
    if (updates.tags) data.tags = updates.tags;

    return await prisma.workflow.updateMany({
        where: { id: id, userId: session.user.id },
        data: data
    });
}

export async function deleteWorkflowAction(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    return await prisma.workflow.deleteMany({
        where: { id: id, userId: session.user.id }
    });
}

// --- API Key Management ---

export async function saveApiKeyAction(provider: string, key: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { iv, encryptedData } = encrypt(key);

    await prisma.apiKey.upsert({
        where: {
            userId_provider: {
                userId: session.user.id,
                provider: provider
            }
        },
        update: {
            key: encryptedData,
            iv: iv
        },
        create: {
            userId: session.user.id,
            provider: provider,
            key: encryptedData,
            iv: iv
        }
    });

    return { success: true };
}

export async function hasApiKeyAction(provider: string) {
    const session = await auth();
    if (!session?.user?.id) return false;

    // Check if key exists (don't return it)
    const count = await prisma.apiKey.count({
        where: { userId: session.user.id, provider }
    });
    return count > 0;
}

// --- AI Analysis ---

export async function generateAIAnalysisAction(workflowJson: any, provider: 'openai' | 'anthropic' | 'gemini', lang: string, model?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Fetch Key
    const apiKeyRecord = await prisma.apiKey.findUnique({
        where: {
            userId_provider: {
                userId: session.user.id,
                provider: provider
            }
        }
    });

    if (!apiKeyRecord) {
        throw new Error(`No API Key found for ${provider}`);
    }

    const key = decrypt({
        iv: apiKeyRecord.iv,
        encryptedData: apiKeyRecord.key
    });

    const langName = lang === 'tr' ? 'Turkish' : 'English';
    const selectedGeminiModel = model || "models/gemini-1.5-flash"; // Default

    // Fetch User for Custom Prompt
    const userRecord = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    // Default Prompt
    let promptToUse = `You are an expert N8N workflow architect and analyst. 
    Analyze the provided N8N workflow JSON in depth. 
    
    CRITICAL RULES:
    1. Your output must be STRICTLY in ${langName} language. Do NOT write in English unless English is requested.
    2. IGNORE any existing 'description' or 'message' fields in the JSON. Do not copy them. Write a new analysis from scratch.
    3. Be highly technical yet clear.
    
    Return ONLY a JSON object with this exact structure: 
    { 
        "summary": "string", 
        "useCases": ["string"], 
        "technicalFeatures": ["string"],
        "processSteps": ["string"],
        "hashtags": ["string"]
    }

    Analysis Requirements:
    1. "summary": A detailed technical paragraph (minimum 4-5 sentences, ~100 words). Explain the FULL logic flow: Trigger -> Processing -> Outcome. Do not just summarize; explain 'how' it works.
    2. "processSteps": 5-10 detailed steps. Each step must explain the data transformation occurring.
    3. "technicalFeatures": List 4-6 specific N8N nodes or patterns used (e.g., 'JSON Data Transformation', 'Merge Node (Wait Mode)', 'Error Trigger').
    4. "useCases": 3 real-world business scenarios.
    5. "hashtags": Generate at least 6 relevant technical hashtags (e.g. #automation, #marketing, #email, #webhook, #api).
    `;

    // Override if custom prompt exists
    if (userRecord?.customPrompt && userRecord.customPrompt.trim().length > 10) {
        promptToUse = userRecord.customPrompt + `
        
        IMPORTANT: Your output MUST be a valid JSON object with the following structure:
        { 
            "summary": "string", 
            "useCases": ["string"], 
            "technicalFeatures": ["string"],
            "processSteps": ["string"],
            "hashtags": ["string"]
        }
        Do not wrap in markdown code blocks. Just raw JSON.
        `;
    }

    const systemPrompt = promptToUse;

    const userContent = JSON.stringify(workflowJson).substring(0, 25000);

    try {
        let response;
        let data;
        let content = "";

        if (provider === 'openai') {
            response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{
                        role: "system",
                        content: systemPrompt
                    }, {
                        role: "user",
                        content: userContent
                    }]
                })
            });
        } else if (provider === 'anthropic') {
            response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20240620",
                    max_tokens: 1024,
                    messages: [{ role: "user", content: `${systemPrompt}\n\nTasks:\n${userContent}` }]
                })
            });
        } else if (provider === 'gemini') {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedGeminiModel}:generateContent?key=${key}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ],
                    contents: [{
                        parts: [{
                            text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nUSER DATA TO ANALYZE:\n${userContent}`
                        }]
                    }]
                })
            });
        }

        if (response && response.ok) {
            data = await response.json();

            if (provider === 'openai') {
                content = data.choices[0].message.content;
            } else if (provider === 'anthropic') {
                content = data.content[0].text;
            } else if (provider === 'gemini') {
                content = data.candidates[0].content.parts[0].text;
            }

            const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanJson);
        } else {
            const errorText = await response?.text();
            if (response?.status === 429 || errorText?.includes("Quota exceeded")) {
                throw new Error("Quota Exceeded (Limit Aşıldı). Try another provider.");
            }
            throw new Error(`AI Provider Error (${provider}): ${response?.statusText} - ${errorText}`);
        }
    } catch (error: any) {
        console.error("AI Action Failed", error);
        throw new Error(error.message || "AI Analysis Failed");
    }
}

export async function testConnectionAction(provider: string, key: string) {
    // This allows testing a key WITHOUT saving it first (or even if not logged in? No, should be logged in).
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        if (provider === 'openai') {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: "Hello" }], max_tokens: 5 })
            });
            if (!res.ok) throw new Error(`OpenAI Error: ${res.statusText}`);
            return { success: true, message: "OpenAI Connected!" };

        } else if (provider === 'anthropic') {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
                body: JSON.stringify({ model: "claude-3-5-sonnet-20240620", max_tokens: 5, messages: [{ role: "user", content: "Hello" }] })
            });
            if (!res.ok) throw new Error(`Anthropic Error: ${res.statusText}`);
            return { success: true, message: "Anthropic Connected!" };

        } else if (provider === 'gemini') {
            // Test generic list models first
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            if (!listRes.ok) throw new Error("Gemini Error: Could not list models.");

            return { success: true, message: "Gemini Connected!" };
        }
        return { success: false, message: "Unknown Provider" };
    } catch (e: any) {
        return { success: false, message: e.message || "Connection Failed" };
    }
}
