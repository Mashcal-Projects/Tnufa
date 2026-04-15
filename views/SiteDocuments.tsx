
import React, { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, deleteDoc, doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { SiteDocument } from '../types';
import {
  Plus, X, Trash2, FileText, Image as ImageIcon,
  Download, Upload, AlertCircle, Loader2, FolderOpen, Search,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 700 * 1024; // ~700 KB (leaves room for base64 overhead in 1MB Firestore doc)

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.onload  = e => resolve(e.target!.result as string);
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon size={20} className="text-purple-500" />;
  if (type === 'application/pdf')  return <FileText  size={20} className="text-rose-500"   />;
  return <FileText size={20} className="text-slate-400" />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  siteNames: string[];
  onClose: () => void;
  onSave: (data: Omit<SiteDocument, 'id' | 'userId' | 'uploadedAt'>) => Promise<void>;
}

const UploadModal: React.FC<UploadModalProps> = ({ siteNames, onClose, onSave }) => {
  const [siteName, setSiteName]   = useState(siteNames[0] ?? '');
  const [customSite, setCustomSite] = useState('');
  const [useCustom, setUseCustom]  = useState(siteNames.length === 0);
  const [notes, setNotes]          = useState('');
  const [file, setFile]            = useState<File | null>(null);
  const [fileData, setFileData]    = useState<string | null>(null);
  const [uploading, setUploading]  = useState(false);
  const [error, setError]          = useState<string | null>(null);
  const fileRef                    = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setError(`הקובץ גדול מדי (${formatBytes(f.size)}). מקסימום ${formatBytes(MAX_FILE_BYTES)}.`);
      return;
    }
    setError(null);
    setFile(f);
    const b64 = await readFileAsBase64(f);
    setFileData(b64);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = useCustom ? customSite.trim() : siteName;
    if (!name) { setError('יש לבחור שם שטח'); return; }
    if (!file || !fileData) { setError('יש לבחור קובץ'); return; }
    setUploading(true); setError(null);
    try {
      await onSave({
        siteName: name,
        fileName: file.name,
        fileType: file.type,
        fileData,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'שגיאה בהעלאה');
      setUploading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full" style={{ maxWidth: 480 }}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">העלאת מסמך לשטח</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}

          {/* Site selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">שטח / נכס</label>
            {!useCustom && siteNames.length > 0 ? (
              <div className="flex gap-2">
                <select
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {siteNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button type="button" onClick={() => setUseCustom(true)} className="px-3 text-xs text-cyan-600 hover:text-cyan-500 border border-slate-200 dark:border-slate-600 rounded-xl">חדש</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text" value={customSite} onChange={e => setCustomSite(e.target.value)}
                  placeholder="הזן שם שטח..."
                  className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {siteNames.length > 0 && (
                  <button type="button" onClick={() => setUseCustom(false)} className="px-3 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">רשימה</button>
                )}
              </div>
            )}
          </div>

          {/* File upload area */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              קובץ (מקסימום {formatBytes(MAX_FILE_BYTES)})
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              className="hover:border-cyan-400"
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  {fileIcon(file.type)}
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setFileData(null); }} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={16} /></button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Upload size={24} />
                  <span className="text-sm">לחץ לבחירת קובץ</span>
                  <span className="text-xs">PDF, תמונות, Word, Excel ועוד</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">הערות (אופציונלי)</label>
            <input
              type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="תוכנית מפורטת, אישור רשות, תמונת שטח..."
              className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={uploading} className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? 'מעלה...' : 'העלה מסמך'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Document Row ─────────────────────────────────────────────────────────────

const DocRow: React.FC<{ doc_: SiteDocument; onDelete: () => void }> = ({ doc_, onDelete }) => {
  const isImage = doc_.fileType.startsWith('image/');

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = doc_.fileData;
    a.download = doc_.fileName;
    a.click();
  };

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 group hover:shadow-sm transition-all">
      {isImage ? (
        <img src={doc_.fileData} alt={doc_.fileName} className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-600 flex-shrink-0" />
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {fileIcon(doc_.fileType)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc_.fileName}</p>
        {doc_.notes && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{doc_.notes}</p>}
        <p className="text-xs text-slate-400">{formatDate(doc_.uploadedAt)}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={handleDownload} className="p-2 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors" title="הורד"><Download size={14} /></button>
        <button onClick={onDelete} className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors" title="מחק"><Trash2 size={14} /></button>
      </div>
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

const SiteDocuments: React.FC = () => {
  const { user }                        = useAuth();
  const [docs, setDocs]                 = useState<SiteDocument[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [search, setSearch]             = useState('');
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'siteDocuments'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q,
      snap => { setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SiteDocument))); setLoading(false); },
      err => { console.error('SiteDocuments error:', err); setError('שגיאה בטעינת המסמכים'); setLoading(false); }
    );
    return () => unsub();
  }, [user]);

  const handleSave = async (data: Omit<SiteDocument, 'id' | 'userId' | 'uploadedAt'>) => {
    if (!user) return;
    await addDoc(collection(db, 'siteDocuments'), { ...data, userId: user.uid, uploadedAt: new Date().toISOString() });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'siteDocuments', id));
    setConfirmDelete(null);
  };

  const siteNames   = Array.from(new Set(docs.map(d => d.siteName))).sort();
  const filtered    = docs.filter(d => {
    const matchSite   = !selectedSite || d.siteName === selectedSite;
    const matchSearch = !search || d.fileName.includes(search) || d.siteName.includes(search) || d.notes.includes(search);
    return matchSite && matchSearch;
  });

  // Group by site
  const grouped: Record<string, SiteDocument[]> = {};
  filtered.forEach(d => { (grouped[d.siteName] ??= []).push(d); });

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">מסמכי שטח</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">תוכניות, אישורים ותמונות לכל שטח חום</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-3 rounded-xl transition-all active:scale-95"
          style={{ boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}
        >
          <Plus size={18} /><span className="hidden sm:inline">העלה מסמך</span>
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute right-3 top-3.5 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם קובץ, שטח..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        {siteNames.length > 1 && (
          <select
            value={selectedSite ?? ''}
            onChange={e => setSelectedSite(e.target.value || null)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">כל השטחים</option>
            {siteNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </div>

      {/* Stats */}
      {docs.length > 0 && (
        <div className="flex gap-4 flex-wrap">
          {[
            { label: 'מסמכים', value: docs.length },
            { label: 'שטחים', value: siteNames.length },
            { label: 'תמונות', value: docs.filter(d => d.fileType.startsWith('image/')).length },
            { label: 'PDF', value: docs.filter(d => d.fileType === 'application/pdf').length },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
              <span style={{ fontSize: 20, fontWeight: 800, color: '#06b6d4' }}>{s.value}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 gap-3 text-rose-500"><AlertCircle size={20} /><span>{error}</span></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(6,182,212,0.25)' }}>
            <FolderOpen size={32} color="white" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-600 dark:text-slate-300 text-lg">{search || selectedSite ? 'לא נמצאו תוצאות' : 'טרם הועלו מסמכים'}</p>
            <p className="text-sm mt-1">{search || selectedSite ? 'נסה לשנות את הסינון' : 'העלה תוכניות, אישורים ותמונות'}</p>
          </div>
          {!search && !selectedSite && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-3 rounded-xl transition-all mt-2" style={{ boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}>
              <Upload size={16} /> העלה מסמך ראשון
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'he')).map(([site, siteDocs]) => (
            <div key={site}>
              <div className="flex items-center gap-3 mb-3">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
                <h3 className="font-bold text-slate-900 dark:text-white">{site}</h3>
                <span style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 9999, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>{siteDocs.length}</span>
              </div>
              <div className="space-y-2 mr-4">
                {siteDocs.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).map(d => (
                  <DocRow key={d.id} doc_={d} onDelete={() => setConfirmDelete(d.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <UploadModal
          siteNames={siteNames}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">מחיקת מסמך</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">האם אתה בטוח? לא ניתן לבטל פעולה זו.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors">מחק</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-3 rounded-xl transition-colors">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteDocuments;
