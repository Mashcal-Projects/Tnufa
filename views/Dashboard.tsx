
import React, { useState } from 'react';
import { Map, Ruler, Users, TreeDeciduous, Layers, AlertTriangle, Circle, ChevronUp, Info, Maximize2, Crosshair } from 'lucide-react';
import KPICard from '../components/KPICard';
import MapComponent from '../components/MapComponent';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { USER_MAP_LINKS } from '../data/userMaps';
import { Theme } from '../App';

interface DashboardProps {
    theme: Theme;
}

const Dashboard: React.FC<DashboardProps> = ({ theme }) => {
    const { dashboard, loading, assets } = useData();
    const { user } = useAuth();
    const [activeLayers, setActiveLayers] = useState({
        brownfields: true,
        zoning: false,
        infrastructure: false,
        schools: false,
        gov_planning: false
    });

    // Get user specific map link if exists
    const userMapLink = user?.email ? USER_MAP_LINKS[user.email] : null;

    const [activeSubLayers, setActiveSubLayers] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);
    const [isLegendOpen, setIsLegendOpen] = useState(true);

    const isDarkMode = theme === 'dark';

    const toggleLayer = (key: keyof typeof activeLayers) => {
        setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSubLayer = (id: number) => {
        setActiveSubLayers(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            'Ruler': Ruler,
            'TreeDeciduous': TreeDeciduous,
            'Users': Users,
            'AlertTriangle': AlertTriangle,
            'Map': Map,
        };
        return icons[iconName] || Circle;
    };

    const kpis = dashboard.filter(d => d.category === 'kpi');
    const progressItems = dashboard.filter(d => d.category === 'progress');
    const showLoading = loading && kpis.length === 0;

    const maintenanceAlerts = assets.filter(a => a.risk === 'גבוה' || a.condition.includes('דורש')).slice(0, 3);

    const iPlanLayers = [
        { id: 1, name: "שמות_ישובים" },
        { id: 2, name: "גבול_התכנית" },
        { id: 3, name: "גבול שינוי תממ" },
        { id: 4, name: "שטח בעל חדירות גבוהה למשקעים" },
        { id: 5, name: "שטח חשוף למטרדים" },
        { id: 6, name: "שטח למניעת זיהום מים" },
        { id: 7, name: "רגישויות" }
    ];

    const legendLayers = [
        { id: 'brownfields', label: 'שטחים חומים (שב"צ)', color: 'bg-rose-500' },
        { id: 'zoning', label: 'שטחים פתוחים (תשתית ירוקה)', color: 'bg-emerald-500' },
        { id: 'infrastructure', label: 'רשת דרכים (תשתית קשיחה)', color: 'bg-slate-400' },
        { id: 'schools', label: 'מוסדות חינוך קיימים', color: 'bg-blue-500' },
        { id: 'gov_planning', label: 'הנחיות סביבתיות (iPlan)', color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-6 fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {showLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-xl animate-pulse"></div>
                    ))
                ) : kpis.length > 0 ? (
                    kpis.map((kpi, index) => (
                        <KPICard
                            key={index}
                            title={kpi.title}
                            value={kpi.value}
                            trend={kpi.trend === 'up' ? 'up' : 'down'}
                            trendValue={kpi.trendValue || ''}
                            Icon={getIcon(kpi.icon)}
                            subtext={kpi.subtext}
                        />
                    ))
                ) : (
                    <div className="col-span-4 p-8 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                        חסרים נתונים בגיליון Dashboard.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Map className="text-cyan-600 dark:text-cyan-400 w-6 h-6" /> מפת ייעודי קרקע וניהול מרחבי
                        </h2>
                        <div className="flex gap-2">
                            <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-slate-500 hover:text-cyan-500 transition shadow-sm">
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="relative w-full h-[650px] bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden group">
                        {userMapLink ? (
                            <iframe
                                src={userMapLink}
                                className="w-full h-full border-0"
                                title="User Map"
                                allowFullScreen
                            />
                        ) : (
                            <>
                                <MapComponent isDarkMode={isDarkMode} activeLayers={activeLayers as any} activeSubLayers={activeSubLayers} />

                                <div className={`absolute top-4 left-4 bg-white/95 dark:bg-slate-900/90 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-[400] transition-all duration-300 overflow-hidden ${isLegendOpen ? 'w-80' : 'w-12 h-12'}`}>
                                    {isLegendOpen ? (
                                        <div className="p-4">
                                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <h4 className="text-slate-900 dark:text-white font-bold flex items-center gap-2 text-sm">
                                                    <Layers className="w-4 h-4 text-cyan-500" /> שכבות מידע
                                                </h4>
                                                <button onClick={() => setIsLegendOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-1.5 max-h-[450px] overflow-y-auto custom-scrollbar">
                                                {legendLayers.map(layer => (
                                                    <div key={layer.id}>
                                                        <div className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors group">
                                                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${layer.color}`}></div>
                                                                <span className={`text-[13px] ${activeLayers[layer.id as keyof typeof activeLayers] ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400'}`}>
                                                                    {layer.label}
                                                                </span>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={activeLayers[layer.id as keyof typeof activeLayers]}
                                                                    onChange={() => toggleLayer(layer.id as keyof typeof activeLayers)}
                                                                    className="accent-cyan-500 w-4 h-4 rounded-md mr-auto"
                                                                />
                                                            </label>

                                                            {(layer as any).canFocus && activeLayers[layer.id as keyof typeof activeLayers] && (
                                                                <button
                                                                    title="התמקדות בשכבה"
                                                                    className="mr-2 p-1 text-slate-400 hover:text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Crosshair className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {layer.id === 'gov_planning' && activeLayers.gov_planning && (
                                                            <div className="mr-7 mt-1 mb-2 pl-2 border-r-2 border-purple-200 dark:border-purple-800/50 pr-3 space-y-1">
                                                                {iPlanLayers.map((subLayer) => (
                                                                    <label key={subLayer.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1 rounded">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={activeSubLayers.includes(subLayer.id)}
                                                                            onChange={() => toggleSubLayer(subLayer.id)}
                                                                            className="accent-purple-500 w-3.5 h-3.5 rounded-sm"
                                                                        />
                                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                            {subLayer.name.replace(/_/g, ' ')}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <p className="text-[10px] text-slate-400 flex items-start gap-1.5 italic">
                                                    <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                                    נתוני iPlan מתעדכנים בזמן אמת.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsLegendOpen(true)} className="w-full h-full flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                            <Layers className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-rose-500 w-4 h-4" /> התראות תחזוקה דחופות
                        </h3>
                        <div className="space-y-3">
                            {maintenanceAlerts.length > 0 ? (
                                maintenanceAlerts.map((alert, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                                        alert.risk === 'גבוה'
                                            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 border-r-[3px] border-r-rose-500'
                                            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 border-r-[3px] border-r-amber-400'
                                    }`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{alert.name}</p>
                                                <p className={`text-[11px] mt-0.5 ${alert.risk === 'גבוה' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>{alert.condition}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                alert.risk === 'גבוה'
                                                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                            }`}>{alert.risk}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-xs text-slate-400 italic">אין התראות דחופות כרגע</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl flex flex-col shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users className="text-cyan-500 w-4 h-4" /> סטטוס מימוש פרוגרמה
                        </h3>
                        <div className="space-y-5 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-1">
                            {progressItems.map((item, idx) => {
                                const val = parseFloat(item.value);
                                const tgt = parseFloat(item.target);
                                const percentage = tgt > 0 ? (val / tgt) * 100 : 0;
                                const pct = Math.min(Math.round(percentage), 100);
                                return (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[13px] text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{item.title}</span>
                                            <span className={`text-xs font-bold tabular-nums ${pct >= 90 ? 'text-emerald-500' : pct >= 50 ? 'text-cyan-500' : 'text-rose-400'}`}>
                                                {pct}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${pct >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{item.value} / {item.target}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="mt-6 w-full py-2 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded-lg transition font-medium">
                            ניתוח צרכים מלא
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
