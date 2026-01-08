
import React, { useState } from 'react';
import { Building2, Search, PlusCircle, MoreHorizontal, AlertTriangle, Zap, CheckCircle2, FilterX } from 'lucide-react';
import { useData } from '../contexts/DataContext';

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
  const { assets } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
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
                <button className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap">
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
  );
};

export default Assets;
