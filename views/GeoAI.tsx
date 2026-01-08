
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Brain, Send, User, Bot, Sparkles, AlertCircle, Info, Copy, Check, MessageSquarePlus } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const GeoAI: React.FC = () => {
    const { standards } = useData();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'שלום! אני העוזר החכם של מערכת תנופה. אני מכיר את המדריך להקצאת שטחים לצורכי ציבור (פרק ג\') ואת נתוני התקנים שלכם. איך אוכל לעזור לך היום בתכנון המרחבי?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickPrompts = [
        "מה התקן לגן ילדים?",
        "תכנן פרוגרמה ל-2000 יח\"ד",
        "איך משלבים שימושים בשטח חום?",
        "הסבר על נספח צורכי ציבור"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const handleSend = async (customText?: string) => {
        const textToSend = customText || input;
        if (!textToSend.trim() || loading) return;

        const userMessage = textToSend.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
            if (!apiKey) throw new Error("API Key missing");

            const ai = new GoogleGenAI({ apiKey });
            
            const standardsContext = standards.map(s => 
                `${s.name} (${s.category}): גיל ${s.targetPopulationAge[0]}-${s.targetPopulationAge[1]}, תקן: ${s.landAllocation} דונם או ${s.builtArea} מ"ר לכל ${s.classSize} תושבים.`
            ).join('\n');

            const systemInstruction = `
                You are a professional Israeli urban planning assistant for a system called "Tnufa". 
                You have deep knowledge of "המדריך להקצאת שטחים לצורכי ציבור" (The Guide for Allocating Land for Public Needs).
                Always respond in Hebrew. 
                Be professional, analytical, and data-driven.
                
                Current planning standards context:
                ${standardsContext}
                
                When asked for calculations, use these exact standards. If the user asks for planning advice, refer to multi-use land principles and urban density.
                Always clarify that AI results are for decision support and require verification by a certified city planner.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: userMessage,
                config: {
                    systemInstruction,
                    thinkingConfig: { thinkingBudget: 4000 },
                    temperature: 0.7,
                },
            });

            const text = response.text || "סליחה, חלה שגיאה בעיבוד הבקשה.";
            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "חלה שגיאה בחיבור לשרתי הבינה המלאכותית. וודא שמפתח ה-API מוגדר כראוי." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] fade-in">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-500/10 rounded-2xl">
                        <Brain className="text-cyan-600 dark:text-cyan-400 w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Geo AI Assistant <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">מנתח תכנוני חכם מבוסס תקני המדריך</p>
                    </div>
                </div>
                
                <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Gemini 3 Pro Active</span>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
                                    ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-cyan-500 text-white'}`}>
                                    {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                                </div>
                                <div className="group relative">
                                    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm
                                        ${msg.role === 'user' 
                                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tr-none' 
                                            : 'bg-cyan-50 dark:bg-cyan-900/30 text-slate-800 dark:text-slate-100 border border-cyan-100 dark:border-cyan-800/50 rounded-tl-none'}`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'assistant' && (
                                        <button 
                                            onClick={() => handleCopy(msg.content, idx)}
                                            className="absolute -bottom-6 left-0 p-1 text-slate-400 hover:text-cyan-500 transition-colors flex items-center gap-1 text-[10px]"
                                        >
                                            {copiedIdx === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copiedIdx === idx ? 'הועתק' : 'העתק תשובה'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-end">
                            <div className="flex gap-4 items-center">
                                <div className="text-xs text-slate-400 font-medium italic animate-pulse">מחשב נתונים ותקנים...</div>
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center animate-spin">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {quickPrompts.map((q, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSend(q)}
                                className="text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 transition-all flex items-center gap-1.5"
                            >
                                <MessageSquarePlus className="w-3 h-3" />
                                {q}
                            </button>
                        ))}
                    </div>

                    <div className="relative max-w-4xl mx-auto flex gap-3">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="שאלו את ה-AI על צורכי ציבור, תקנים או ניתוח מרחבי..."
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-inner resize-none h-14 custom-scrollbar"
                            rows={1}
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className={`flex items-center justify-center w-14 h-14 rounded-2xl transition shadow-lg
                                ${!input.trim() || loading 
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' 
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20 hover:scale-105 active:scale-95'}`}
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-slate-400 px-2">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <p className="text-[11px] font-medium">הבהרה: תוצאות ה-AI הן כלי עזר תכנוני בלבד.</p>
                </div>
                <p className="text-[10px]">מחובר למדריך להקצאת שטחי ציבור v2.0</p>
            </div>
        </div>
    );
};

export default GeoAI;