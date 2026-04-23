
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { SiteStatusItem, SiteStatusValue, SITE_STATUSES } from '../types';
import {
  Plus, X, Edit2, Trash2, ChevronLeft,
  AlertCircle, Loader2, Workflow,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<SiteStatusValue, { color: string; bg: string; border: string; dot: string }> = {
  'זוהה':   { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8' },
  'בבדיקה': { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  'בתכנון': { color: '#b45309', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  'אושר':   { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', dot: '#8b5cf6' },
  'בביצוע': { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316' },
  'הושלם':  { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
};

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  item?: SiteStatusItem | null;
  initialStatus?: SiteStatusValue;
  onClose: () => void;
  onSave: (data: Omit<SiteStatusItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const SiteModal: React.FC<ModalProps> = ({ item, initialStatus, onClose, onSave }) => {
  const [siteName, setSiteName] = useState(item?.siteName ?? '');
  const [status, setStatus]     = useState<SiteStatusValue>(item?.status ?? initialStatus ?? 'זוהה');
  const [area, setArea]         = useState(item?.area ?? '');
  const [notes, setNotes]       = useState(item?.notes ?? '');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) { setError('יש להזין שם שטח'); return; }
    setSaving(true); setError(null);
    try {
      await onSave({ siteName: siteName.trim(), status, area: area.trim(), notes: notes.trim() });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'שגיאה בשמירה');
      setSaving(false);
    }
  };

  const cfg = STATUS_CFG[status];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-[500px] flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl">
              <Workflow size={18} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {item ? 'עריכת שטח' : 'הוספת שטח חדש'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">מלא את פרטי השטח</p>
            </div>
          </div>
          <button
            type="button" onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 text-rose-600 dark:text-rose-400 text-sm">
                <AlertCircle size={16} />{error}
              </div>
            )}

            {/* Site name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                שם השטח / הנכס <span className="text-rose-400">*</span>
              </label>
              <input
                type="text" value={siteName} onChange={e => setSiteName(e.target.value)}
                placeholder="מגרש 12, מתחם התעשייה..."
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>

            {/* Area + Status side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">שטח (דונם)</label>
                <input
                  type="text" value={area} onChange={e => setArea(e.target.value)}
                  placeholder='120 ד"ר'
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">סטטוס</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as SiteStatusValue)}
                  style={{ borderColor: cfg.border }}
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                >
                  {SITE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Status preview badge */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold"
              style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
              סטטוס נוכחי: {status}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">הערות</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="פרטים נוספים על השטח..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500 resize-none transition-all"
              />
            </div>

          </div>

          {/* Footer actions */}
          <div className="flex-shrink-0 px-6 py-5 border-t border-slate-100 dark:border-slate-700 flex gap-3">
            <button
              type="submit" disabled={saving}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {item ? 'שמור שינויים' : 'הוסף שטח'}
            </button>
            <button
              type="button" onClick={onClose}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              ביטול
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};

// ─── Site Card ────────────────────────────────────────────────────────────────

const SiteCard: React.FC<{
  item: SiteStatusItem;
  onEdit: () => void;
  onDelete: () => void;
  onAdvance: () => void;
  isLast: boolean;
}> = ({ item, onEdit, onDelete, onAdvance, isLast }) => {
  const cfg = STATUS_CFG[item.status];
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{item.siteName}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit} className="p-1 rounded text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"><Edit2 size={12} /></button>
          <button onClick={onDelete} className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Trash2 size={12} /></button>
        </div>
      </div>
      {item.area && <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">{item.area}</p>}
      {item.notes && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2 line-clamp-2">{item.notes}</p>}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-slate-400">{new Date(item.updatedAt).toLocaleDateString('he-IL')}</span>
        {!isLast && (
          <button
            onClick={onAdvance}
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '2px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            קדם <ChevronLeft size={11} />
          </button>
        )}
        {isLast && (
          <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>✓ הושלם</span>
        )}
      </div>
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

const SiteStatus: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems]               = useState<SiteStatusItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [editingItem, setEditingItem]   = useState<SiteStatusItem | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<SiteStatusValue>('זוהה');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'siteStatus'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q,
      snap => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as SiteStatusItem))); setLoading(false); },
      err => { console.error('SiteStatus error:', err); setError('שגיאה בטעינת הנתונים'); setLoading(false); }
    );
    return () => unsub();
  }, [user]);

  const handleSave = async (data: Omit<SiteStatusItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    if (editingItem) {
      await updateDoc(doc(db, 'siteStatus', editingItem.id), { ...data, updatedAt: now });
    } else {
      await addDoc(collection(db, 'siteStatus'), { ...data, userId: user.uid, createdAt: now, updatedAt: now });
    }
    setEditingItem(null);
  };

  const handleAdvance = async (item: SiteStatusItem) => {
    const idx = SITE_STATUSES.indexOf(item.status);
    if (idx < SITE_STATUSES.length - 1) {
      await updateDoc(doc(db, 'siteStatus', item.id), { status: SITE_STATUSES[idx + 1], updatedAt: new Date().toISOString() });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'siteStatus', id));
    setConfirmDelete(null);
  };

  const totalByStatus = (s: SiteStatusValue) => items.filter(i => i.status === s).length;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">מעקב סטטוס שטחים</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">workflow ויזואלי לכל שלבי הטיפול בשטח</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setDefaultStatus('זוהה'); setShowModal(true); }}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-3 rounded-xl transition-all active:scale-95"
          style={{ boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}
        >
          <Plus size={18} /><span className="hidden sm:inline">שטח חדש</span>
        </button>
      </div>

      {/* Progress bar across all statuses */}
      {items.length > 0 && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">התפלגות שטחים לפי שלב</span>
            <span className="text-xs text-slate-400">{items.length} שטחים סה"כ</span>
          </div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            {SITE_STATUSES.map(s => {
              const pct = items.length > 0 ? (totalByStatus(s) / items.length) * 100 : 0;
              if (pct === 0) return null;
              const cfg = STATUS_CFG[s];
              return <div key={s} style={{ width: `${pct}%`, background: cfg.dot, minWidth: 4 }} title={`${s}: ${totalByStatus(s)}`} />;
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {SITE_STATUSES.map(s => {
              const cfg = STATUS_CFG[s];
              const count = totalByStatus(s);
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{s} <strong style={{ color: cfg.color }}>({count})</strong></span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 gap-3 text-rose-500"><AlertCircle size={20} /><span>{error}</span></div>
      ) : (
        <div className="overflow-x-auto pb-4 custom-scrollbar -mx-2 px-2">
          <div style={{ display: 'flex', gap: '12px', minWidth: `${SITE_STATUSES.length * 220}px` }}>
            {SITE_STATUSES.map((status, idx) => {
              const cfg = STATUS_CFG[status];
              const colItems = items.filter(i => i.status === status);
              return (
                <div key={status} style={{ flex: '0 0 210px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Column Header */}
                  <div
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{status}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, background: cfg.border, color: cfg.color, borderRadius: 9999, padding: '1px 7px' }}>{colItems.length}</span>
                      <button
                        onClick={() => { setEditingItem(null); setDefaultStatus(status); setShowModal(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, display: 'flex', padding: 2, borderRadius: 4 }}
                        title="הוסף לעמודה"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Arrow between columns */}
                  {idx < SITE_STATUSES.length - 1 && (
                    <div style={{ height: 0 }} /> /* spacing handled by gap */
                  )}

                  {/* Cards */}
                  <div className="space-y-2">
                    {colItems.map(item => (
                      <SiteCard
                        key={item.id}
                        item={item}
                        isLast={status === 'הושלם'}
                        onEdit={() => { setEditingItem(item); setShowModal(true); }}
                        onDelete={() => setConfirmDelete(item.id)}
                        onAdvance={() => handleAdvance(item)}
                      />
                    ))}
                    {colItems.length === 0 && (
                      <div
                        style={{ border: `2px dashed ${cfg.border}`, borderRadius: 12, padding: '20px 12px', textAlign: 'center', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
                        onClick={() => { setEditingItem(null); setDefaultStatus(status); setShowModal(true); }}
                      >
                        + הוסף שטח
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flow legend */}
      <div className="flex items-center gap-2 flex-wrap">
        {SITE_STATUSES.map((s, i) => {
          const cfg = STATUS_CFG[s];
          return (
            <React.Fragment key={s}>
              <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 9999, padding: '3px 10px' }}>{s}</span>
              {i < SITE_STATUSES.length - 1 && <ChevronLeft size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <SiteModal
          item={editingItem}
          initialStatus={defaultStatus}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSave={handleSave}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                <Trash2 size={18} className="text-rose-500" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">מחיקת שטח</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">האם אתה בטוח? לא ניתן לבטל פעולה זו.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors active:scale-95">מחק</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-3 rounded-xl transition-colors">ביטול</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SiteStatus;
