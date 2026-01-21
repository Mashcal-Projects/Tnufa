
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './views/Dashboard';
import Calculators from './views/Calculators';
import Assets from './views/Assets';
import Planning from './views/Planning';
import Analytics from './views/Analytics';
import Settings from './views/Settings';
import GeoAI from './views/GeoAI';
import Funding from './views/Funding';
import { ViewState } from './types';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogIn, ShieldCheck, Mail, Lock, AlertCircle, Loader2, UserPlus, ArrowRight } from 'lucide-react';

export type Theme = 'dark' | 'light';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewState>('dashboard');
  const [theme, setTheme] = useState<Theme>('light');
  const { user, profile, loading: authLoading, login, signup, logout } = useAuth();

  // Login/Register Form State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setFormError(null);
    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setFormError('האימייל כבר קיים במערכת. נסה להתחבר.');
      } else if (err.code === 'auth/weak-password') {
        setFormError('הסיסמה חלשה מדי. השתמש ב-6 תווים לפחות.');
      } else if (err.code === 'auth/invalid-credential') {
        setFormError('שם משתמש או סיסמה לא נכונים.');
      } else {
        setFormError('שגיאה בביצוע הפעולה. וודא שחיבור האינטרנט תקין.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard theme={theme} />;
      case 'calculators':
        return <Calculators />;
      case 'assets':
        return <Assets />;
      case 'planning':
        return <Planning />;
      case 'analytics':
        return <Analytics />;
      case 'geoai':
        return <GeoAI />;
      case 'funding':
        return <Funding />;
      case 'settings':
        return profile?.role === 'admin' ? <Settings /> : <Dashboard theme={theme} />;
      default:
        return <Dashboard theme={theme} />;
    }
  };

  if (authLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'} dir-rtl`}>
        <div className="max-w-md w-full p-4 lg:p-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-8 fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                  <span className="text-white text-4xl font-black">ת</span>
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  {isRegisterMode ? 'יצירת חשבון חדש' : 'ברוכים הבאים'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm italic">מערכת תנופה לניהול מרחבי חכם</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 mr-2">אימייל</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@authority.gov.il"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 mr-2">סיסמה</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-all dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl disabled:opacity-50 disabled:scale-100"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isRegisterMode ? (
                  <UserPlus className="w-5 h-5" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {isRegisterMode ? 'צור חשבון והתחבר' : 'התחברות למערכת'}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setFormError(null);
                }}
                className="text-sm font-bold text-cyan-600 hover:text-cyan-500 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {isRegisterMode ? (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    כבר יש לך חשבון? התחבר כאן
                  </>
                ) : (
                  'אין לך חשבון? צור אחד חדש כאן'
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3" />
              <span>גישה מאובטחת לבעלי הרשאה בלבד</span>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button onClick={toggleTheme} className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all shadow-md hover:scale-110 active:scale-90">
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans dir-rtl`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={logout}
        role={profile?.role}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header theme={theme} />

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>

          <footer className={`mt-12 py-6 border-t text-center ${theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
            <p className="text-xs">
              © {new Date().getFullYear()} Tnufa Systems Ltd. All rights reserved.
              <span className="mx-2">•</span>
              v2.6.0 (Production)
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
