
import React, { useState, useMemo } from 'react';
import { Calculator, Users, Ruler, School, MapPin, RefreshCw, Info } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ProgrammaticInputs, RequirementResult } from '../types';
import { CHART_COLORS } from '../constants';
import { useData } from '../contexts/DataContext';

const Calculators: React.FC = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const { settlements, standards, loading, refreshData } = useData();

  const [selectedCity, setSelectedCity] = useState<string>("");
  const [inputs, setInputs] = useState<ProgrammaticInputs>({
    housingUnits: 1000,
    avgHouseholdSize: 3.2, 
    sector: 'general',
    settlementType: 'urban_new'
  });

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const cityName = e.target.value;
      setSelectedCity(cityName);
      const cityData = settlements.find(c => c.name === cityName);
      
      if (cityData) {
          setInputs(prev => ({
              ...prev,
              settlementType: cityData.type
          }));
      }
  };

  const handleInputChange = (key: keyof ProgrammaticInputs, value: string | number) => {
    setInputs(prev => ({
        ...prev,
        [key]: value
    }));
  };

  const results = useMemo(() => {
    const population = inputs.housingUnits * inputs.avgHouseholdSize;

    const requirements: RequirementResult[] = standards.map(std => {
        // --- LOGIC SOURCE: "Standards" Sheet -> population_ratio column ---
        // If the sheet has 0.07, it means 7% of population.
        // If missing, we default to logic below for backward compatibility, but priority is sheet.
        
        let ratio = std.populationRatio;
        
        // Hardcoded fallbacks if sheet is empty (only for safety)
        if (!ratio) {
            if (std.id === 'daycare') ratio = 0.07; 
            else if (std.id === 'kindergarten') ratio = 0.06; 
            else if (std.id === 'elementary') ratio = 0.12; 
            else if (std.id === 'highschool') ratio = 0.10; 
            else ratio = 1.0; 
        }

        // Special logic for religious buildings (driven by Sector Input)
        if (std.id === 'synagogue') {
             const religiousRate = inputs.sector === 'haredi' ? 0.9 : 0.2;
             ratio = religiousRate * 0.49;
        }

        const targetPop = population * ratio;
        const participatingPop = targetPop * (std.participationRate / 100);
        const requiredUnits = Math.ceil(participatingPop / std.classSize);
        
        let unitsPerInstitution = 1;
        // Default institutions sizes (could also be moved to sheet)
        if (std.id === 'elementary') unitsPerInstitution = 18;
        if (std.id === 'highschool') unitsPerInstitution = 24;
        if (std.id === 'daycare') unitsPerInstitution = 3;
        if (std.id === 'kindergarten') unitsPerInstitution = 3;

        const requiredInstitutions = Math.ceil(requiredUnits / unitsPerInstitution);

        // --- LOGIC SOURCE: "Standards" Sheet -> land_allocation & built_area columns ---
        let landArea = 0;
        let builtArea = 0;

        // Apply different factors based on Settlement Type Input
        const landFactor = inputs.settlementType === 'urban_renewal' ? 0.7 : 1.0;

        if (std.id === 'open_space_local') {
            const openSpaceFactor = inputs.settlementType === 'urban_renewal' ? 3 : 5; 
            landArea = participatingPop * openSpaceFactor; 
        } else {
            landArea = requiredUnits * std.landAllocation * landFactor; 
            builtArea = requiredUnits * std.builtArea; 
        }

        return {
            facilityName: std.name,
            requiredUnits,
            requiredInstitutions,
            totalLandArea: Number(landArea.toFixed(2)),
            totalBuiltArea: Number(builtArea.toFixed(0))
        };
    });

    return { population, requirements };
  }, [inputs, standards]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 fade-in pb-10">
      
      {/* Input Panel */}
      <div className="md:col-span-4 space-y-6 flex flex-col">
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm dark:shadow-none transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="text-cyan-500 dark:text-cyan-400 w-6 h-6" /> מחולל פרוגרמה
            </h3>
            <button 
                onClick={refreshData} 
                className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition ${loading ? 'animate-spin' : ''}`}
                title="רענן נתונים"
            >
                <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          
          <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg border border-cyan-100 dark:border-cyan-800 mb-6 flex gap-3">
             <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
             <p className="text-xs text-cyan-800 dark:text-cyan-200 leading-relaxed">
                 חישוב זה משלב את <strong>הנתונים שלך</strong> (כאן למטה) עם <strong>טבלת התקנים (Standards)</strong> מהגיליון כדי להפיק את הגרפים.
             </p>
          </div>
          
          <div className="space-y-5">
            <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> בחר יישוב (גיליון Settlements)
                </label>
                <select 
                    value={selectedCity}
                    onChange={handleCityChange}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors"
                >
                    <option value="">-- בחר יישוב מהרשימה --</option>
                    {settlements.sort((a,b) => a.name.localeCompare(b.name)).map(city => (
                        <option key={city.name} value={city.name}>{city.name}</option>
                    ))}
                </select>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">מספר יחידות דיור (יח"ד)</label>
                <input 
                    type="number"
                    value={inputs.housingUnits}
                    onChange={(e) => handleInputChange('housingUnits', Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors"
                />
            </div>

            <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">גודל משק בית ממוצע</label>
                <input 
                    type="number"
                    step="0.1"
                    value={inputs.avgHouseholdSize}
                    onChange={(e) => handleInputChange('avgHouseholdSize', Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">שיוך מגזרי</label>
                    <select 
                        value={inputs.sector}
                        onChange={(e) => handleInputChange('sector', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors"
                    >
                        <option value="general">יהודי כללי</option>
                        <option value="haredi">חרדי</option>
                        <option value="arab">ערבי</option>
                        <option value="druze">דרוזי</option>
                    </select>
                </div>

                <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">סוג יישוב</label>
                    <select 
                        value={inputs.settlementType}
                        onChange={(e) => handleInputChange('settlementType', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors"
                    >
                        <option value="urban_new">מתחם חדש</option>
                        <option value="urban_renewal">התחדשות</option>
                        <option value="rural">כפרי/קהילתי</option>
                    </select>
                </div>
            </div>
          </div>
        </div>

        {/* Population Summary Card */}
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 p-6 rounded-xl flex-1 flex flex-col justify-center items-center shadow-sm dark:shadow-none transition-colors">
            <Users className="text-emerald-500 dark:text-emerald-400 w-10 h-10 mb-3" />
            <h4 className="text-slate-500 dark:text-slate-400 text-sm">אוכלוסייה חזויה (שמ"ב)</h4>
            <div className="text-4xl font-black text-slate-900 dark:text-white mt-2">
                {results.population.toLocaleString()}
            </div>
            <p className="text-slate-500 text-xs mt-2">נפשות (מחושב בזמן אמת)</p>
        </div>
      </div>

      {/* Results Panel */}
      <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Requirements Table */}
          <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex-1 shadow-sm dark:shadow-none transition-colors">
             <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">פרוגרמה כמותית למוסדות ציבור</h3>
                <span className="text-xs bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
                   מקור נתונים: גיליון Standards
                </span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase">
                        <tr>
                            <th className="p-4">ייעוד</th>
                            <th className="p-4">כמות יחידות (כיתות/מושבים)</th>
                            <th className="p-4">מוסדות נדרשים</th>
                            <th className="p-4 text-cyan-600 dark:text-cyan-400">אפשרות א': קרקע (דונם)</th>
                            <th className="p-4 text-emerald-600 dark:text-emerald-400">אפשרות ב': בנוי (מ"ר)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 text-slate-700 dark:text-slate-200 text-sm">
                        {results.requirements.map((req, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition">
                                <td className="p-4 font-medium">{req.facilityName}</td>
                                <td className="p-4">{req.requiredUnits}</td>
                                <td className="p-4">
                                    {req.facilityName.includes('שצ"פ') ? '-' : req.requiredInstitutions}
                                </td>
                                <td className="p-4 font-mono font-bold text-cyan-600 dark:text-cyan-300">
                                    {req.totalLandArea > 0 ? req.totalLandArea.toFixed(2) : '-'}
                                </td>
                                <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-300">
                                    {req.totalBuiltArea > 0 ? req.totalBuiltArea.toLocaleString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>

          {/* Visualization */}
          <div className="grid grid-cols-2 gap-6 h-64">
             <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex flex-col shadow-sm dark:shadow-none">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-cyan-500" /> ניתוח שטחי קרקע (דונם)
                </h4>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.requirements.filter(r => r.totalLandArea > 0)}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? CHART_COLORS.grid : CHART_COLORS.lightGrid} vertical={false} />
                            <XAxis dataKey="facilityName" hide />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                                    borderColor: isDarkMode ? '#334155' : '#e2e8f0', 
                                    color: isDarkMode ? '#f1f5f9' : '#0f172a' 
                                }}
                                formatter={(value) => [`${value} דונם`]}
                            />
                            <Bar dataKey="totalLandArea" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]}>
                                {results.requirements.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? CHART_COLORS.primary : '#0891b2'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex flex-col shadow-sm dark:shadow-none">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <School className="w-4 h-4 text-emerald-500" /> שטחי בנייה נדרשים (מ"ר)
                </h4>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.requirements.filter(r => r.totalBuiltArea > 0)}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? CHART_COLORS.grid : CHART_COLORS.lightGrid} vertical={false} />
                            <XAxis dataKey="facilityName" hide />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                                    borderColor: isDarkMode ? '#334155' : '#e2e8f0', 
                                    color: isDarkMode ? '#f1f5f9' : '#0f172a' 
                                }}
                                formatter={(value) => [`${value} מ"ר`]}
                            />
                            <Bar dataKey="totalBuiltArea" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
          </div>

      </div>
    </div>
  );
};

export default Calculators;
