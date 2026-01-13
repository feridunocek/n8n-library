"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, Language, Translation } from "@/lib/i18n";
import { saveApiKeyAction, hasApiKeyAction } from "@/lib/actions";

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

interface SettingsContextType {
    language: Language;
    setLanguage: (lang: Language) => void;

    // Active provider
    aiProvider: AIProvider;
    setAiProvider: (provider: AIProvider) => void;

    // Key Status (we don't hold the keys on client anymore)
    hasOpenaiKey: boolean;
    saveOpenaiKey: (key: string) => Promise<void>;

    hasAnthropicKey: boolean;
    saveAnthropicKey: (key: string) => Promise<void>;

    hasGeminiKey: boolean;
    saveGeminiKey: (key: string) => Promise<void>;

    t: Translation;
    favorites: string[];
    toggleFavorite: (id: string) => void;

    geminiModel: string;
    setGeminiModel: (model: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("tr");
    const [favorites, setFavorites] = useState<string[]>([]);

    const [aiProvider, setAiProvider] = useState<AIProvider>('openai');
    const [geminiModel, setGeminiModel] = useState("models/gemini-1.5-flash");

    // Key existence states
    const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
    const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
    const [hasGeminiKey, setHasGeminiKey] = useState(false);

    // Initialize from LocalStorage (Preferences only) and Server (Key Status)
    useEffect(() => {
        const savedLang = localStorage.getItem("n8n-hub-lang") as Language;
        const savedFavs = localStorage.getItem("n8n-hub-favs");
        const savedProvider = localStorage.getItem("n8n-hub-ai-provider") as AIProvider;
        const savedGeminiModel = localStorage.getItem("n8n-hub-gemini-model");

        if (savedLang) setLanguage(savedLang);
        if (savedFavs) setFavorites(JSON.parse(savedFavs));
        if (savedProvider) setAiProvider(savedProvider);
        if (savedGeminiModel) setGeminiModel(savedGeminiModel);

        // Check keys on server
        checkKeys();
    }, []);

    const checkKeys = async () => {
        setHasOpenaiKey(await hasApiKeyAction('openai'));
        setHasAnthropicKey(await hasApiKeyAction('anthropic'));
        setHasGeminiKey(await hasApiKeyAction('gemini'));
    };

    // Save changes
    useEffect(() => { localStorage.setItem("n8n-hub-lang", language); }, [language]);
    useEffect(() => { localStorage.setItem("n8n-hub-favs", JSON.stringify(favorites)); }, [favorites]);
    useEffect(() => { localStorage.setItem("n8n-hub-ai-provider", aiProvider); }, [aiProvider]);
    useEffect(() => { localStorage.setItem("n8n-hub-gemini-model", geminiModel); }, [geminiModel]);

    const saveKey = async (provider: string, key: string) => {
        try {
            await saveApiKeyAction(provider, key);
            if (provider === 'openai') setHasOpenaiKey(true);
            if (provider === 'anthropic') setHasAnthropicKey(true);
            if (provider === 'gemini') setHasGeminiKey(true);
        } catch (e) {
            console.error(`Failed to save ${provider} key`, e);
            alert("Failed to save API Key");
        }
    };

    const toggleFavorite = (id: string) => {
        setFavorites((prev) =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const value = {
        language,
        setLanguage,
        aiProvider,
        setAiProvider,
        geminiModel,
        setGeminiModel,
        t: translations[language],
        favorites,
        toggleFavorite,

        hasOpenaiKey,
        saveOpenaiKey: (k: string) => saveKey('openai', k),
        hasAnthropicKey,
        saveAnthropicKey: (k: string) => saveKey('anthropic', k),
        hasGeminiKey,
        saveGeminiKey: (k: string) => saveKey('gemini', k),
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
