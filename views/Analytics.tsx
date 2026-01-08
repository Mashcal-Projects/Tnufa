
import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { CHART_COLORS } from '../constants';
import { useData } from '../contexts/DataContext';

const Analytics: React.FC = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const { analytics, loading } = useData();
  
  // Default to first item if available, otherwise null
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Update selected ID when data loads
  useEffect(() => {
    if (analytics.length > 0 && selectedId === null) {
        setSelectedId(analytics[0].id);
    }
  }, [analytics, selectedId]);

  const selectedData = analytics.find(d => d.id === selectedId) || analytics[0];

  const barData = [
      { name: 'מבני ציבור', count: 12 },
      { name: 'מסחר נטוש', count: 19 },
      { name: 'שטח פתוח', count: 8 },
      { name: 'חניה', count: 15 },
      { name: 'תעשייה', count: 5 },
  ];

  if (loading) {
      return <div className="p-10 text-center text-slate-500">טוען נתונים...</div>;
  }

  if (!selectedData) {
      return (
        <div className="p-10 text-center text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl">
            אין נתונים להצגה. אנא וודא שגיליון "Analytics" מוגדר כראוי.
        </div>
      );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 p-6 rounded-xl min-h-[450px] flex flex-col shadow-sm dark:shadow-none transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">ניתוח פוטנציאל שטח חום</h3>
            <select 
                className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-cyan-500"
                value={selectedId || ''}
                onChange={(e) => setSelectedId(Number(e.target.value))}
            >
                {analytics.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>
          </div>
          
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700/50 grid grid-cols-2 gap-4">
             <div>
                <span className="block text-xs text-slate-400 dark:text-slate-500 uppercase">גודל</span>
                <span className="text-slate-800 dark:text-white font-medium">{selectedData.size}</span>
             </div>
             <div>
                <span className="block text-xs text-slate-400 dark:text-slate-500 uppercase">מבנים</span>
                <span className="text-slate-800 dark:text-white font-medium truncate">{selectedData.buildings}</span>
             </div>
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedData.radar}>
                <PolarGrid stroke={isDarkMode ? CHART_COLORS.grid : CHART_COLORS.lightGrid} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? CHART_COLORS.text : CHART_COLORS.lightText, fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                  name="מצב קיים"
                  dataKey="A"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.3}
                />
                <Radar
                  name="פוטנציאל"
                  dataKey="B"
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={2}
                  fill={CHART_COLORS.secondary}
                  fillOpacity={0.3}
                />
                <Legend formatter={(value) => <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', marginRight: 10 }}>{value}</span>} />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0', 
                        color: isDarkMode ? '#f1f5f9' : '#0f172a' 
                    }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 p-6 rounded-xl min-h-[450px] flex flex-col shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">התפלגות שטחים חומים לפי סוג</h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? CHART_COLORS.grid : CHART_COLORS.lightGrid} horizontal={false} />
                <XAxis type="number" stroke={isDarkMode ? CHART_COLORS.text : CHART_COLORS.lightText} tick={{fill: isDarkMode ? CHART_COLORS.text : CHART_COLORS.lightText}} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke={isDarkMode ? CHART_COLORS.text : CHART_COLORS.lightText} 
                  tick={{fill: isDarkMode ? CHART_COLORS.text : CHART_COLORS.lightText}} 
                  width={110} 
                  tickMargin={10}
                />
                <Tooltip 
                    cursor={{fill: 'rgba(128,128,128,0.1)'}}
                    contentStyle={{ 
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0', 
                        color: isDarkMode ? '#f1f5f9' : '#0f172a' 
                    }}
                />
                <Legend formatter={(value) => <span style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a', marginRight: 10 }}>{value}</span>} />
                <Bar dataKey="count" name="מספר נכסים" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
