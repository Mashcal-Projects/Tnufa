import React, { useState, useEffect, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { CHART_COLORS } from "../constants";
import { useData } from "../contexts/DataContext";

const BAR_DATA = [
  { name: "מבני ציבור", count: 12 },
  { name: "מסחר נטוש", count: 19 },
  { name: "שטח פתוח", count: 8 },
  { name: "חניה", count: 15 },
  { name: "תעשייה", count: 5 },
];

// Colour scale: lowest count → cyan, highest → rose
const BAR_PALETTE = ['#06b6d4', '#22d3ee', '#fbbf24', '#fb923c', '#f43f5e'];
const BAR_COLORS: Record<number, string> = (() => {
  const sorted = [...BAR_DATA]
    .map((d, i) => ({ i, count: d.count }))
    .sort((a, b) => a.count - b.count);
  return sorted.reduce((acc, { i }, rank) => {
    acc[i] = BAR_PALETTE[rank];
    return acc;
  }, {} as Record<number, string>);
})();

const Analytics: React.FC = () => {
  const isDarkMode = document.documentElement.classList.contains("dark");
  const { analytics, loading } = useData();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [animationActive, setAnimationActive] = useState(true);
  const BAR_HEIGHT = 32;
  const BAR_GAP = 14;
  const TOP_BOTTOM_PADDING = 24;

  // enough height so bars don't squash
  const chartHeight =
    BAR_DATA.length * (BAR_HEIGHT + BAR_GAP) + TOP_BOTTOM_PADDING;

  // Definitive fix: Disable all active animations after 2 seconds to ensure everything stays static
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationActive(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Set initial selection
  useEffect(() => {
    if (analytics.length > 0 && selectedId === null) {
      setSelectedId(analytics[0].id);
    }
  }, [analytics, selectedId]);

  // Memoize data to prevent re-render jitter
  const selectedData = useMemo(() => {
    return analytics.find((d) => d.id === selectedId) || analytics[0];
  }, [analytics, selectedId]);

  // Potential score: average of B values as % of max (150)
  const potentialScore = useMemo(() => {
    if (!selectedData) return 0;
    const avg = selectedData.radar.reduce((sum, d) => sum + d.B, 0) / selectedData.radar.length;
    return Math.round((avg / 150) * 100);
  }, [selectedData]);

  if (loading) {
    return (
      <div className="p-20 text-center text-slate-500">
        <div className="inline-block w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <div className="font-black text-lg">טוען נתונים...</div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="p-10 text-center text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-3xl">
        אין נתונים להצגה. וודא שחיבור האינטרנט תקין.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart Card */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm h-[580px] flex flex-col relative overflow-visible ">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-normal text-slate-900 dark:text-white">
                ניתוח פוטנציאל שטח חום
              </h3>
              <div className="flex flex-col items-center bg-cyan-500/10 border border-cyan-200 dark:border-cyan-800/50 rounded-xl px-3 py-1">
                <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 tabular-nums leading-tight">{potentialScore}%</span>
                <span className="text-[9px] text-slate-400 leading-tight">ציון פוטנציאל</span>
              </div>
            </div>
            <select
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 font-bold transition-all"
              value={selectedId || ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {analytics.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-center">
              <span className="block text-[16px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1 tracking-wider">
                גודל
              </span>

              <span
                className="text-slate-800 dark:text-white  text-xs leading-tight 
                 line-clamp-2"
              >
                {selectedData.size}
              </span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-center">
              <span className="block text-[16px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1 tracking-wider">
                מבנים
              </span>
              <span
                className="text-slate-800 dark:text-white  text-xs leading-tight 
                 line-clamp-2"
              >
                {selectedData.buildings}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="70%"
                data={selectedData.radar}
              >
                <PolarGrid
                  stroke={
                    isDarkMode ? CHART_COLORS.grid : CHART_COLORS.lightGrid
                  }
                  strokeWidth={1}
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{
                    fill: isDarkMode
                      ? CHART_COLORS.text
                      : CHART_COLORS.lightText,
                    fontSize: 13,
                  }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 150]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="מצב קיים"
                  dataKey="A"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={4}
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.4}
                  isAnimationActive={animationActive}
                  animationDuration={animationActive ? 1200 : 0}
                  animationBegin={0}
                />
                <Radar
                  name="פוטנציאל"
                  dataKey="B"
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={4}
                  fill={CHART_COLORS.secondary}
                  fillOpacity={0.4}
                  isAnimationActive={animationActive}
                  animationDuration={animationActive ? 1200 : 0}
                  animationBegin={0}
                />
                <Tooltip isAnimationActive={false} />
                <Legend
                  verticalAlign="bottom"
                  height={40}
                  wrapperStyle={{
                    paddingTop: "20px",
                    // color: isDarkMode ? CHART_COLORS.text : CHART_COLORS.lightText,
                    color: "gray",
                    fontSize: 14,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-sm h-[580px] flex flex-col relative overflow-hidden">
          <h1 className="text-xl font-normal text-slate-900 dark:text-white mb-6 text-center mt-2">
            התפלגות שטחים חומים לפי סוג
          </h1>

          {/* Legend OUTSIDE the ResponsiveContainer so it won't squeeze the plot */}
          <div className="flex-1 min-h-0 overflow-auto pr-2">
            <div style={{ height: chartHeight, minHeight: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={BAR_DATA}
                  margin={{ top: 10, right: 0, left: -40, bottom: 10 }}
                  barCategoryGap={BAR_GAP}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={
                      isDarkMode ? CHART_COLORS.grid : CHART_COLORS.lightGrid
                    }
                    horizontal={false}
                    vertical
                  />
                  <XAxis type="number" />

                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={(props) => {
                      const { x, y, payload } = props;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={-6}
                            y={0}
                            dy={5}
                            textAnchor="start"
                            fill={
                              isDarkMode
                                ? CHART_COLORS.text
                                : CHART_COLORS.lightText
                            }
                            fontSize={14}
                            className="font-medium"
                            style={{
                              direction: "rtl",
                              unicodeBidi: "plaintext",
                            }}
                          >
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                    width={120}
                    stroke={
                      isDarkMode ? CHART_COLORS.text : CHART_COLORS.lightText
                    }
                  />

                  <Tooltip
                    isAnimationActive={false}
                    cursor={{ fill: "rgba(128,128,128,0.05)" }}
                  />

                  {/* remove Legend from inside the chart */}
                  <Bar
                    dataKey="count"
                    name="מספר נכסים"
                    radius={[0, 10, 10, 0]}
                    barSize={BAR_HEIGHT}
                    isAnimationActive={animationActive}
                    animationDuration={animationActive ? 1200 : 0}
                    animationBegin={0}
                  >
                    {BAR_DATA.map((_, index) => (
                      <Cell key={index} fill={BAR_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Simple legend footer (won't shrink chart area) */}
          <div className="pt-4 text-sm text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" />
            <span>מספר נכסים</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
