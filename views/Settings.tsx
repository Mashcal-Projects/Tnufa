
import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Check, ExternalLink, Link2, ShieldCheck, RefreshCw, Layers, Copy, AlertCircle, FileSpreadsheet, Lock, UserCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { refreshData, loading, error: dataError } = useData();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
      if (user?.uid) {
          navigator.clipboard.writeText(user.uid);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const spreadsheetUrl = "https://docs.google.com/spreadsheets/d/1HnQhzoeuHUUF6uL9lFD6fEOmLxBNvjEIsmM7jpfTlms/edit";

  return (
    <div className="space-y-8 fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
                <SettingsIcon className="text-white w-8 h-8" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">הגדרות סביבת עבודה</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ניהול זהות וסנכרון מול בסיס הנתונים המרכזי</p>
            </div>
        </div>
        <button 
            onClick={refreshData} 
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-xl hover:bg-indigo-500 transition active:scale-95 disabled:opacity-50"
        >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            סנכרן נתונים
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Identity Panel */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500" />
                
                <div className="flex items-center gap-3 mb-6">
                    <UserCircle className="w-8 h-8 text-indigo-500" />
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">זהות משתמש במערכת</h3>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8">
                    <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">מזהה ייחודי לסנכרון (UID)</p>
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <code className="flex-1 font-mono text-sm text-indigo-600 dark:text-indigo-400 font-bold break-all">
                            {user?.uid || 'לא מחובר'}
                        </code>
                        <button 
                            onClick={handleCopyId}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white'}`}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'הועתק!' : 'העתק מזהה'}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-bold mb-1">איך זה עובד?</p>
                            <p className="text-xs leading-relaxed opacity-80">
                                המערכת משתמשת בגיליון מרכזי אחד. כדי לראות את הנתונים שלך, עליך להוסיף עמודה בשם <span className="font-mono font-bold">user_id</span> בגיליון ה-Google Sheets ולהדביק בה את המזהה האישי שלך המופיע למעלה.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <a 
                href={spreadsheetUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl text-white shadow-xl hover:scale-[1.01] transition-transform group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black">פתח את גיליון הנתונים המרכזי</h4>
                        <p className="text-sm opacity-60">הוסף, ערוך או מחק שורות המשויכות למזהה שלך</p>
                    </div>
                </div>
                <ExternalLink className="w-6 h-6 group-hover:translate-x-[-4px] transition-transform" />
            </a>
        </div>

        {/* Logic Info */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-3xl shadow-sm">
                <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" /> אבטחת מידע
                </h4>
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold dark:text-white">סינון צד-לקוח</p>
                            <p className="text-[10px] text-slate-500 mt-1">שורות שאינן שייכות לך אינן מוצגות בממשק המשתמש שלך.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold dark:text-white">מבנה קשיח</p>
                            <p className="text-[10px] text-slate-500 mt-1">עמודת ה-user_id היא חובה בכל הטאבים של הגיליון.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
