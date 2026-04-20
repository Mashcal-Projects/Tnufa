
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { FieldVisit } from '../types';
import {
  Plus, X, Camera, Calendar, MapPin, Edit2, Trash2,
  Filter, Loader2, ClipboardList, AlertCircle,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const PREDEFINED_TAGS = [
  'פנייה לדיירים',
  'בדיקת מהנדס',
  'ועדה',
  'סיור שטח',
  'תיעוד נזקים',
  'פגישה עם בעלי עניין',
  'מעקב ובקרה',
  'אחר',
];

const TAG_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  'פנייה לדיירים':        { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'בדיקת מהנדס':          { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  'ועדה':                 { bg: '#fdf4ff', color: '#7e22ce', border: '#d8b4fe' },
  'סיור שטח':             { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'תיעוד נזקים':          { bg: '#fff1f2', color: '#be123c', border: '#fda4af' },
  'פגישה עם בעלי עניין':  { bg: '#f0f9ff', color: '#0369a1', border: '#7dd3fc' },
  'מעקב ובקרה':           { bg: '#fefce8', color: '#a16207', border: '#fde047' },
  'אחר':                  { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' },
};

function getTagStyle(tag: string) {
  return TAG_STYLE[tag] ?? { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' };
}

// ─── Image compression ────────────────────────────────────────────────────────

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image load error'));
      img.onload = () => {
        const MAX_W = 800, MAX_H = 600;
        let w = img.width, h = img.height;
        if (w > MAX_W) { h = Math.round((h * MAX_W) / w); w = MAX_W; }
        if (h > MAX_H) { w = Math.round((w * MAX_H) / h); h = MAX_H; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context error'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Tag Pill ─────────────────────────────────────────────────────────────────

const TagPill: React.FC<{ tag: string; onRemove?: () => void; small?: boolean }> = ({ tag, onRemove, small }) => {
  const s = getTagStyle(tag);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: '9999px',
      padding: small ? '2px 8px' : '3px 10px',
      fontSize: small ? '11px' : '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: s.color, display: 'flex', alignItems: 'center' }}
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
};

// ─── Visit Modal ──────────────────────────────────────────────────────────────

interface ModalProps {
  visit?: FieldVisit | null;
  onClose: () => void;
  onSave: (data: Omit<FieldVisit, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
}

const VisitModal: React.FC<ModalProps> = ({ visit, onClose, onSave }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]               = useState(visit?.date ?? today);
  const [siteName, setSiteName]       = useState(visit?.siteName ?? '');
  const [description, setDescription] = useState(visit?.description ?? '');
  const [tags, setTags]               = useState<string[]>(visit?.tags ?? []);
  const [photos, setPhotos]           = useState<string[]>(visit?.photos ?? []);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setLoadingPhotos(true);
    try {
      const compressed = await Promise.all(files.map(compressImage));
      setPhotos(prev => [...prev, ...compressed].slice(0, 5));
    } catch {
      setError('שגיאה בטעינת התמונה');
    } finally {
      setLoadingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) { setError('יש להזין שם שטח'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ date, siteName: siteName.trim(), description: description.trim(), tags, photos });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'שגיאה בשמירת הביקור');
      setSaving(false);
    }
  };

  return createPortal(<div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-[560px] flex flex-col max-h-[85vh]">

        {/* Header — fixed */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {visit ? 'עריכת ביקור' : 'תיעוד ביקור חדש'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Date + Site Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">תאריך ביקור</label>
              <div className="relative">
                <Calendar size={14} className="absolute right-3 top-3.5 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl pr-9 pl-3 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">שם השטח / הנכס</label>
              <div className="relative">
                <MapPin size={14} className="absolute right-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  placeholder="מגרש 12, רחוב הרצל..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl pr-9 pl-3 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">תגיות</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map(tag => {
                const selected = tags.includes(tag);
                const s = getTagStyle(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={selected ? {
                      background: s.bg, color: s.color,
                      border: `2px solid ${s.color}`,
                      borderRadius: '9999px', padding: '4px 12px',
                      fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    } : {
                      background: 'transparent', color: '#94a3b8',
                      border: '2px solid #e2e8f0',
                      borderRadius: '9999px', padding: '4px 12px',
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">תיאור הביקור</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="תאר את ממצאי הביקור, מצב השטח, פעולות שנעשו..."
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              תצלומים ({photos.length}/5)
            </label>
            <div className="flex flex-wrap gap-3">
              {photos.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt={`תמונה ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-600" />
                  <button
                    type="button"
                    onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -left-2 w-5 h-5 bg-rose-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ cursor: 'pointer' }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadingPhotos}
                  className="w-20 h-20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-cyan-400 hover:text-cyan-500 transition-colors"
                  style={{ cursor: 'pointer' }}
                >
                  {loadingPhotos ? <Loader2 size={18} className="animate-spin" /> : (
                    <><Camera size={18} /><span style={{ fontSize: '10px' }}>הוסף</span></>
                  )}
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoChange} />
          </div>

          </div>{/* end scrollable body */}

          {/* Actions — fixed at bottom */}
          <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {visit ? 'שמור שינויים' : 'שמור ביקור'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>, document.body);
};

// ─── Visit Card ───────────────────────────────────────────────────────────────

const VisitCard: React.FC<{
  visit: FieldVisit;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ visit, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group">
      <div style={{ height: '3px', background: 'linear-gradient(to left, #06b6d4, #3b82f6)' }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#f0f9ff', color: '#0369a1',
                border: '1px solid #bae6fd',
                borderRadius: '6px', padding: '2px 8px',
                fontSize: '11px', fontWeight: 600,
              }}>
                <Calendar size={10} />
                {formatDate(visit.date)}
              </span>
              {visit.photos.length > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  background: '#f8fafc', color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px', padding: '2px 8px',
                  fontSize: '11px',
                }}>
                  <Camera size={10} />
                  {visit.photos.length}
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">{visit.siteName}</h3>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2 flex-shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors" title="ערוך">
              <Edit2 size={14} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors" title="מחק">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Tags */}
        {visit.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {visit.tags.map(tag => <TagPill key={tag} tag={tag} small />)}
          </div>
        )}

        {/* Description */}
        {visit.description && (
          <div>
            <p
              className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: expanded ? undefined : 3,
                WebkitBoxOrient: 'vertical',
                overflow: expanded ? 'visible' : 'hidden',
              } as React.CSSProperties}
            >
              {visit.description}
            </p>
            {visit.description.length > 150 && (
              <button onClick={() => setExpanded(p => !p)} className="text-xs text-cyan-500 hover:text-cyan-400 mt-1 font-medium">
                {expanded ? 'הצג פחות' : 'הצג הכל'}
              </button>
            )}
          </div>
        )}

        {/* Photo strip */}
        {visit.photos.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto custom-scrollbar pb-1">
            {visit.photos.map((src, i) => (
              <img key={i} src={src} alt={`תמונה ${i + 1}`} className="h-20 w-28 object-cover rounded-lg flex-shrink-0 border border-slate-200 dark:border-slate-600" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

const FieldVisits: React.FC = () => {
  const { user } = useAuth();
  const [visits, setVisits]             = useState<FieldVisit[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [editingVisit, setEditingVisit] = useState<FieldVisit | null>(null);
  const [activeTag, setActiveTag]       = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Real-time Firestore listener
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'fieldVisits'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as FieldVisit));
        items.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        setVisits(items);
        setLoading(false);
      },
      (err) => {
        console.error('FieldVisits error:', err);
        setError('שגיאה בטעינת יומן הביקורים');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const handleSave = async (data: Omit<FieldVisit, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    if (editingVisit) {
      await updateDoc(doc(db, 'fieldVisits', editingVisit.id), { ...data });
    } else {
      await addDoc(collection(db, 'fieldVisits'), {
        ...data,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });
    }
    setEditingVisit(null);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'fieldVisits', id));
    setConfirmDelete(null);
  };

  const handleEdit = (visit: FieldVisit) => {
    setEditingVisit(visit);
    setShowModal(true);
  };

  const usedTags: string[] = Array.from(new Set(visits.flatMap(v => v.tags)));
  const filtered    = activeTag ? visits.filter(v => v.tags.includes(activeTag)) : visits;

  return (
    <div className="fade-in space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">יומן ביקורים לשטח</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">תיעוד ביקורות שטח, ממצאים ופעולות</p>
        </div>
        <button
          onClick={() => { setEditingVisit(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition-all active:scale-95"
          style={{ boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">ביקור חדש</span>
        </button>
      </div>

      {/* Stats bar */}
      {visits.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'סה"כ ביקורים', value: visits.length, color: '#06b6d4' },
            { label: 'השבוע', value: visits.filter(v => { const d = new Date(v.date); const now = new Date(); const diff = (now.getTime() - d.getTime()) / 86400000; return diff <= 7; }).length, color: '#3b82f6' },
            { label: 'עם תצלומים', value: visits.filter(v => v.photos.length > 0).length, color: '#8b5cf6' },
            { label: 'תגיות שונות', value: usedTags.length, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tag filter */}
      {usedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Filter size={12} /> סנן:
          </span>
          <button
            onClick={() => setActiveTag(null)}
            style={{
              borderRadius: '9999px', padding: '4px 12px', fontSize: '12px',
              fontWeight: activeTag === null ? 700 : 500, cursor: 'pointer',
              background: activeTag === null ? '#0e7490' : 'transparent',
              color: activeTag === null ? '#fff' : '#94a3b8',
              border: activeTag === null ? '2px solid #0e7490' : '2px solid #e2e8f0',
            }}
          >
            הכל ({visits.length})
          </button>
          {usedTags.map(tag => {
            const s = getTagStyle(tag);
            const isActive = activeTag === tag;
            const count = visits.filter(v => v.tags.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(isActive ? null : tag)}
                style={{
                  borderRadius: '9999px', padding: '4px 12px', fontSize: '12px',
                  fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                  background: isActive ? s.bg : 'transparent',
                  color: isActive ? s.color : '#94a3b8',
                  border: isActive ? `2px solid ${s.color}` : '2px solid #e2e8f0',
                }}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 gap-3 text-rose-500">
          <AlertCircle size={20} /><span>{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(6,182,212,0.25)' }}>
            <ClipboardList size={32} color="white" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-600 dark:text-slate-300 text-lg">
              {activeTag ? `אין ביקורים עם תגית "${activeTag}"` : 'טרם תועד אף ביקור'}
            </p>
            <p className="text-sm mt-1">{activeTag ? 'נסה להסיר את הסינון' : 'לחץ על "ביקור חדש" כדי להתחיל'}</p>
          </div>
          {!activeTag && (
            <button
              onClick={() => { setEditingVisit(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-3 rounded-xl transition-all mt-2"
              style={{ boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}
            >
              <Plus size={16} /> תעד ביקור ראשון
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(visit => (
            <VisitCard
              key={visit.id}
              visit={visit}
              onEdit={() => handleEdit(visit)}
              onDelete={() => setConfirmDelete(visit.id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <VisitModal
          visit={editingVisit}
          onClose={() => { setShowModal(false); setEditingVisit(null); }}
          onSave={handleSave}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">מחיקת ביקור</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              האם אתה בטוח שברצונך למחוק ביקור זה? לא ניתן לבטל פעולה זו.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors">
                מחק
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-3 rounded-xl transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldVisits;
