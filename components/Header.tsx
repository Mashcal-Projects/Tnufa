
import React from 'react';
import { Search, Bell, User, LayoutGrid, ShieldCheck, Database, Zap } from 'lucide-react';
import { Theme } from '../App';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  theme: Theme;
}

const Header: React.FC<HeaderProps> = ({ theme }) => {
  const { loading, isDemoMode } = useData();
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className={`h-16 border-b backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between transition-colors duration-300
      ${theme === 'dark' ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'}`}>
      
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-[11px] font-bold transition-all
          ${isDemoMode 
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
          {isDemoMode ? <Zap className="w-3 h-3 animate-pulse" /> : <ShieldCheck className="w-3 h-3" />}
          {isDemoMode ? 'מצב דמו (Master)' : 'סביבת עבודה אישית'}
        </div>
        <span className={`hidden lg:block text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{currentDate}</span>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
        <div className="relative hidden sm:block">
          <Search className={`absolute right-3 top-2.5 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          <input 
            type="text" 
            placeholder="חיפוש נכס או גוש/חלקה..." 
            className={`border text-xs rounded-xl py-2 pr-10 pl-4 w-56 focus:ring-2 focus:ring-indigo-500 outline-none transition
              ${theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}
          />
        </div>
        
        <button className={`p-2 rounded-xl transition ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
          <Bell className="w-5 h-5" />
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-left hidden md:block text-right">
            <p className={`text-xs font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user?.email?.split('@')[0] || 'משתמש'}</p>
            <p className="text-[10px] text-slate-400 mt-1">ניהול מרחבי</p>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500'}`}>
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
