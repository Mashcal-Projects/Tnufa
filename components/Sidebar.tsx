
import React from 'react';
import {
  Home,
  BarChart3,
  Calculator,
  Building2,
  BookOpen,
  Settings,
  LogOut,
  Sun,
  Moon,
  Brain,
  Coins,
  ClipboardList,
  Workflow,
  FolderOpen,
  ScrollText,
} from 'lucide-react';
import { ViewState } from '../types';
import { Theme } from '../App';

interface SidebarProps {
  activeTab: ViewState;
  setActiveTab: (tab: ViewState) => void;
  theme: Theme;
  toggleTheme: () => void;
  onLogout?: () => void;
  role?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, theme, toggleTheme, onLogout, role }) => {
  const menuItems = [
    { id: 'dashboard', label: 'לוח בקרה ראשי', icon: Home },
    { id: 'calculators', label: 'מחולל פרוגרמה', icon: Calculator },
    { id: 'funding', label: 'מימון ובינוי', icon: Coins },
    { id: 'planning', label: 'סייר המדריך (תקנים)', icon: BookOpen },
    { id: 'assets', label: 'מצאי נכסים קיים', icon: Building2 },
    { id: 'analytics', label: 'ניתוח ודוחות', icon: BarChart3 },
    { id: 'fieldvisits', label: 'יומן ביקורים', icon: ClipboardList },
    { id: 'sitestatus', label: 'מעקב סטטוס שטחים', icon: Workflow },
    { id: 'sitedocs', label: 'מסמכי שטח', icon: FolderOpen },
    { id: 'protocol', label: 'פרוטוקול ועדה', icon: ScrollText },
    { id: 'geoai', label: 'Geo AI (בינה מלאכותית)', icon: Brain },
  ];

  return (
    <aside className={`w-20 lg:w-64 border-l flex-shrink-0 flex flex-col py-6 gap-2 h-screen transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0 text-white font-bold text-lg">
          ת
        </div>
        <span className={`text-xl font-black tracking-wide hidden lg:block ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          תנופה <span className="text-cyan-500">.</span>
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ViewState)}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold'
                  : theme === 'dark'
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }
              `}
            >
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-l-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-500' : 'group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
              <span className="hidden lg:block text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className={`mt-auto px-6 pt-4 border-t flex flex-col gap-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-4 px-4 py-2 rounded-lg w-full transition ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="hidden lg:block text-sm font-medium">{theme === 'dark' ? 'מצב יום' : 'מצב לילה'}</span>
        </button>

        {role === 'admin' && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-4 px-4 py-2 rounded-lg w-full transition ${activeTab === 'settings'
              ? 'bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-white'
              : theme === 'dark'
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Settings className="w-5 h-5" />
            <span className="hidden lg:block text-sm font-medium">הגדרות מערכת</span>
          </button>
        )}

        <button
          onClick={onLogout}
          className={`flex items-center gap-4 px-4 py-2 rounded-lg w-full transition text-rose-500 hover:text-rose-600 ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block text-sm font-medium">התנתק</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
