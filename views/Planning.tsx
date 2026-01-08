
import React from 'react';
import { BookOpen, Info, GraduationCap, Cross, HeartPulse, TreeDeciduous } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Planning: React.FC = () => {
  const { standards } = useData();

  const getIcon = (category: string) => {
      switch(category) {
          case 'education': return GraduationCap;
          case 'religion': return Cross; 
          case 'health': return HeartPulse;
          case 'open_space': return TreeDeciduous;
          default: return BookOpen;
      }
  };

  const getColor = (category: string) => {
      switch(category) {
          case 'education': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10';
          case 'religion': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10';
          case 'health': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10';
          case 'open_space': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10';
          default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10';
      }
  };

  return (
    <div className="space-y-8 fade-in">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyan-100 dark:bg-cyan-500/10 rounded-xl">
                <BookOpen className="text-cyan-600 dark:text-cyan-400 w-8 h-8" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">סייר הנחיות המדריך (פרק ג')</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">מכסות שטח, פרוגרומות והנחיות תכנון למוסדות ציבור</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
            <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">תעודות זהות למוסדות (תקנים)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                    {standards.map((std) => {
                        const Icon = getIcon(std.category);
                        const colorClass = getColor(std.category);
                        
                        return (
                            <div key={std.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-5 hover:border-slate-400 dark:hover:border-slate-500 transition group">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                        {std.name}
                                    </h4>
                                    <div className={`p-2 rounded-lg ${colorClass}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>
                                
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                        <span className="text-slate-500 dark:text-slate-400">אוכלוסיית יעד:</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-medium">גילאי {std.targetPopulationAge[0]}-{std.targetPopulationAge[1]}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                        <span className="text-slate-500 dark:text-slate-400">שיעור השתתפות:</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-medium">{std.participationRate}%</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                        <span className="text-slate-500 dark:text-slate-400">גודל יחידה (כיתה):</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-medium">{std.classSize} איש</span>
                                    </div>
                                    
                                    <div className="pt-2 grid grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-slate-800 p-2 rounded text-center border border-slate-100 dark:border-none shadow-sm dark:shadow-none">
                                            <span className="block text-[10px] text-slate-500 uppercase">אפשרות א' (קרקע)</span>
                                            <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono text-lg">{std.landAllocation}</span>
                                            <span className="text-xs text-slate-400"> דונם</span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-2 rounded text-center border border-slate-100 dark:border-none shadow-sm dark:shadow-none">
                                            <span className="block text-[10px] text-slate-500 uppercase">אפשרות ב' (בנוי)</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-lg">{std.builtArea}</span>
                                            <span className="text-xs text-slate-400"> מ"ר</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm dark:shadow-none transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Info className="text-amber-500 dark:text-amber-400 w-5 h-5" /> עקרונות המדריך (פרק א')
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex gap-3">
                            <span className="text-cyan-600 dark:text-cyan-500 font-bold">1.</span>
                            מתן מענה לצורכי ציבור לא רק בקרקע אלא גם בשטח בנוי.
                        </li>
                        <li className="flex gap-3">
                            <span className="text-cyan-600 dark:text-cyan-500 font-bold">2.</span>
                            ניצול אינטנסיבי ורב-שימושי של הקרקע (עירוב שימושים).
                        </li>
                        <li className="flex gap-3">
                            <span className="text-cyan-600 dark:text-cyan-500 font-bold">3.</span>
                            אבחנה בין מתחם חדש (טיפוס B) למרקם בנוי והתחדשות עירונית (טיפוס C).
                        </li>
                        <li className="flex gap-3">
                            <span className="text-cyan-600 dark:text-cyan-500 font-bold">4.</span>
                            התאמה פרטנית של מאפייני אוכלוסיית היעד (מגזרים).
                        </li>
                    </ul>
                </div>

                <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm dark:shadow-none transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <TreeDeciduous className="text-emerald-500 dark:text-emerald-400 w-5 h-5" /> היררכיית שטחים פתוחים
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-emerald-200 dark:border-emerald-900/30">
                            <div>
                                <p className="text-slate-900 dark:text-white font-bold">סף הבית</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">עד 7 דקות הליכה</p>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">5-3 מ"ר/נפש</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-emerald-200 dark:border-emerald-900/30">
                            <div>
                                <p className="text-slate-900 dark:text-white font-bold">עירוני</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">פארקים וכיכרות</p>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">2 מ"ר/נפש</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-emerald-200 dark:border-emerald-900/30">
                            <div>
                                <p className="text-slate-900 dark:text-white font-bold">כלל-יישובי</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">יערות ופארקים גדולים</p>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">3 מ"ר/נפש</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Planning;
