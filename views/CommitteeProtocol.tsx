
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { SiteStatusItem, SITE_STATUSES } from '../types';
import { ScrollText, Printer, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  'זוהה': '#475569', 'בבדיקה': '#1d4ed8', 'בתכנון': '#b45309',
  'אושר': '#6d28d9', 'בביצוע': '#c2410c', 'הושלם': '#15803d',
};

function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// ─── Editable field ───────────────────────────────────────────────────────────

const EditableField: React.FC<{
  label: string; value: string;
  onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}> = ({ label, value, onChange, multiline, placeholder }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{label}</label>
    {multiline ? (
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
      />
    ) : (
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500"
      />
    )}
  </div>
);

// ─── Protocol Print View ──────────────────────────────────────────────────────

interface ProtocolData {
  meetingNumber: string;
  date: string;
  location: string;
  chairman: string;
  participants: string;
  selectedSites: string[];
  siteStatuses: SiteStatusItem[];
  priorApproval: string;
  openDiscussion: string;
  decisions: string;
  nextMeeting: string;
  extraAgenda: string;
}

const PrintView: React.FC<{ data: ProtocolData; onClose: () => void }> = ({ data, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8" />
        <title>פרוטוקול ועדת שטחים ציבוריים</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; direction: rtl; margin: 0; padding: 32px; color: #1e293b; font-size: 13px; line-height: 1.6; }
          h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
          h2 { font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; color: #0f172a; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 16px 0; font-size: 12px; }
          .meta-grid span { color: #475569; }
          .meta-grid strong { color: #0f172a; }
          .site-row { display: flex; align-items: flex-start; gap: 12px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
          .status-badge { font-size: 11px; font-weight: 700; border-radius: 9999px; padding: 2px 10px; white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
          .section-text { white-space: pre-wrap; font-size: 13px; color: #334155; min-height: 40px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 48px; }
          .sig-line { border-top: 1px solid #475569; padding-top: 4px; font-size: 11px; color: #475569; text-align: center; }
          .footer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 32px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const sitesForProtocol = data.selectedSites.length > 0
    ? data.siteStatuses.filter(s => data.selectedSites.includes(s.id))
    : data.siteStatuses;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1010, background: 'rgba(0,0,0,0.7)', overflow: 'auto', padding: 24 }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onClose} className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"><X size={16} /> סגור תצוגה מקדימה</button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Printer size={16} /> הדפס / שמור PDF
          </button>
        </div>

        <div ref={printRef} className="bg-white rounded-2xl p-8 shadow-2xl" style={{ color: '#1e293b', direction: 'rtl' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, textAlign: 'center', marginBottom: 4 }}>פרוטוקול ועדת שטחים ציבוריים</h1>
          {data.meetingNumber && <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginBottom: 16 }}>ישיבה מספר {data.meetingNumber}</p>}

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', background: '#f8fafc', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
            <div><span style={{ color: '#64748b' }}>תאריך: </span><strong>{formatDate(data.date)}</strong></div>
            <div><span style={{ color: '#64748b' }}>מקום: </span><strong>{data.location || '—'}</strong></div>
            <div><span style={{ color: '#64748b' }}>יו"ר: </span><strong>{data.chairman || '—'}</strong></div>
            <div><span style={{ color: '#64748b' }}>נוכחים: </span><span>{data.participants || '—'}</span></div>
          </div>

          {/* Agenda */}
          <h2 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 12, marginTop: 20 }}>סדר יום</h2>
          <ol style={{ paddingRight: 20, margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
            <li>אישור פרוטוקול ישיבה קודמת</li>
            <li>עדכון סטטוס שטחים ברשות</li>
            {data.extraAgenda && <li style={{ whiteSpace: 'pre-wrap' }}>{data.extraAgenda}</li>}
            <li>דיון פתוח</li>
            <li>החלטות וסיכום</li>
          </ol>

          {/* Prior approval */}
          <h2 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 12, marginTop: 20 }}>1. אישור פרוטוקול קודם</h2>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#334155', minHeight: 32, borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0' }}>
            {data.priorApproval || 'הפרוטוקול הקודם אושר פה אחד.'}
          </div>

          {/* Site statuses */}
          <h2 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 12, marginTop: 20 }}>2. עדכון סטטוס שטחים</h2>
          {sitesForProtocol.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>לא נבחרו שטחים.</p>
          ) : (
            <div>
              {sitesForProtocol.map((site, i) => (
                <div key={site.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 20, paddingTop: 2 }}>{i + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>{site.siteName}</strong>
                      {site.area && <span style={{ fontSize: 11, color: '#64748b' }}>{site.area}</span>}
                      <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[site.status] || '#475569', background: '#f8fafc', border: `1px solid #e2e8f0`, borderRadius: 9999, padding: '1px 8px', marginRight: 'auto' }}>{site.status}</span>
                    </div>
                    {site.notes && <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{site.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Open discussion */}
          <h2 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 12, marginTop: 20 }}>3. דיון פתוח</h2>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#334155', minHeight: 60, borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0' }}>
            {data.openDiscussion || ' '}
          </div>

          {/* Decisions */}
          <h2 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 12, marginTop: 20 }}>4. החלטות</h2>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#334155', minHeight: 60, borderRadius: 8, padding: '8px 12px', border: '1px solid #e2e8f0' }}>
            {data.decisions || ' '}
          </div>

          {/* Next meeting */}
          {data.nextMeeting && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 12, marginTop: 20 }}>5. ישיבה הבאה</h2>
              <p style={{ fontSize: 13, color: '#334155' }}>{data.nextMeeting}</p>
            </>
          )}

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginTop: 48 }}>
            {['יו"ר הוועדה', 'מזכיר הוועדה', 'נציג ציבור'].map(role => (
              <div key={role} style={{ borderTop: '1px solid #475569', paddingTop: 6, fontSize: 11, color: '#475569', textAlign: 'center' }}>{role}</div>
            ))}
          </div>

          <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 32 }}>
            נוצר על ידי מערכת תנופה — {new Date().toLocaleDateString('he-IL')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

const CommitteeProtocol: React.FC = () => {
  const { user }        = useAuth();
  const { analytics }   = useData();
  const [siteStatuses, setSiteStatuses] = useState<SiteStatusItem[]>([]);

  // Protocol form state
  const [meetingNumber, setMeetingNumber] = useState('');
  const [date, setDate]                   = useState(todayISO());
  const [location, setLocation]           = useState('');
  const [chairman, setChairman]           = useState('');
  const [participants, setParticipants]   = useState('');
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [priorApproval, setPriorApproval] = useState('');
  const [openDiscussion, setOpenDiscussion] = useState('');
  const [decisions, setDecisions]         = useState('');
  const [nextMeeting, setNextMeeting]     = useState('');
  const [extraAgenda, setExtraAgenda]     = useState('');
  const [showPrint, setShowPrint]         = useState(false);
  const [sitesExpanded, setSitesExpanded] = useState(true);

  // Load site statuses from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'siteStatus'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, snap => setSiteStatuses(snap.docs.map(d => ({ id: d.id, ...d.data() } as SiteStatusItem))));
    return () => unsub();
  }, [user]);

  const toggleSite = (id: string) =>
    setSelectedSites(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const selectAll   = () => setSelectedSites(siteStatuses.map(s => s.id));
  const deselectAll = () => setSelectedSites([]);

  const protocolData: ProtocolData = {
    meetingNumber, date, location, chairman, participants,
    selectedSites, siteStatuses,
    priorApproval, openDiscussion, decisions, nextMeeting, extraAgenda,
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">פרוטוקול ועדה</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">יצירת פרוטוקול לישיבת ועדת שטחים ציבוריים</p>
        </div>
        <button
          onClick={() => setShowPrint(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-3 rounded-xl transition-all active:scale-95"
          style={{ boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}
        >
          <Printer size={18} /><span className="hidden sm:inline">תצוגה מקדימה</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — meeting details */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <ScrollText size={15} className="text-cyan-500" /> פרטי הישיבה
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">מספר ישיבה</label>
                <input type="text" value={meetingNumber} onChange={e => setMeetingNumber(e.target.value)} placeholder="12" className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">תאריך</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
            <div className="mt-3">
              <EditableField label='מקום הישיבה' value={location} onChange={setLocation} placeholder='חדר ישיבות ראש הרשות' />
              <EditableField label='יו"ר הוועדה' value={chairman} onChange={setChairman} placeholder='שם מלא, תפקיד' />
              <EditableField label='משתתפים' value={participants} onChange={setParticipants} multiline placeholder={'ישראל ישראלי — ראש הרשות\nשרה לוי — מהנדסת הרשות\n...'} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">נושאים נוספים בסדר היום</h2>
            <EditableField label='' value={extraAgenda} onChange={setExtraAgenda} multiline placeholder='נושא נוסף 1&#10;נושא נוסף 2' />
          </div>

          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 space-y-1">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">תוכן הפרוטוקול</h2>
            <EditableField label='אישור פרוטוקול קודם' value={priorApproval} onChange={setPriorApproval} multiline placeholder='הפרוטוקול הקודם אושר פה אחד.' />
            <EditableField label='דיון פתוח' value={openDiscussion} onChange={setOpenDiscussion} multiline placeholder='רשום את עיקרי הדיון...' />
            <EditableField label='החלטות' value={decisions} onChange={setDecisions} multiline placeholder={'1. הוחלט ל...\n2. הוחלט ל...'} />
            <EditableField label='ישיבה הבאה' value={nextMeeting} onChange={setNextMeeting} placeholder='תאריך ומקום הישיבה הבאה' />
          </div>
        </div>

        {/* Right column — site selection */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              שטחים לדיון ({selectedSites.length > 0 ? selectedSites.length : 'כל'} מתוך {siteStatuses.length})
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setSitesExpanded(p => !p)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                {sitesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {sitesExpanded && (
            <>
              {siteStatuses.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm">לא נמצאו שטחים במעקב.</p>
                  <p className="text-xs mt-1">הוסף שטחים בלשונית "מעקב סטטוס"</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-3">
                    <button onClick={selectAll} className="text-xs text-cyan-600 hover:text-cyan-500 font-bold transition-colors">בחר הכל</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={deselectAll} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">נקה בחירה</button>
                  </div>

                  {/* Group by status */}
                  {SITE_STATUSES.map(status => {
                    const inStatus = siteStatuses.filter(s => s.status === status);
                    if (inStatus.length === 0) return null;
                    return (
                      <div key={status} className="mb-3">
                        <div className="text-[11px] font-bold mb-1.5" style={{ color: STATUS_COLOR[status] }}>{status}</div>
                        <div className="space-y-1.5">
                          {inStatus.map(site => {
                            const checked = selectedSites.includes(site.id);
                            return (
                              <label key={site.id} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSite(site.id)}
                                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className={`text-sm font-medium transition-colors ${checked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {site.siteName}
                                  </span>
                                  {site.area && <span className="text-xs text-slate-400 mr-2">{site.area}</span>}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Analytics sites (from Google Sheets) as extras */}
              {analytics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-slate-400 mb-2">שטחים מניתוח (Google Sheets)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.map(a => (
                      <span key={a.id} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 9999, padding: '2px 10px', fontSize: 11 }}>{a.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Print Preview */}
      {showPrint && <PrintView data={protocolData} onClose={() => setShowPrint(false)} />}
    </div>
  );
};

export default CommitteeProtocol;
