
import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  Landmark, 
  Percent, 
  Calendar, 
  FileText, 
  ArrowUpRight, 
  TrendingUp, 
  Info, 
  HelpCircle, 
  Sparkles,
  Zap,
  TrendingDown,
  Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Bar, ComposedChart } from 'recharts';
import { CHART_COLORS } from '../constants';

const Funding: React.FC = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Standard Inputs
  const [projectCost, setProjectCost] = useState<number>(50000000); // 50M NIS
  const [govSupportPct, setGovSupportPct] = useState<number>(40); // 40% support
  const [ownCapital, setOwnCapital] = useState<number>(10000000); // 10M NIS
  const [interestRate, setInterestRate] = useState<number>(4.5); // 4.5%
  const [loanYears, setLoanYears] = useState<number>(15); // 15 years

  // Balloon Loan Inputs
  const [isBalloonEnabled, setIsBalloonEnabled] = useState<boolean>(false);
  const [balloonAmount, setBalloonAmount] = useState<number>(5000000); // 5M NIS
  const [balloonYears, setBalloonYears] = useState<number>(3); // 3 years
  const [balloonInterest, setBalloonInterest] = useState<number>(3.8); // Usually lower or different

  // Derived Calculations
  const govSupportAmount = (projectCost * govSupportPct) / 100;
  const fundingGap = Math.max(0, projectCost - govSupportAmount - ownCapital);
  
  // If balloon is enabled, it takes a chunk out of the standard loan requirement
  const effectiveBalloonAmount = isBalloonEnabled ? Math.min(balloonAmount, fundingGap) : 0;
  const standardLoanRequired = Math.max(0, fundingGap - effectiveBalloonAmount);

  // PMT Calculation (Spitzer)
  const calculateAnnualRepayment = (principal: number, annualRate: number, years: number) => {
    if (principal <= 0) return 0;
    const r = annualRate / 100;
    if (r === 0) return principal / years;
    return (principal * r * Math.pow(1 + r, years)) / (Math.pow(1 + r, years) - 1);
  };

  const annualStandardRepayment = useMemo(() => 
    calculateAnnualRepayment(standardLoanRequired, interestRate, loanYears), 
    [standardLoanRequired, interestRate, loanYears]
  );

  const annualBalloonInterestOnly = (effectiveBalloonAmount * balloonInterest) / 100;

  // Chart Data Generation
  const projectionData = useMemo(() => {
    const data = [];
    let remainingStandard = standardLoanRequired;
    const maxTimeline = Math.max(loanYears, isBalloonEnabled ? balloonYears : 0);
    
    for (let i = 0; i <= maxTimeline; i++) {
        const isWithinBalloon = isBalloonEnabled && i <= balloonYears && i > 0;
        const isBalloonEnd = isBalloonEnabled && i === balloonYears;
        
        const standardInterest = remainingStandard * (interestRate / 100);
        const standardPrincipal = i > 0 && i <= loanYears ? annualStandardRepayment - standardInterest : 0;
        
        const currentRepayment = (i > 0 && i <= loanYears ? annualStandardRepayment : 0) + 
                               (isWithinBalloon ? annualBalloonInterestOnly : 0) +
                               (isBalloonEnd ? effectiveBalloonAmount : 0);

        data.push({
            year: `שנה ${i}`,
            repayment: Math.round(currentRepayment / 1000), // in thousands
            standardBalance: Math.round(remainingStandard / 1000),
            balloonBalance: isBalloonEnabled && i < balloonYears ? Math.round(effectiveBalloonAmount / 1000) : 0,
            totalBalance: Math.round((remainingStandard + (isBalloonEnabled && i < balloonYears ? effectiveBalloonAmount : 0)) / 1000)
        });
        
        if (i > 0) {
            remainingStandard = Math.max(0, remainingStandard - standardPrincipal);
        }
    }
    return data;
  }, [standardLoanRequired, annualStandardRepayment, loanYears, interestRate, isBalloonEnabled, effectiveBalloonAmount, balloonYears, annualBalloonInterestOnly]);

  const totalInterestPaid = useMemo(() => {
      const standardTotal = (annualStandardRepayment * loanYears) - standardLoanRequired;
      const balloonTotal = (annualBalloonInterestOnly * balloonYears);
      return Math.max(0, standardTotal + balloonTotal);
  }, [annualStandardRepayment, loanYears, standardLoanRequired, annualBalloonInterestOnly, balloonYears]);

  return (
    <div className="space-y-8 fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Coins className="text-amber-500 w-8 h-8" /> תכנון מימון ותקציבי פיתוח
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ניהול אשראי רשותי: הלוואות שפיצר, הלוואות בלון וגישור</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-sm">
                <FileText className="w-4 h-4" /> ייצוא דוח גזברות
            </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">פער מימון כולל</p>
            <div className="text-3xl font-black text-slate-900 dark:text-white">₪{(fundingGap / 1000000).toFixed(1)}M</div>
            <div className="mt-2 text-xs text-slate-400">נדרש לגיוס מהבנקים</div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-r-4 border-r-indigo-500">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-1">הלוואת בלון (גישור)</p>
            <div className="text-3xl font-black text-indigo-600">₪{(effectiveBalloonAmount / 1000000).toFixed(1)}M</div>
            <div className="mt-2 flex items-center text-xs text-indigo-500 gap-1">
                <Clock className="w-3 h-3" /> פירעון בעוד {balloonYears} שנים
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-r-4 border-r-cyan-500">
            <p className="text-xs text-cyan-600 dark:text-cyan-400 font-bold uppercase mb-1">הלוואת שפיצר</p>
            <div className="text-3xl font-black text-cyan-600">₪{(standardLoanRequired / 1000000).toFixed(1)}M</div>
            <div className="mt-2 text-xs text-slate-400">החזר חודשי שוטף</div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">עלות מימון כוללת (ריבית)</p>
            <div className="text-3xl font-black text-rose-400">₪{(totalInterestPaid / 1000).toLocaleString()}K</div>
            <div className="mt-2 flex items-center text-xs text-slate-400 gap-1">
                <TrendingDown className="w-3 h-3" /> אפקטיבית: {((totalInterestPaid / fundingGap) * 100).toFixed(1)}%
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calculator Sidebar */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-cyan-500" /> הגדרות אשראי ומימון
                </h3>
                
                <div className="space-y-6">
                    {/* Project Basic Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">עלות פרויקט: ₪{(projectCost / 1000000).toFixed(1)}M</label>
                            <input 
                                type="range" min="1000000" max="200000000" step="1000000"
                                value={projectCost} onChange={(e) => setProjectCost(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">הון עצמי (₪)</label>
                                <input 
                                    type="number" value={ownCapital} onChange={(e) => setOwnCapital(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">% מענק ממשלתי</label>
                                <input 
                                    type="number" value={govSupportPct} onChange={(e) => setGovSupportPct(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Balloon Loan Toggle & Inputs */}
                    <div className={`p-4 rounded-2xl border transition-all ${isBalloonEnabled ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-50 border-slate-100 dark:bg-slate-900/40 dark:border-slate-800'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Zap className={`w-4 h-4 ${isBalloonEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`text-sm font-bold ${isBalloonEnabled ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-500'}`}>הלוואת בלון (גישור)</span>
                            </div>
                            <button 
                                onClick={() => setIsBalloonEnabled(!isBalloonEnabled)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${isBalloonEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isBalloonEnabled ? 'right-6' : 'right-1'}`}></div>
                            </button>
                        </div>

                        {isBalloonEnabled && (
                            <div className="space-y-4 fade-in">
                                <div>
                                    <label className="flex justify-between text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-2 uppercase">
                                        <span>סכום הבלון (₪)</span>
                                        <span>₪{(balloonAmount / 1000000).toFixed(1)}M</span>
                                    </label>
                                    <input 
                                        type="range" min="1000000" max={fundingGap} step="500000"
                                        value={balloonAmount} onChange={(e) => setBalloonAmount(Number(e.target.value))}
                                        className="w-full h-1 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">תקופה (שנים)</label>
                                        <select 
                                            value={balloonYears} onChange={(e) => setBalloonYears(Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg p-1.5 text-xs font-bold"
                                        >
                                            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} שנים</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">ריבית בלון (%)</label>
                                        <input 
                                            type="number" step="0.1" value={balloonInterest} onChange={(e) => setBalloonInterest(Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg p-1.5 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Standard Loan Params */}
                    <div className="pt-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div> הלוואת שפיצר סטנדרטית
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                    <span>ריבית שנתית (P+)</span>
                                    <span className="text-cyan-600">{interestRate}%</span>
                                </label>
                                <input 
                                    type="range" min="1" max="12" step="0.1"
                                    value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                    <span>תקופת הלוואה (שנים)</span>
                                    <span className="text-cyan-600">{loanYears}</span>
                                </label>
                                <input 
                                    type="range" min="1" max="30" step="1"
                                    value={loanYears} onChange={(e) => setLoanYears(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <h4 className="font-bold mb-2 flex items-center gap-2 relative z-10">
                    <Sparkles className="w-4 h-4 text-indigo-200" /> אסטרטגיית מימון
                </h4>
                <p className="text-xs text-indigo-100 leading-relaxed relative z-10">
                    שילוב הלוואת בלון מאפשר דחיית תשלום הקרן לתקופה של עד 5 שנים, דבר המקל על תזרים המזומנים של הרשות בשלבי ההקמה.
                </p>
            </div>
        </div>

        {/* Charts and Projection */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white">תחזית תזרים ופירעון חוב (₪ אלפים)</h3>
                    <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-cyan-500 rounded-sm"></div> יתרת שפיצר</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> יתרת בלון</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div> החזר שנתי</div>
                    </div>
                </div>
                
                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="year" tick={{fontSize: 10, fill: '#94a3b8'}} reversed />
                            <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} orientation="right" />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                            />
                            <Area 
                                type="monotone" name="יתרת חוב כוללת" dataKey="totalBalance" 
                                stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorTotal)" 
                            />
                            <Bar 
                                name="החזר שנתי" dataKey="repayment" 
                                fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">החזר שוטף (שפיצר)</p>
                        <p className="text-lg font-black text-cyan-600">₪{(annualStandardRepayment / 12 / 1000).toFixed(1)}K / חודש</p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40">
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold mb-1">ריבית בלון שנתית</p>
                        <p className="text-lg font-black text-indigo-700 dark:text-indigo-300">₪{(annualBalloonInterestOnly / 1000).toFixed(1)}K</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">מימון חיצוני סופי</p>
                        <p className="text-lg font-black text-white">₪{((fundingGap + totalInterestPaid) / 1000000).toFixed(1)}M</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Informational Footer */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/50 flex gap-4 items-center">
        <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
            <b>מדיניות אשראי רשותי:</b> הלוואות בלון (Bridge Loans) מאושרות לרוב כנגד הכנסות עתידיות צפויות (מכירת קרקעות, היטלי השבחה או מענקי פיתוח מובטחים). מומלץ לוודא עמידה במדדי משרד הפנים לכושר החזר חוב לפני נטילת הלוואה נוספת.
        </p>
      </div>
    </div>
  );
};

export default Funding;
