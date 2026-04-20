
import React, { useState, useEffect, useRef } from 'react';
import { Building2, Search, PlusCircle, MoreHorizontal, AlertTriangle, Zap, CheckCircle2, FilterX, X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Asset } from '../types';

const ASSET_TYPES = ['מבנה ציבורי', 'מגרש', 'מבנה מסחרי', 'מבנה תעשייתי', 'שטח פתוח', 'תשתית', 'כללי'];

// ── Wizard ────────────────────────────────────────────────────────────────────

interface WizardForm {
  name: string;
  type: string;
  size: string;
  roi: string;
  condition: string;
  maintenance_due: string;
  risk: Asset['risk'];
}

const STEPS = [
  { key: 'name',             label: 'שם הנכס',              hint: 'לדוגמה: "מרכז קהילתי צפון", "מגרש 14"',  type: 'text',   opts: null },
  { key: 'type',             label: 'סוג ייעוד',             hint: 'בחר את סוג השימוש בנכס',                type: 'select', opts: ASSET_TYPES },
  { key: 'size',             label: 'שטח (מ"ר)',             hint: 'הזן שטח במטרים רבועים',                 type: 'number', opts: null },
  { key: 'roi',              label: 'תשואה צפויה (%)',       hint: 'הזן אחוז תשואה צפויה',                  type: 'number', opts: null },
  { key: 'condition',        label: 'מצב הנכס',              hint: 'לדוגמה: "מתוחזק היטב", "דורש שיפוץ"',   type: 'text',   opts: null },
  { key: 'maintenance_due',  label: 'תאריך תחזוקה',          hint: 'תאריך התחזוקה הבאה',                    type: 'date',   opts: null },
  { key: 'risk',             label: 'רמת סיכון',             hint: 'בחר את רמת הסיכון של הנכס',             type: 'select', opts: ['נמוך', 'בינוני', 'גבוה'] },
] as const;

const STEP_ICONS = ['🏷️', '🏢', '📐', '💰', '🔧', '📅', '⚠️'];

interface AddAssetWizardProps {
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id'>) => void;
}

const AddAssetWizard: React.FC<AddAssetWizardProps> = ({ onClose, onSave }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>({
    name: '', type: 'כללי', size: '', roi: '', condition: '', maintenance_due: '', risk: 'נמוך',
  });
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  const isSummary = step === STEPS.length;
  const current = isSummary ? null : STEPS[step];
  const progress = Math.round((step / STEPS.length) * 100);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [step]);

  const validate = () => {
    if (!current) return true;
    const val = form[current.key as keyof WizardForm];
    if (current.key === 'name' && !String(val).trim()) { setError('שדה חובה — נא להזין שם'); return false; }
    if (current.key === 'condition' && !String(val).trim()) { setError('שדה חובה — נא לתאר את מצב הנכס'); return false; }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    setError('');
    setStep(s => s + 1);
  };

  const back = () => { setError(''); setStep(s => Math.max(0, s - 1)); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSummary) next();
  };

  const handleSave = () => {
    onSave({
      name: form.name.trim(),
      type: form.type,
      size: Number(form.size) || 0,
      roi: Number(form.roi) || 0,
      condition: form.condition.trim(),
      maintenance_due: form.maintenance_due,
      risk: form.risk,
    });
    setConfirmed(true);
    setTimeout(onClose, 1200);
  };

  const riskColor = (r: string) =>
    r === 'גבוה' ? 'text-rose-500' : r === 'בינוני' ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">הוספת נכס חדש</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400">
              {isSummary ? 'סיכום' : `שלב ${step + 1} מתוך ${STEPS.length}`}
            </span>
            <span className="text-[11px] text-slate-400">{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${isSummary ? 100 : progress}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-cyan-500' : i === step ? 'bg-cyan-400 ring-2 ring-cyan-200 dark:ring-cyan-800' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 min-h-[200px]">
          {confirmed ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Check className="w-7 h-7 text-white" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-lg">הנכס נשמר בהצלחה!</p>
            </div>
          ) : isSummary ? (
            /* Summary screen */
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">סיכום הנכס — אשר לפני שמירה:</p>
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 shrink-0">
                    <span>{STEP_ICONS[i]}</span> {s.label}
                  </span>
                  <span className={`text-sm font-bold text-right ${s.key === 'risk' ? riskColor(form.risk) : 'text-slate-900 dark:text-white'}`}>
                    {String(form[s.key as keyof WizardForm]) || '—'}
                    {s.key === 'size' && form.size ? ' מ"ר' : ''}
                    {s.key === 'roi' && form.roi ? '%' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Question screen */
            <div className="space-y-4" onKeyDown={handleKey}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{STEP_ICONS[step]}</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-base">{current!.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{current!.hint}</p>
                </div>
              </div>

              {current!.opts ? (
                <select
                  ref={inputRef as React.Ref<HTMLSelectElement>}
                  value={form[current!.key as keyof WizardForm]}
                  onChange={e => setForm(f => ({ ...f, [current!.key]: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500 transition"
                >
                  {current!.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  ref={inputRef as React.Ref<HTMLInputElement>}
                  type={current!.type}
                  value={form[current!.key as keyof WizardForm]}
                  onChange={e => { setError(''); setForm(f => ({ ...f, [current!.key]: e.target.value })); }}
                  placeholder={current!.hint}
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition ${
                    error ? 'border-rose-400' : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
              )}
              {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {!confirmed && (
          <div className="px-6 pb-5 flex gap-3">
            {step > 0 && !isSummary && (
              <button
                onClick={back}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" /> חזור
              </button>
            )}
            {isSummary ? (
              <>
                <button
                  onClick={back}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> עריכה
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-sm font-bold shadow-lg shadow-emerald-500/20 transition"
                >
                  <Check className="w-4 h-4" /> אשר ושמור נכס
                </button>
              </>
            ) : (
              <button
                onClick={next}
                className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-2.5 text-sm font-bold shadow-lg shadow-cyan-500/20 transition"
              >
                {step === STEPS.length - 1 ? 'לסיכום' : 'הבא'} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const getRiskColor = (risk: string) => {
    switch (risk) {
        case 'גבוה': return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-600/30';
        case 'בינוני': return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-600/30';
        default: return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-600/30';
    }
};

const getUrgencyStatus = (dateString: string, condition: string) => {
    const today = new Date();
    const maintenanceDate = new Date(dateString);
    const daysUntil = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (condition.includes("נזק") || condition.includes("קונסטרוקטיבי") || condition.includes("מיידי")) {
        return { text: "דחיפות קריטית", color: 'text-rose-500 dark:text-rose-400', icon: AlertTriangle };
    }
    if (daysUntil <= 60 && daysUntil > 0) {
        return { text: `תחזוקה ב-${daysUntil} ימים`, color: 'text-amber-500 dark:text-amber-400', icon: Zap };
    }
    if (daysUntil <= 0 && dateString !== "") {
        return { text: "פג תוקף תחזוקה", color: 'text-rose-500 dark:text-rose-400', icon: AlertTriangle };
    }
    return { text: "תקין", color: 'text-emerald-500 dark:text-emerald-400', icon: CheckCircle2 };
};

const Assets: React.FC = () => {
  const { assets, addAsset } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
    <div className="space-y-8 fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Building2 className="text-purple-500 dark:text-purple-400 w-8 h-8" /> ניהול נכסים ומבנים
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">מצאי הנכסים המשוייך למזהה המשתמש שלך</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="חיפוש נכס..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
                >
                    <PlusCircle className="w-4 h-4" /> הוסף נכס
                </button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xl transition-colors">
            {filteredAssets.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="p-5">שם הנכס</th>
                                <th className="p-5">סוג ייעוד</th>
                                <th className="p-5">שטח (מ"ר)</th>
                                <th className="p-5">תחזוקה</th>
                                <th className="p-5">רמת סיכון</th>
                                <th className="p-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300 text-sm">
                            {filteredAssets.map((asset) => {
                                const status = getUrgencyStatus(asset.maintenance_due, asset.condition);
                                const StatusIcon = status.icon;
                                
                                return (
                                    <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-cyan-500 mr-1" />
                                                <span className="font-black text-slate-900 dark:text-white">{asset.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                                {asset.type}
                                            </span>
                                        </td>
                                        <td className="p-5 font-mono text-xs text-slate-500 dark:text-slate-400">{asset.size > 0 ? asset.size.toLocaleString() : '-'}</td>
                                        <td className="p-5">
                                            <div className={`flex items-center gap-2 ${status.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                <span className="font-bold text-[11px] whitespace-nowrap">{status.text}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-tight ${getRiskColor(asset.risk)}`}>
                                                {asset.risk}
                                            </span>
                                        </td>
                                        <td className="p-5 text-slate-300 dark:text-slate-600 group-hover:text-cyan-500 cursor-pointer text-center transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <FilterX className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">לא נמצאו נכסים</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-2 text-sm">לא מצאנו נכסים המשוייכים למזהה שלך. וודא שעמודת ה-user_id בגיליון תואמת ל-UID שלך.</p>
                </div>
            )}
        </div>
    </div>

    {showModal && (
      <AddAssetWizard onClose={() => setShowModal(false)} onSave={addAsset} />
    )}
    </>
  );
};

export default Assets;
