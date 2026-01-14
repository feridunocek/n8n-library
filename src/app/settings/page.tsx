import { useSettings } from "@/lib/contexts/settings-context";
import { Check, Globe, Bot, Shield, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { testConnectionAction, getCustomPromptAction, saveCustomPromptAction } from "@/lib/actions";

export default function SettingsPage() {
    const {
        t, language, setLanguage,
        aiProvider, setAiProvider, setGeminiModel,
        hasOpenaiKey, saveOpenaiKey,
        hasAnthropicKey, saveAnthropicKey,
        hasGeminiKey, saveGeminiKey
    } = useSettings();

    const [showSaved, setShowSaved] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    // Local inputs for keys (we don't store them in context/storage anymore)
    const [inputOpenai, setInputOpenai] = useState("");
    const [inputAnthropic, setInputAnthropic] = useState("");
    const [inputGemini, setInputGemini] = useState("");

    const handleSave = async () => {
        // Save only if user entered something
        if (aiProvider === 'openai' && inputOpenai) await saveOpenaiKey(inputOpenai);
        if (aiProvider === 'anthropic' && inputAnthropic) await saveAnthropicKey(inputAnthropic);
        if (aiProvider === 'gemini' && inputGemini) await saveGeminiKey(inputGemini);

        // Clear inputs after save for security? 
        // Maybe better to keep them so user knows what they just typed if they want to edit.
        // But the "Has Key" status will update.
        setInputOpenai("");
        setInputAnthropic("");
        setInputGemini("");

        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);

        let keyToTest = "";
        let provider = aiProvider;

        if (aiProvider === 'openai') keyToTest = inputOpenai;
        if (aiProvider === 'anthropic') keyToTest = inputAnthropic;
        if (aiProvider === 'gemini') keyToTest = inputGemini;

        if (!keyToTest) {
            setTestResult({ success: false, message: "Please enter a key to test." });
            setIsTesting(false);
            return;
        }

        try {
            const result = await testConnectionAction(provider, keyToTest);
            setTestResult(result);
        } catch (e) {
            setTestResult({ success: false, message: "Test failed." });
        } finally {
            setIsTesting(false);
        }
    };

    // Custom Prompt State
    const [customPrompt, setCustomPrompt] = useState("");
    const [loadingPrompt, setLoadingPrompt] = useState(true);

    // Load prompt on mount
    import { useEffect } from "react";
    import { getCustomPromptAction, saveCustomPromptAction } from "@/lib/actions";

    useEffect(() => {
        getCustomPromptAction().then(p => {
            if (p !== null) setCustomPrompt(p);
            setLoadingPrompt(false);
        });
    }, []);

    const handleSavePrompt = async () => {
        await saveCustomPromptAction(customPrompt);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 mt-10 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{t.settings.title}</h1>
                <p className="text-muted-foreground">{t.settings.description}</p>
            </div>

            <div className="grid gap-6">
                {/* Language Selection */}
                <div className="bg-card border border-border p-6 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">{t.settings.language}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setLanguage("tr")}
                            className={`p-4 rounded-lg border flex items-center justify-between transition-all ${language === "tr"
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-muted/30 border-transparent hover:bg-muted/50"
                                }`}
                        >
                            <span className="font-medium">Türkçe</span>
                            {language === "tr" && <Check className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setLanguage("en")}
                            className={`p-4 rounded-lg border flex items-center justify-between transition-all ${language === "en"
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-muted/30 border-transparent hover:bg-muted/50"
                                }`}
                        >
                            <span className="font-medium">English</span>
                            {language === "en" && <Check className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Custom AI Prompt */}
                <div className="bg-card border border-border p-6 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Bot className="w-5 h-5 text-purple-500" />
                        </div>
                        <h2 className="font-semibold text-lg">AI Persona & Prompt</h2>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {language === 'tr'
                            ? "Yapay zekanın analiz yaparken kullanacağı yönergeyi özelleştirin. Boş bırakırsanız varsayılan uzman modu kullanılır."
                            : "Customize the prompt used by AI for analysis. Leave empty to use the default expert mode."}
                    </p>

                    <div className="space-y-2">
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder={language === 'tr'
                                ? "Örn: Sen esprili bir anlatıcısın. İş akışını masal gibi anlat..."
                                : "Ex: You are a witty narrator. Explain the workflow like a fairy tale..."}
                            className="w-full h-32 bg-secondary/30 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50 text-sm resize-y"
                            disabled={loadingPrompt}
                        />
                        <button
                            onClick={handleSavePrompt}
                            disabled={loadingPrompt}
                            className="text-sm px-4 py-2 bg-secondary hover:bg-secondary/80 rounded border border-white/10 transition-colors"
                        >
                            {language === 'tr' ? "Promptu Kaydet" : "Save Prompt"}
                        </button>
                    </div>
                </div>

                {/* AI Config */}
                <div className="bg-card border border-border p-6 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-5 h-5 text-green-500" />
                        <h2 className="font-semibold text-lg">{t.settings.aiConfig}</h2>
                    </div>

                    {/* How it works info */}
                    <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/50">
                        <p className="flex items-center gap-2"><Shield className="w-3 h-3" /> API Keys are encrypted securely on your self-hosted server.</p>
                    </div>

                    {/* Provider Selector */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {['openai', 'anthropic', 'gemini'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setAiProvider(p as any)}
                                className={`p-3 rounded-lg border text-sm font-medium transition-all capitalize flex flex-col items-center gap-1 ${aiProvider === p
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-muted/30 border-transparent hover:bg-muted/50 text-muted-foreground"
                                    }`}
                            >
                                <span>{p}</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold">
                                    {(p === 'openai' && hasOpenaiKey) || (p === 'anthropic' && hasAnthropicKey) || (p === 'gemini' && hasGeminiKey)
                                        ? <span className="text-green-500">Configured</span>
                                        : <span className="text-yellow-500">Missing</span>}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">

                        {aiProvider === 'openai' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">OpenAI API Key</label>
                                <input
                                    type="password"
                                    value={inputOpenai}
                                    onChange={(e) => setInputOpenai(e.target.value)}
                                    placeholder={hasOpenaiKey ? "Key is set. Enter new key to update..." : "sk-..."}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        )}
                        {aiProvider === 'anthropic' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Anthropic API Key</label>
                                <input
                                    type="password"
                                    value={inputAnthropic}
                                    onChange={(e) => setInputAnthropic(e.target.value)}
                                    placeholder={hasAnthropicKey ? "Key is set. Enter new key to update..." : "sk-ant-..."}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        )}
                        {aiProvider === 'gemini' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={inputGemini}
                                    onChange={(e) => setInputGemini(e.target.value)}
                                    placeholder={hasGeminiKey ? "Key is set. Enter new key to update..." : "AIza..."}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2 pt-2">
                        <button
                            onClick={handleTest}
                            disabled={isTesting}
                            className="text-xs px-3 py-2 bg-secondary hover:bg-secondary/80 rounded border border-white/10 transition-colors disabled:opacity-50"
                        >
                            {isTesting ? "Testing..." : "Test Connection (Using Input)"}
                        </button>
                        {testResult && (
                            <div className={`text-xs p-2 rounded border w-full text-center ${testResult.success ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-red-500/10 border-red-500/50 text-red-500"}`}>
                                {testResult.message}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                    {showSaved ? (
                        <>
                            <Check className="w-5 h-5" />
                            {t.settings.saved}
                        </>
                    ) : (
                        t.settings.save
                    )}
                </button>
            </div>
        </div>
    );
}
