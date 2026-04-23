
import React, { useState, useRef, useEffect } from 'react';
import {
    Brain, Send, User, Bot, Sparkles, AlertCircle, Copy, Check,
    MessageSquarePlus, PlusCircle, Building2, Trash2, Plus, Clock, MessageSquare,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Asset } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
    role: 'user' | 'assistant';
    content: string;
    isWizard?: boolean;
    isSummary?: boolean;
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

interface ChatSession {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: Message[];
}

// ── Wizard config ──────────────────────────────────────────────────────────────

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

// ── Session helpers ────────────────────────────────────────────────────────────

const GREETING: Message = {
    role: 'assistant',
    content: 'שלום! אני העוזר החכם של מערכת תנופה. אני מכיר את המדריך להקצאת שטחים לצורכי ציבור (פרק ג\') ואת נתוני התקנים שלכם. איך אוכל לעזור לך היום?',
};

const createNewSession = (): ChatSession => ({
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: 'שיחה חדשה',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [GREETING],
});

const SESSIONS_KEY = (uid: string) => `tnufa_sessions_${uid}`;
const OLD_CHAT_KEY = (uid: string) => `tnufa_chat_${uid}`;

function initSessionData(uid: string | undefined): { sessions: ChatSession[]; activeId: string } {
    if (uid) {
        // Try new sessions format
        try {
            const raw = localStorage.getItem(SESSIONS_KEY(uid));
            if (raw) {
                const data = JSON.parse(raw) as { sessions: ChatSession[]; activeId: string };
                if (Array.isArray(data.sessions) && data.sessions.length && data.activeId) {
                    return data;
                }
            }
        } catch { /* ignore */ }

        // Migrate from old single-chat format
        try {
            const oldRaw = localStorage.getItem(OLD_CHAT_KEY(uid));
            if (oldRaw) {
                const oldMessages = JSON.parse(oldRaw) as Message[];
                if (oldMessages.length > 0) {
                    const session: ChatSession = {
                        id: `s_${Date.now()}`,
                        title: oldMessages.find(m => m.role === 'user')?.content.slice(0, 35) || 'שיחה ישנה',
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        messages: oldMessages,
                    };
                    localStorage.removeItem(OLD_CHAT_KEY(uid));
                    return { sessions: [session], activeId: session.id };
                }
            }
        } catch { /* ignore */ }
    }

    const s = createNewSession();
    return { sessions: [s], activeId: s.id };
}

const formatDate = (ts: number): string => {
    const diff = Date.now() - ts;
    const day = 24 * 3600 * 1000;
    if (diff < day) return 'היום';
    if (diff < 2 * day) return 'אתמול';
    return new Date(ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
};

// ── Wizard renderers ───────────────────────────────────────────────────────────

const WizardStepCard: React.FC<{ step: number; question: string; hint: string; icon: string }> = ({ step, question, hint, icon }) => (
    <div className="bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-700/50 rounded-2xl p-4 shadow-sm w-full">
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
    const rows = [
        { icon: '🏷️', label: 'שם הנכס',   value: data.name || '—' },
        { icon: '🏢', label: 'סוג ייעוד',  value: data.type || '—' },
        { icon: '📐', label: 'שטח',        value: data.size ? `${Number(data.size).toLocaleString()} מ"ר` : '—' },
        { icon: '💰', label: 'תשואה',      value: data.roi ? `${data.roi}%` : '—' },
        { icon: '🔧', label: 'מצב',        value: data.condition || '—' },
        { icon: '📅', label: 'תחזוקה',     value: data.maintenance_due || '—' },
        { icon: '⚠️', label: 'רמת סיכון',  value: data.risk },
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

// ── Main component ─────────────────────────────────────────────────────────────

const GeoAI: React.FC = () => {
    const { standards, addAsset } = useData();
    const { user } = useAuth();

    // Sessions state — replaces single messages array
    const [sessions, setSessions] = useState<ChatSession[]>(() => initSessionData(user?.uid).sessions);
    const [activeId, setActiveId] = useState<string>(() => initSessionData(user?.uid).activeId);

    // Keep a ref so functional setState closures always see the current activeId
    const activeIdRef = useRef(activeId);
    useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

    // Derive current messages from active session
    const activeSession = sessions.find(s => s.id === activeId);
    const messages = activeSession?.messages ?? [GREETING];

    // Chat UI state
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    // Wizard state
    const [wizardStep, setWizardStep] = useState<number | null>(null);
    const [wizardData, setWizardData] = useState<Partial<WizardData>>({});
    const [awaitingConfirm, setAwaitingConfirm] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Persist all sessions to localStorage whenever state changes
    useEffect(() => {
        if (!user?.uid) return;
        localStorage.setItem(SESSIONS_KEY(user.uid), JSON.stringify({ sessions, activeId }));
    }, [sessions, activeId, user?.uid]);

    // Reload sessions when the logged-in user changes
    useEffect(() => {
        const data = initSessionData(user?.uid);
        setSessions(data.sessions);
        setActiveId(data.activeId);
        activeIdRef.current = data.activeId;
        setWizardStep(null);
        setWizardData({});
        setAwaitingConfirm(false);
    }, [user?.uid]);

    // ── Message helpers ────────────────────────────────────────────────────────

    const updateMessages = (updater: (prev: Message[]) => Message[]) => {
        setSessions(prev => prev.map(s => {
            if (s.id !== activeIdRef.current) return s;
            const newMsgs = updater(s.messages);
            // Auto-title: first user message becomes the session title
            const firstUser = newMsgs.find(m => m.role === 'user');
            const title = (s.title === 'שיחה חדשה' && firstUser)
                ? firstUser.content.slice(0, 35)
                : s.title;
            return { ...s, messages: newMsgs, updatedAt: Date.now(), title };
        }));
    };

    const pushAssistant = (content: string, extra?: Partial<Message>) =>
        updateMessages(prev => [...prev, { role: 'assistant', content, ...extra }]);

    // ── Session management ─────────────────────────────────────────────────────

    const startNewConversation = () => {
        const s = createNewSession();
        setSessions(prev => [s, ...prev]);
        setActiveId(s.id);
        activeIdRef.current = s.id;
        setWizardStep(null);
        setWizardData({});
        setAwaitingConfirm(false);
    };

    const switchSession = (id: string) => {
        if (id === activeId) return;
        setActiveId(id);
        activeIdRef.current = id;
        setWizardStep(null);
        setWizardData({});
        setAwaitingConfirm(false);
    };

    const deleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== id);
            if (filtered.length === 0) {
                const ns = createNewSession();
                setActiveId(ns.id);
                activeIdRef.current = ns.id;
                return [ns];
            }
            if (id === activeIdRef.current) {
                setActiveId(filtered[0].id);
                activeIdRef.current = filtered[0].id;
            }
            return filtered;
        });
    };

    const clearCurrentConversation = () => {
        setSessions(prev => prev.map(s => {
            if (s.id !== activeIdRef.current) return s;
            return { ...s, messages: [GREETING], title: 'שיחה חדשה', updatedAt: Date.now() };
        }));
        setWizardStep(null);
        setWizardData({});
        setAwaitingConfirm(false);
    };

    // ── Quick prompts ──────────────────────────────────────────────────────────

    const quickPrompts = [
        "הוסף נכס חדש",
        "מה התקן לגן ילדים?",
        "תכנן פרוגרמה ל-2000 יח\"ד",
        "הסבר על נספח צורכי ציבור",
    ];

    // ── Wizard flow ────────────────────────────────────────────────────────────

    const startWizard = () => {
        setWizardStep(0);
        setWizardData({});
        setAwaitingConfirm(false);
        pushAssistant('', { isWizard: true });
    };

    const handleWizardAnswer = (answer: string) => {
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
        const err = step.validate(answer);
        if (err) {
            pushAssistant(`⚠️ ${err}\n${step.hint}`);
            return;
        }

        const updated = { ...wizardData, [step.key]: answer.trim() };
        setWizardData(updated);

        const nextStep = wizardStep + 1;
        if (nextStep < TOTAL_STEPS) {
            setWizardStep(nextStep);
            pushAssistant('', { isWizard: true });
        } else {
            setWizardStep(TOTAL_STEPS);
            setAwaitingConfirm(true);
            pushAssistant('', { isSummary: true });
        }
    };

    // ── Send handler ───────────────────────────────────────────────────────────

    const handleSend = async (customText?: string) => {
        const textToSend = (customText || input).trim();
        if (!textToSend || loading) return;
        setInput('');
        updateMessages(prev => [...prev, { role: 'user', content: textToSend }]);

        const isWizardTrigger = TRIGGER_PHRASES.some(p =>
            textToSend.toLowerCase().includes(p.toLowerCase())
        );
        if (isWizardTrigger && wizardStep === null && !awaitingConfirm) {
            startWizard();
            return;
        }
        if (wizardStep !== null || awaitingConfirm) {
            handleWizardAnswer(textToSend);
            return;
        }

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

    // Which wizard step index corresponds to a message position
    const getWizardStepForMessage = (msgIdx: number): number => {
        let count = 0;
        for (let i = 0; i < msgIdx; i++) {
            if (messages[i].isWizard) count++;
        }
        return count;
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] fade-in">

            {/* ── Header ── */}
            <div className="mb-4 flex items-center justify-between">
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
                        onClick={clearCurrentConversation}
                        title="נקה שיחה נוכחית"
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

            {/* ── Body: chat + history sidebar ── */}
            <div className="flex flex-1 gap-4 min-h-0">

                {/* Chat area */}
                <div className="flex-1 bg-white dark:bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col overflow-hidden min-w-0">

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {messages.map((msg, idx) => {

                            if (msg.isWizard) {
                                const stepIdx = getWizardStepForMessage(idx);
                                const step = WIZARD_STEPS[Math.min(stepIdx, TOTAL_STEPS - 1)];
                                return (
                                    <div key={idx} className="flex justify-end">
                                        <div className="flex gap-4 max-w-[85%] flex-row-reverse">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <Bot className="w-6 h-6" />
                                            </div>
                                            <WizardStepCard step={stepIdx} question={step.question} hint={step.hint} icon={step.icon} />
                                        </div>
                                    </div>
                                );
                            }

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
                                    awaitingConfirm ? 'הקלד "כן" לשמירה או "לא" לביטול...'
                                    : wizardStep !== null ? 'הקלד את תשובתך...'
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

                {/* ── Sessions history sidebar ── */}
                <div className="hidden md:flex w-56 flex-col bg-white dark:bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex-shrink-0">

                    {/* New conversation button */}
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                        <button
                            onClick={startNewConversation}
                            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-all shadow-sm hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            שיחה חדשה
                        </button>
                    </div>

                    {/* Label */}
                    <div className="px-4 pt-3 pb-1 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            היסטוריית שיחות
                        </div>
                    </div>

                    {/* Sessions list */}
                    <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1 custom-scrollbar">
                        {sessions.map(s => (
                            <button
                                key={s.id}
                                onClick={() => switchSession(s.id)}
                                className={`group relative w-full text-right p-3 rounded-xl transition-all ${
                                    s.id === activeId
                                        ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700/50'
                                        : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <MessageSquare className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${s.id === activeId ? 'text-cyan-500' : 'text-slate-400'}`} />
                                    <div className="flex-1 min-w-0 text-right">
                                        <p className={`text-xs font-medium truncate leading-tight ${s.id === activeId ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {s.title}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(s.updatedAt)}</p>
                                    </div>
                                </div>
                                {/* Delete — appears on hover */}
                                <span
                                    role="button"
                                    onClick={(e) => deleteSession(s.id, e)}
                                    className="absolute top-2 left-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                    title="מחק שיחה"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Footer disclaimer ── */}
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
