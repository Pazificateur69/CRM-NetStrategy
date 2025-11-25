
import { useState, useEffect, useCallback } from "react";
import { CreateMLCEngine, MLCEngine, MLCEngineInterface, prebuiltAppConfig } from "@mlc-ai/web-llm";

// Using a more capable model (8B) for better reasoning
const SELECTED_MODEL = "Llama-3.1-8B-Instruct-q4f32_1-MLC";

export type Message = {
    role: "user" | "assistant" | "system";
    content: string;
};

export function useWebLLM() {
    const [engine, setEngine] = useState<MLCEngineInterface | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const initEngine = useCallback(async (systemPrompt?: string) => {
        if (engine) return;

        setIsLoading(true);
        try {
            // Use prebuilt config to ensure compatibility
            const appConfig = prebuiltAppConfig;

            const newEngine = await CreateMLCEngine(SELECTED_MODEL, {
                initProgressCallback: (report) => {
                    setProgress(report.text);
                },
                appConfig: appConfig, // Use the prebuilt config which has correct WASM paths
            });

            // Set system prompt if provided
            if (systemPrompt) {
                // We'll handle system prompt by prepending it to the messages or using engine config if available
                // For simplicity, we'll store it in state or just rely on the first message being system
            }

            setEngine(newEngine);
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to load WebLLM engine:", error);
            setIsLoading(false);
            setProgress("Error loading model.");
        }
    }, [engine]);

    const sendMessage = useCallback(
        async (text: string, systemPrompt?: string) => {
            if (!engine) return;

            const newMessages: Message[] = [...messages];

            // If it's the first message and we have a system prompt, add it
            if (messages.length === 0 && systemPrompt) {
                newMessages.push({ role: "system", content: systemPrompt });
            }

            newMessages.push({ role: "user", content: text });

            setMessages(newMessages);
            setIsGenerating(true);

            try {
                const reply = await engine.chat.completions.create({
                    messages: newMessages,
                });

                const assistantMessage = reply.choices[0].message;
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: assistantMessage.content || "" },
                ]);
            } catch (error) {
                console.error("Error generating response:", error);
            } finally {
                setIsGenerating(false);
            }
        },
        [engine, messages]
    );

    return {
        initEngine,
        isLoading,
        progress,
        messages,
        setMessages,
        sendMessage,
        isGenerating,
        isReady: !!engine,
    };
}
