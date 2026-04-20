
import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, User, Bot, Sparkles, AlertCircle, Copy, Check, MessageSquarePlus, PlusCircle, Building2, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Asset } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
    role: 'user' | 'assistant';
    content: string;
    isWizard?: boolean;   // styled differently — step card
    isSummary?: boolean;  // summary card before confirm
}

interface WizardData {
    name: string;
    type: string;
    size: string;
    roi: string;
    condition: string;
    maintenance_due: string;
    risk: Asset['risk'];
}

// ── Wizard config ─────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
    {
        key: 'name' as keyof WizardData,
        icon: '🏷️',
        label: 'שם הנכס',
        question: 'מה שם הנכס שברצונך להוסיף?',
        hint: 'לדוגמה: "מרכז קהילתי צפון", "מגרש 14"',
        validate: (v: string) => v.trim() ? null : 'שם הנכס הוא שדה חובה',
    },
    {
        key: 'type' as keyof WizardData,
        icon: '🏢',
        label: 'סוג ייעוד',
        question: 'מה סוג הייעוד של הנכס?',
        hint: 'מבנה ציבורי / מגרש / מבנה מסחרי / מבנה תעשייתי / שטח פתוח / תשתית / כללי',
        validate: () => null,
    },
    {
        key: 'size' as keyof WizardData,
        icon: '📐',
        label: 'שטח (מ"ר)',
        question: 'מה שטח הנכס במטרים רבועים?',
        hint: 'הזן מספר — לדוגמה: 450',
        validate: () => null,
    },
    {
        key: 'roi' as keyof WizardData,
        icon: '💰',
        label: 'תשואה צפויה (%)',
        question: 'מה התשואה הצפויה מהנכס (באחוזים)?',
        hint: 'לדוגמה: 5.5 — השאר ריק אם לא רלוונטי',
        validate: () => null,
    },
    {
        key: 'condition' as keyof WizardData,
        icon: '🔧',
        label: 'מצב הנכס',
        question: 'מה המצב הנוכחי של הנכס?',
        hint: 'לדוגמה: "מתוחזק היטב", "דורש שיפוץ", "נזק קונסטרוקטיבי"',
        validate: (v: string) => v.trim() ? null : 'מצב הנכס הוא שדה חובה',
    },
    {
        key: 'maintenance_due' as keyof WizardData,
        icon: '📅',
        label: 'תאריך תחזוקה',
        question: 'מה תאריך התחזוקה הקרובה? (YYYY-MM-DD)',
        hint: 'לדוגמה: 2025-06-01 — השאר ריק אם לא ידוע',
        validate: () => null,
    },
    {
        key: 'risk' as keyof WizardData,
        icon: '⚠️',
        label: 'רמת סיכון',
        question: 'מה רמת הסיכון של הנכס?',
        hint: 'נמוך / בינוני / גבוה',
        validate: (v: string) => {
            const norm = v.trim();
            if (!norm) return null;
            if (!['נמוך', 'בינוני', 'גבוה', 'low', 'medium', 'high'].includes(norm.toLowerCase())) {
                return 'יש לבחור: נמוך, בינוני, או גבוה';
            }
            return null;
        },
    },
] as const;

const TOTAL_STEPS = WIZARD_STEPS.length;

const TRIGGER_PHRASES = [
    'הוסף נכס', 'הוספת נכס', 'נכס חדש', 'add asset', 'add property', 'new asset', 'new property',
    'רוצה להוסיף', 'להוסיף נכס',
];

const normalizeRisk = (v: string): Asset['risk'] => {
    const lower = v.trim().toLowerCase();
    if (lower === 'גבוה' || lower === 'high') return 'גבוה';
    if (lower === 'בינוני' || lower === 'medium') return 'בינוני';
    return 'נמוך';
};

// ── Wizard message renderer ───────────────────────────────────────────────────

const WizardStepCard: React.FC<{ step: number; question: string; hint: string; icon: string }> = ({ step, question, hint, icon }) => (
    <div className="bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-700/50 rounded-2xl p-4 shadow-sm w-full">
        {/* Progress */}
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                    שלב {step + 1} מתוך {TOTAL_STEPS}
                </span>
            </div>
            <div className="flex gap-1">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 w-5 rounded-full transition-all ${i <= step ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    />
                ))}
            </div>
        </div>
        <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">{question}</p>
        <p className="text-[11px] text-slate-400">{hint}</p>
    </div>
);

const SummaryCard: React.FC<{ data: WizardData }> = ({ data }) => {
    const riskColor = data.risk === 'גבוה' ? 'text-rose-500' : data.risk === 'בינוני' ? 'text-amber-500' : 'text-emerald-500';
    const rows: { icon: string; label: string; value: string; extra?: string }[] = [
        { icon: '🏷️', label: 'שם הנכס',        value: data.name || '—' },
        { icon: '🏢', label: 'סוג ייעוד',       value: data.type || '—' },
        { icon: '📐', label: 'שטח',             value: data.size ? `${Number(data.size).toLocaleString()} מ"ר` : '—' },
        { icon: '💰', label: 'תשואה',           value: data.roi ? `${data.roi}%` : '—' },
        { icon: '🔧', label: 'מצב',             value: data.condition || '—' },
        { icon: '📅', label: 'תחזוקה',          value: data.maintenance_due || '—' },
        { icon: '⚠️', label: 'רמת סיכון',       value: data.risk },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm w-full">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <Building2 className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">סיכום הנכס — אשר לפני שמירה</span>
            </div>
            <div className="space-y-2">
                {rows.map(r => (
                    <div key={r.label} className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span>{r.icon}</span>{r.label}
                        </span>
                        <span className={`text-xs font-bold ${r.label === 'רמת סיכון' ? riskColor : 'text-slate-900 dark:text-white'}`}>
                            {r.value}
                        </span>
                    </div>
                ))}
            </div>
            <p className="mt-4 text-[11px] text-center text-slate-400">
                הקלד <span className="font-bold text-cyan-500">כן</span> לשמירה או <span className="font-bold text-rose-400">לא</span> לביטול
            </p>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

const GREETING: Message = {
    role: 'assistant',
    content: 'שלום! אני העוזר החכם של מערכת תנופה. אני מכיר את המדריך להקצאת שטחים לצורכי ציבור (פרק ג\') ואת נתוני התקנים שלכם. איך אוכל לעזור לך היום?',
};

const GeoAI: React.FC = () => {
    const { standards, addAsset } = useData();
    const { user } = useAuth();

    const storageKey = user ? `tnufa_chat_${user.uid}` : null;

    const loadHistory = (): Message[] => {
        if (!storageKey) return [GREETING];
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) return JSON.parse(raw) as Message[];
        } catch { /* ignore */ }
        return [GREETING];
    };

    const [messages, setMessages] = useState<Message[]>(loadHistory);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    // Wizard state
    const [wizardStep, setWizardStep] = useState<number | null>(null);
    const [wizardData, setWizardData] = useState<Partial<WizardData>>({});
    const [awaitingConfirm, setAwaitingConfirm] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Save history to localStorage on every change
    useEffect(() => {
        if (!storageKey) return;
        localStorage.setItem(storageKey, JSON.stringify(messages));
    }, [messages, storageKey]);

    // Reload history when the logged-in user changes
    useEffect(() => {
        setMessages(loadHistory());
        setWizardStep(null);
        setWizardData({});
        setAwaitingConfirm(false);
    }, [user?.uid]);

    const clearHistory = () => {
        if (storageKey) localStorage.removeItem(storageKey);
        setMessages([GREETING]);
        setWizardStep(null);
        setWizardData({});
        setAwaitingConfirm(false);
    };

    const quickPrompts = [
        "הוסף נכס חדש",
        "מה התקן לגן ילדים?",
        "תכנן פרוגרמה ל-2000 יח\"ד",
        "הסבר על נספח צורכי ציבור",
    ];

    const pushAssistant = (content: string, extra?: Partial<Message>) => {
        setMessages(prev => [...prev, { role: 'assistant', content, ...extra }]);
    };

    // ── Wizard flow ─────────────────────────────────────────────────────────

    const startWizard = () => {
        setWizardStep(0);
        setWizardData({});
        setAwaitingConfirm(false);
        pushAssistant('', { isWizard: true });
    };

    const handleWizardAnswer = (answer: string) => {
        // Confirmation screen
        if (awaitingConfirm) {
            const norm = answer.trim().toLowerCase();
            if (['כן', 'yes', 'אישור', 'ok', 'שמור', 'save', 'אשר'].includes(norm)) {
                const full = wizardData as WizardData;
                addAsset({
                    name: full.name,
                    type: full.type || 'כללי',
                    size: Number(full.size) || 0,
                    roi: Number(full.roi) || 0,
                    condition: full.condition,
                    maintenance_due: full.maintenance_due || '',
                    risk: normalizeRisk(full.risk || 'נמוך'),
                });
                pushAssistant(`הנכס **${full.name}** נשמר בהצלחה! ✅\nניתן לצפות בו בדף "מצאי נכסים קיים".`);
            } else {
                pushAssistant('הפעולה בוטלה. ניתן להתחיל מחדש בכל עת עם "הוסף נכס".');
            }
            setWizardStep(null);
            setAwaitingConfirm(false);
            return;
        }

        if (wizardStep === null) return;
        const step = WIZARD_STEPS[wizardStep];

        // Validate
        const err = step.validate(answer);
        if (err) {
            pushAssistant(`⚠️ ${err}\n${step.hint}`);
            return;
        }

        // Save answer
        const updated = { ...wizardData, [step.key]: answer.trim() };
        setWizardData(updated);

        const nextStep = wizardStep + 1;

        if (nextStep < TOTAL_STEPS) {
            setWizardStep(nextStep);
            pushAssistant('', { isWizard: true });
        } else {
            // All done — show summary
            setWizardStep(TOTAL_STEPS);
            setAwaitingConfirm(true);
            pushAssistant('', { isSummary: true });
        }
    };

    // ── Send handler ─────────────────────────────────────────────────────────

    const handleSend = async (customText?: string) => {
        const textToSend = (customText || input).trim();
        if (!textToSend || loading) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: textToSend }]);

        // Check wizard trigger
        const isWizardTrigger = TRIGGER_PHRASES.some(p =>
            textToSend.toLowerCase().includes(p.toLowerCase())
        );

        if (isWizardTrigger && wizardStep === null && !awaitingConfirm) {
            startWizard();
            return;
        }

        // In wizard mode — handle answer
        if (wizardStep !== null || awaitingConfirm) {
            handleWizardAnswer(textToSend);
            return;
        }

        // Normal AI flow
        setLoading(true);
        try {
            const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
            if (!apiKey) throw new Error('API Key missing');

            const standardsContext = standards.map(s =>
                `${s.name} (${s.category}): גיל ${s.targetPopulationAge[0]}-${s.targetPopulationAge[1]}, תקן: ${s.landAllocation} דונם או ${s.builtArea} מ"ר לכל ${s.classSize} תושבים.`
            ).join('\n');

            const res = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    temperature: 0.7,
                    messages: [
                        {
                            role: 'system',
                            content: `אתה עוזר תכנון עירוני מקצועי ישראלי במערכת "תנופה".
יש לך ידע מעמיק ב"מדריך להקצאת שטחים לצורכי ציבור" (פרק ג').
ענה תמיד בעברית. היה מקצועי, אנליטי ומבוסס נתונים.
תקני תכנון נוכחיים:
${standardsContext}
בחישובים השתמש בתקנים אלו במדויק. תמיד ציין שתוצאות ה-AI הן כלי עזר בלבד.`,
                        },
                        { role: 'user', content: textToSend },
                    ],
                }),
            });

            if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);
            const data = await res.json();
            pushAssistant(data.choices?.[0]?.message?.content || 'סליחה, חלה שגיאה בעיבוד הבקשה.');
        } catch {
            pushAssistant('שירות ה-AI אינו זמין כרגע. נסי שנית מאוחר יותר.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    // Which step to display for wizard cards
    const getWizardStepForMessage = (msgIdx: number): number => {
        let stepCount = 0;
        for (let i = 0; i < msgIdx; i++) {
            if (messages[i].isWizard) stepCount++;
        }
        return stepCount;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] fade-in">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-500/10 rounded-2xl">
                        <Brain className="text-cyan-600 dark:text-cyan-400 w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            AI Agent <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">מנתח תכנוני חכם מבוסס תקני המדריך</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={clearHistory}
                        title="נקה היסטוריית שיחה"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-700 text-[11px] font-medium transition-all bg-white dark:bg-slate-800"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">נקה שיחה</span>
                    </button>
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">DeepSeek Active</span>
                    </div>
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 bg-white dark:bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map((msg, idx) => {
                        // Wizard step card
                        if (msg.isWizard) {
                            const stepIdx = getWizardStepForMessage(idx);
                            const step = WIZARD_STEPS[Math.min(stepIdx, TOTAL_STEPS - 1)];
                            return (
                                <div key={idx} className="flex justify-end">
                                    <div className="flex gap-4 max-w-[85%] flex-row-reverse">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <Bot className="w-6 h-6" />
                                        </div>
                                        <WizardStepCard
                                            step={stepIdx}
                                            question={step.question}
                                            hint={step.hint}
                                            icon={step.icon}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        // Summary card
                        if (msg.isSummary) {
                            return (
                                <div key={idx} className="flex justify-end">
                                    <div className="flex gap-4 max-w-[85%] flex-row-reverse">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <Bot className="w-6 h-6" />
                                        </div>
                                        <SummaryCard data={wizardData as WizardData} />
                                    </div>
                                </div>
                            );
                        }

                        // Regular message
                        return (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
                                        ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-cyan-500 text-white'}`}>
                                        {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                                    </div>
                                    <div className="group relative">
                                        <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-line
                                            ${msg.role === 'user'
                                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tr-none'
                                                : 'bg-cyan-50 dark:bg-cyan-900/30 text-slate-800 dark:text-slate-100 border border-cyan-100 dark:border-cyan-800/50 rounded-tl-none'}`}>
                                            {msg.content}
                                        </div>
                                        {msg.role === 'assistant' && msg.content && (
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
                        );
                    })}

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

                {/* Input area */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {quickPrompts.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(q)}
                                className="text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 transition-all flex items-center gap-1.5"
                            >
                                {i === 0 ? <PlusCircle className="w-3 h-3" /> : <MessageSquarePlus className="w-3 h-3" />}
                                {q}
                            </button>
                        ))}
                    </div>

                    <div className="relative max-w-4xl mx-auto flex gap-3">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={
                                awaitingConfirm
                                    ? 'הקלד "כן" לשמירה או "לא" לביטול...'
                                    : wizardStep !== null
                                        ? 'הקלד את תשובתך...'
                                        : 'שאלו את ה-AI, או כתוב "הוסף נכס"...'
                            }
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
