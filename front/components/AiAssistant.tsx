"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useWebLLM } from "@/hooks/useWebLLM";
import { useCrmData } from "@/hooks/useCrmData";
import { Bot, X, Send, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePathname } from "next/navigation";

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const { initEngine, isLoading, progress, messages, sendMessage, clearMessages, isGenerating, isReady, setMessages } = useWebLLM();
    const crmData = useCrmData();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleOpen = () => {
        setIsOpen(true);
        setIsMinimized(false);
        if (!isReady && !isLoading) {
            initEngine();
        }
    };

    // Listen for custom event to open AI
    useEffect(() => {
        const handleCustomOpen = () => handleOpen();
        window.addEventListener('open-ai-assistant', handleCustomOpen);
        return () => window.removeEventListener('open-ai-assistant', handleCustomOpen);
    }, [isReady, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isGenerating) return;

        const text = input;
        setInput("");

        // Construct System Prompt with CRM Data
        const systemPrompt = `
You are an expert CRM assistant for "NetStrategy".
You have access to the following live data from the database:

--- GLOBAL STATS ---
TOTAL CLIENTS: ${crmData.clients.length}
TOTAL PROSPECTS: ${crmData.prospects.length}
TOTAL MONTHLY REVENUE: ${crmData.totalRevenue}€

--- CLIENTS ---
${crmData.clients.map(c => `
- ${c.societe}
  * Contact: ${c.contact}
  * Email: ${c.email}
  * Phone: ${c.phone}
  * City: ${c.ville}
  * Revenue: ${c.revenue}€/month
  * Services: ${c.prestations.length > 0 ? c.prestations.map(p => `${p.type} (${p.montant}€/${p.frequence})`).join(', ') : 'None'}
`).join('')}

--- PROSPECTS ---
${crmData.prospects.map(p => `
- ${p.societe}
  * Contact: ${p.contact}
  * Email: ${p.email}
  * Phone: ${p.phone}
  * Status: ${p.status}
`).join('')}

--- PENDING TASKS ---
${crmData.pendingTodos.join(", ")}

INSTRUCTIONS:
- Answer questions based strictly on the data above.
- Be helpful, professional, and concise.
- If asked about counts, use the "TOTAL" values provided.
- You can infer details (e.g., "Who is the contact for Alpha?" -> "Jean Dupont").
        `.trim();

        // Inject context about current page
        const contextPrefix = `[Context: User is on page ${pathname}] `;
        await sendMessage(contextPrefix + text, systemPrompt);
    };

    const handleClearChat = () => {
        clearMessages();
    };

    // Use Portal to ensure fixed positioning is relative to viewport
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Content to render
    const content = !isOpen ? (
        <button
            onClick={handleOpen}
            className="fixed bottom-6 right-6 p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 hover:shadow-indigo-500/50 transition-all duration-300 z-[9999] group ring-4 ring-white/10 backdrop-blur-md"
        >
            <Bot className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
        </button>
    ) : isMinimized ? (
        <div className="fixed bottom-6 right-6 w-72 bg-card/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden ring-1 ring-black/5 dark:ring-white/5 animate-fade-in-up">
            <div
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsMinimized(false)}
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-medium text-sm">Assistant IA</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </div>
        </div>
    ) : (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[9999] animate-scale-in ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Assistant IA</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {isReady ? 'Prêt' : 'Initialisation...'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleClearChat}
                        className="p-2 hover:bg-muted rounded-full transition-colors text-xs text-muted-foreground"
                        title="Effacer la conversation"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Chargement du modèle IA...</p>
                            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">{progress}</p>
                        </div>
                    </div>
                )}

                {!isLoading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                        <Sparkles className="w-12 h-12 text-primary/50" />
                        <p className="text-sm">Posez-moi une question sur vos clients ou prospects.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                    >
                        <div
                            className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-muted/80 backdrop-blur-sm text-foreground rounded-bl-none border border-white/10'
                                }`}
                        >
                            {/* Simple markdown-like rendering for bold text */}
                            {msg.content.replace(/\[Context:.*?\] /, '').split(/(\*\*.*?\*\*)/).map((part, i) =>
                                part.startsWith('**') && part.endsWith('**')
                                    ? <strong key={i}>{part.slice(2, -2)}</strong>
                                    : part
                            )}
                        </div>
                    </div>
                ))}

                {isGenerating && (
                    <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-2xl rounded-bl-none">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-muted/30">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Posez votre question..."
                        disabled={!isReady || isGenerating}
                        className="w-full pl-4 pr-12 py-3 bg-background/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || !isReady || isGenerating}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );

    // Render to body using Portal
    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
}
