
import React, { useEffect, useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  trend: 'up' | 'down';
  trendValue: string;
  Icon: LucideIcon;
  subtext: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, trendValue, Icon, subtext }) => {
  const isUp = trend === 'up';
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // Extract the first number from the value string (e.g. "15,400 ד'" → "15400")
    const match = value.match(/(\d[\d,]*\.?\d*)/);
    if (!match) { setDisplayValue(value); return; }

    const numericStr = match[1].replace(/,/g, '');
    const target = parseFloat(numericStr);
    if (isNaN(target) || target === 0) { setDisplayValue(value); return; }

    const FRAMES = 40;
    const DURATION = 900; // ms
    const increment = target / FRAMES;
    let current = 0;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      current = Math.min(current + increment, target);

      if (frame >= FRAMES) {
        clearInterval(timer);
        setDisplayValue(value); // restore original formatted string at the end
      } else {
        const rounded = target % 1 === 0 ? Math.round(current) : parseFloat(current.toFixed(1));
        const formatted = rounded.toLocaleString('he-IL');
        setDisplayValue(value.replace(match[1], formatted));
      }
    }, DURATION / FRAMES);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 p-6 rounded-xl flex flex-col justify-between hover:shadow-lg transition-all duration-200 shadow-sm relative overflow-hidden group">

      {/* Always-visible top accent bar */}
      <div
        style={{
          position: 'absolute', top: 0, right: 0,
          width: '100%', height: '4px',
          background: isUp
            ? 'linear-gradient(to left, #06b6d4, #3b82f6)'
            : 'linear-gradient(to left, #f43f5e, #e11d48)',
        }}
      />

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
          <div className="text-slate-900 dark:text-slate-100 text-3xl font-bold tracking-tight tabular-nums">
            {displayValue}
          </div>
        </div>

        {/* Icon — scales on card hover, colour matches trend */}
        <div className={`p-3 rounded-xl transition-transform duration-200 group-hover:scale-110 ${
          isUp
            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
            : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className={`flex items-center text-sm font-medium ${isUp ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {isUp ? <TrendingUp className="w-4 h-4 ml-1" /> : <TrendingDown className="w-4 h-4 ml-1" />}
          {trendValue}
        </div>
        <span className="text-slate-400 dark:text-slate-500 text-xs">{subtext}</span>
      </div>
    </div>
  );
};

export default KPICard;
