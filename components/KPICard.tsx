
import React from 'react';
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
  
  return (
    <div className="bg-white dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 p-6 rounded-xl flex flex-col justify-between hover:shadow-md transition-all shadow-sm dark:shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
          <div className="text-slate-900 dark:text-slate-100 text-3xl font-bold tracking-tight">{value}</div>
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
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
