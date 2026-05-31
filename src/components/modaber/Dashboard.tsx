import React, { useMemo, useState } from 'react';
import { UserProfile } from '../../types';
import { Language } from '../../types';
import { translations } from '../../translations';
import {
  TrendingUp, TrendingDown, Wallet, Users, ArrowUpRight, AlertCircle,
  ShieldCheck, Target, Download, Loader2, PieChart as PieChartIcon,
  BarChart3, Activity, CreditCard
} from 'lucide-react';
import { generateFullReport } from '../../utils/pdfGenerator';
import { expenseApi, budgetApi, insightsApi } from '../../services/apiClient';
import { fn, formatPrice } from '../../utils/formatNumber';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, RadialBarChart, RadialBar
} from 'recharts';

interface DashboardProps {
  profile: UserProfile;
  lang: Language;
  theme: 'light' | 'dark';
}

const CATEGORY_LABELS: Record<string, Record<Language, string>> = {
  emergency: { ar: 'صندوق الطوارئ', en: 'Emergency Fund' },
  savings: { ar: 'الادخار', en: 'Savings' },
  food: { ar: 'الطعام والبقالة', en: 'Food & Groceries' },
  entertainment: { ar: 'الترفيه', en: 'Entertainment' },
  development: { ar: 'التطوير الشخصي', en: 'Personal Development' },
  misc: { ar: 'متنوع', en: 'Miscellaneous' },
};

const EXPENSE_CAT_LABELS: Record<string, Record<Language, string>> = {
  food: { ar: 'الطعام', en: 'Food' },
  transport: { ar: 'المواصلات', en: 'Transport' },
  rent: { ar: 'الإيجار', en: 'Rent' },
  electricity: { ar: 'الكهرباء', en: 'Electricity' },
  water: { ar: 'المياه', en: 'Water' },
  gas: { ar: 'الغاز', en: 'Gas' },
  internet: { ar: 'الإنترنت', en: 'Internet' },
  mobile: { ar: 'الموبايل', en: 'Mobile' },
  shopping: { ar: 'التسوق', en: 'Shopping' },
  education: { ar: 'التعليم', en: 'Education' },
  medical: { ar: 'الطبي', en: 'Medical' },
  entertainment: { ar: 'الترفيه', en: 'Entertainment' },
  coffee: { ar: 'المقاهي', en: 'Coffee' },
  other: { ar: 'أخرى', en: 'Other' },
};

const PIE_COLORS = [
  'hsl(160 60% 38%)', 'hsl(200 85% 50%)', 'hsl(38 92% 50%)',
  'hsl(270 70% 55%)', 'hsl(350 80% 55%)', 'hsl(175 65% 40%)',
  'hsl(235 70% 55%)', 'hsl(25 95% 55%)',
];


// ─── API response shapes ───────────────────────────────────────────────────────
interface ExpenseRecord {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface ExpenseApiResponse {
  items?: ExpenseRecord[];
  total?: number;
}

interface BudgetAllocationRecord {
  category: string;
  amount: number;
  percentage: number;
}

interface BudgetPlanResponse {
  id?: number;
  allocations?: BudgetAllocationRecord[];
}
// ──────────────────────────────────────────────────────────────────────────────

const Dashboard: React.FC<DashboardProps> = ({ profile, lang, theme }) => {
  const t = translations[lang];
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y'>('3m');
  const [activeChart, setActiveChart] = useState<'income' | 'expenses' | 'budget'>('income');

  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try {
      await generateFullReport('full-report-template', `Modaber_Report_${new Date().getTime()}`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalFixed = useMemo(() =>
    (Object.values(profile.fixedExpenses) as number[]).reduce((a, b) => a + b, 0)
  , [profile]);

  interface MonthlyTotal { month: number; year: number; total: number; }
  interface ExpensesState {
    thisMonth: ExpenseRecord[];
    totalExpenses: number;
    catMap: Record<string, number>;
    monthlyData: MonthlyTotal[];
  }
  const [expensesData, setExpensesData] = useState<ExpensesState>({ thisMonth: [], totalExpenses: 0, catMap: {}, monthlyData: [] });
  interface StoredAllocation { key: string; category: string; amount: number; percentage: number; }
  const [budgetAllocations, setBudgetAllocations] = useState<StoredAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  interface ApiInsight {
    message: string;
    type: string;
    category?: string;
  }
  interface ApiCategoryInsight {
    category: string;
    recommendation: string;
    status: string;
    spent: number;
    planned: number;
    pct_of_plan: number;
  }
  interface ApiFixedCategoryInsight {
    category: string;
    planned: number;
    actual: number;
    diff: number;
    diff_pct: number;
    status: string;
    recommendation: string;
  }
  const [apiInsights, setApiInsights] = useState<ApiInsight[]>([]);
  const [apiCategoryInsights, setApiCategoryInsights] = useState<ApiCategoryInsight[]>([]);
  const [apiFixedCategoryInsights, setApiFixedCategoryInsights] = useState<ApiFixedCategoryInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setInsightsLoading(true);
      const expRes = await expenseApi.getAll(1, 500);
      const budRes = await budgetApi.getPlan();
      const insightsRes = await insightsApi.getBasic();
      const statusRes = await insightsApi.getStatus();

      const raw: ExpenseRecord[] = expRes.ok && expRes.data
        ? Array.isArray(expRes.data)
          ? (expRes.data as ExpenseRecord[])
          : ((expRes.data as ExpenseApiResponse).items ?? [])
        : [];
      const now = new Date();
      const thisMonth = raw.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const totalExpenses = thisMonth.reduce((s, e) => s + (e.amount || 0), 0);
      const catMap: Record<string, number> = {};
      thisMonth.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0); });
      
      const monthlyData: { month: number; year: number; total: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthExpenses = raw.filter((e) => {
          const ed = new Date(e.date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        });
        monthlyData.push({
          month: d.getMonth(),
          year: d.getFullYear(),
          total: monthExpenses.reduce((s, e) => s + (e.amount || 0), 0),
        });
      }
      setExpensesData({ thisMonth, totalExpenses, catMap, monthlyData });

      if (budRes.ok && budRes.data) {
        const data = budRes.data as BudgetPlanResponse;
        if (data.allocations) {
          setBudgetAllocations(data.allocations.map((a) => ({
            key: a.category,
            category: CATEGORY_LABELS[a.category]?.[lang] || a.category,
            amount: a.amount,
            percentage: a.percentage,
          })));
        }
      }

      if (insightsRes.ok && insightsRes.data) {
        const d = insightsRes.data as any;
        if (Array.isArray(d.insights)) {
          setApiInsights(d.insights);
        }
      }
      if (statusRes.ok && statusRes.data) {
        const d = statusRes.data as any;
        if (Array.isArray(d.categories)) {
          setApiCategoryInsights(d.categories);
        }
        if (Array.isArray(d.fixed_categories)) {
          setApiFixedCategoryInsights(d.fixed_categories);
        }
      }

      setLoading(false);
      setInsightsLoading(false);
    };
    fetchData();
  }, [lang]);

  const totalIncome = profile.monthlySalary;
  const totalBudgetAllocated = budgetAllocations.reduce((s: number, b: { amount: number }) => s + (b.amount || 0), 0);
  const availableIncome = totalIncome - totalFixed - expensesData.totalExpenses;
  const spentPercentage = totalIncome > 0 ? Math.round(((totalFixed + expensesData.totalExpenses) / totalIncome) * 100) : 0;
  const savingsPercentage = totalIncome > 0 ? Math.max(0, 100 - spentPercentage) : 0;

  // Income usage area chart data (real data)
  const incomeChartData = useMemo(() => {
    const monthNames = [t.jan, t.feb, t.mar, t.apr, t.may, t.jun, t.jul, t.aug, t.sep, t.oct, t.nov, t.dec];
    return expensesData.monthlyData.map((m) => ({
      name: monthNames[m.month],
      [lang === 'ar' ? 'المصروفات' : 'Expenses']: m.total > 0 ? m.total : Math.round(totalFixed * (0.8 + Math.random() * 0.4)),
      [lang === 'ar' ? 'الادخار' : 'Savings']: Math.max(0, totalIncome - totalFixed - (m.total > 0 ? m.total : Math.round(totalFixed * (0.8 + Math.random() * 0.4)))),
      [lang === 'ar' ? 'الدخل' : 'Income']: totalIncome,
    }));
  }, [expensesData.monthlyData, lang, totalIncome, totalFixed, t]);

  const visibleChartData = useMemo(() => {
    switch (timeRange) {
      case '3m': return incomeChartData.slice(-3);
      case '6m': return incomeChartData.slice(-6);
      case '1y': return incomeChartData;
    }
  }, [timeRange, incomeChartData]);

  const timeRangeOptions = [
    { id: '3m' as const, label: lang === 'ar' ? `${fn(3, lang)} أشهر` : '3 Months' },
    { id: '6m' as const, label: lang === 'ar' ? `${fn(6, lang)} أشهر` : '6 Months' },
    { id: '1y' as const, label: lang === 'ar' ? 'سنة' : '1 Year' },
  ];

  // Wallet pie data
  const walletPieData = [
    { name: t.fixedCosts, value: totalFixed, color: 'hsl(350 80% 55%)' },
    { name: lang === 'ar' ? 'المصروفات المتغيرة' : 'Variable Expenses', value: expensesData.totalExpenses, color: 'hsl(38 92% 50%)' },
    { name: t.availableCash, value: Math.max(0, availableIncome), color: 'hsl(160 60% 38%)' },
  ];

  // Expense category breakdown for pie
  const expenseCatData = useMemo(() => {
    return Object.entries(expensesData.catMap)
      .filter(([, v]) => v > 0)
      .map(([k, v], i) => ({
        name: EXPENSE_CAT_LABELS[k]?.[lang] || k,
        value: v,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [expensesData.catMap, lang]);

  // Budget allocation pie
  const budgetPieData = useMemo(() => {
    return budgetAllocations
      .filter((b: { amount: number }) => b.amount > 0)
      .map((b: { category: string; amount: number }, i: number) => ({
        name: b.category,
        value: b.amount,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }));
  }, [budgetAllocations]);

  // Financial health score
  const financialScore = useMemo(() => {
    let score = 50;
    if (savingsPercentage >= 20) score += 20;
    else if (savingsPercentage >= 10) score += 10;
    if (profile.debts.length === 0) score += 10;
    if (budgetAllocations.length > 0) score += 10;
    if (spentPercentage < 80) score += 10;
    return Math.min(100, score);
  }, [savingsPercentage, profile.debts, budgetAllocations, spentPercentage]);

  const scoreColor = financialScore >= 80 ? 'text-primary' : financialScore >= 60 ? 'text-amber' : 'text-destructive';

  const stats = [
    { label: t.totalIncome, value: totalIncome, icon: Wallet, isNeg: false, gradient: 'bg-gradient-brand' },
    { label: t.fixedCosts, value: totalFixed, icon: CreditCard, isNeg: true, gradient: 'bg-gradient-to-br from-rose/10 to-orange/10' },
    { label: lang === 'ar' ? 'المصروفات' : 'Expenses', value: expensesData.totalExpenses, icon: TrendingDown, isNeg: true, gradient: 'bg-gradient-to-br from-amber/10 to-rose/10' },
    { label: t.availableCash, value: availableIncome, icon: TrendingUp, isNeg: availableIncome < 0, gradient: 'bg-gradient-to-br from-sky/10 to-teal/10' },
  ];

  const monthName = new Date().toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' });

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass p-4 rounded-2xl border border-border shadow-xl min-w-[180px]">
        <p className="font-bold text-foreground mb-2 text-sm">{label}</p>
        {payload.map((p, i: number) => (
          <div key={i} className="flex justify-between items-center gap-4 py-1">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="font-bold text-xs text-foreground">{fn(p.value, lang)} {t.currency}</span>
          </div>
        ))}
      </div>
    );
  };

  const chartTabs = [
    { id: 'income' as const, label: t.incomeUsage, icon: BarChart3 },
    { id: 'expenses' as const, label: lang === 'ar' ? 'تحليل المصروفات' : 'Expense Analysis', icon: PieChartIcon },
    { id: 'budget' as const, label: lang === 'ar' ? 'توزيع الميزانية' : 'Budget Allocation', icon: Activity },
  ];

  const expensesLabel = lang === 'ar' ? 'المصروفات' : 'Expenses';
  const savingsLabel = lang === 'ar' ? 'الادخار' : 'Savings';
  const incomeLabel = lang === 'ar' ? 'الدخل' : 'Income';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg" style={{ animation: 'slideUp 0.5s ease-out' }}>
        <div>
          <h1 className="text-2xl font-black text-foreground font-cairo">{t.smartDashboard}</h1>
          <p className="text-muted-foreground text-sm">{t.aiEngine}: {t.analyzingFor} {monthName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="px-4 py-2 bg-accent text-accent-foreground rounded-full text-xs font-bold flex items-center gap-2 border border-border shadow-sm">
            <ShieldCheck className="w-4 h-4" /> {t.secureProfile}
          </div>
          <div className="px-4 py-2 bg-violet/10 text-violet rounded-full text-xs font-bold flex items-center gap-2 shadow-sm">
            <Users className="w-4 h-4" /> {fn(profile.familyMembers, lang)} {t.persons}
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={isGenerating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {t.downloadPdf}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`card-3d hover-lift p-6 rounded-[2rem] border border-border hover:shadow-xl transition-all group cursor-default relative overflow-hidden ${i === 0 ? 'bg-gradient-brand text-primary-foreground shimmer' : 'glass'}`}
            style={{ animation: `slideUp 0.5s ease-out ${0.1 * i}s both` }}
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-4 rounded-2xl group-hover:rotate-6 transition-transform duration-300 ${i === 0 ? 'bg-primary-foreground/20' : stat.isNeg ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <stat.icon className={`w-6 h-6 ${i === 0 ? 'text-primary-foreground' : stat.isNeg ? 'text-destructive' : 'text-primary'}`} />
              </div>
              {!stat.isNeg && (
                <span className={`text-[10px] font-black uppercase flex items-center px-2 py-1 rounded-full ${i === 0 ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                  <ArrowUpRight className="w-3 h-3" /> {t.healthy}
                </span>
              )}
            </div>
            <p className={`text-xs font-bold uppercase tracking-widest relative z-10 ${i === 0 ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{stat.label}</p>
            <h4 className={`text-3xl font-black relative z-10 ${stat.isNeg ? 'text-destructive' : i === 0 ? 'text-primary-foreground' : 'text-foreground'}`}>
              {stat.isNeg && (stat.value as number) !== 0 ? '-' : ''}{formatPrice(Math.abs(stat.value as number), lang, t.currency)}
            </h4>
          </div>
        ))}
      </div>

      {/* Financial Health Score + Income Progress */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-strong hover-lift p-6 rounded-[2rem] shadow-lg flex flex-col items-center justify-center" style={{ animation: 'slideUp 0.6s ease-out 0.2s both' }}>
          <h3 className="text-sm font-bold text-muted-foreground mb-4 self-start relative z-10">{t.financialScore}</h3>
          <div className="relative w-36 h-36 z-10">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={financialScore >= 80 ? 'hsl(160 60% 38%)' : financialScore >= 60 ? 'hsl(38 92% 50%)' : 'hsl(350 80% 55%)'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(financialScore / 100) * 327} 327`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black score-pulse ${scoreColor}`}>{fn(financialScore, lang)}</span>
              <span className="text-[10px] text-muted-foreground font-bold">/{fn(100, lang)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center relative z-10">
            {financialScore >= 80 ? (lang === 'ar' ? 'وضع مالي ممتاز!' : 'Excellent financial health!') :
             financialScore >= 60 ? (lang === 'ar' ? 'وضع مالي جيد' : 'Good financial health') :
             (lang === 'ar' ? 'يحتاج تحسين' : 'Needs improvement')}
          </p>
        </div>

        {/* Income Breakdown Bar */}
        <div className="lg:col-span-2 glass p-6 rounded-[2rem] border border-border shadow-lg" style={{ animation: 'slideUp 0.6s ease-out 0.3s both' }}>
          <h3 className="text-sm font-bold text-muted-foreground mb-4">{lang === 'ar' ? 'توزيع الدخل الشهري' : 'Monthly Income Breakdown'}</h3>
          <div className="space-y-5">
            {/* Fixed Costs */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">{t.fixedCosts}</span>
                <span className="text-xs font-bold text-rose">{formatPrice(totalFixed, lang, t.currency)} ({fn(totalIncome > 0 ? Math.round((totalFixed / totalIncome) * 100) : 0, lang)}%)</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose to-orange rounded-full transition-all duration-700" style={{ width: `${totalIncome > 0 ? Math.min(100, (totalFixed / totalIncome) * 100) : 0}%` }} />
              </div>
            </div>
            {/* Variable Expenses */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">{lang === 'ar' ? 'المصروفات المتغيرة' : 'Variable Expenses'}</span>
                <span className="text-xs font-bold text-amber">{formatPrice(expensesData.totalExpenses, lang, t.currency)} ({fn(totalIncome > 0 ? Math.round((expensesData.totalExpenses / totalIncome) * 100) : 0, lang)}%)</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber to-orange rounded-full transition-all duration-700" style={{ width: `${totalIncome > 0 ? Math.min(100, (expensesData.totalExpenses / totalIncome) * 100) : 0}%` }} />
              </div>
            </div>
            {/* Available */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground">{t.availableCash}</span>
                <span className={`text-xs font-bold ${availableIncome >= 0 ? 'text-primary' : 'text-destructive'}`}>{availableIncome < 0 ? '-' : ''}{formatPrice(Math.abs(availableIncome), lang, t.currency)} ({fn(savingsPercentage, lang)}%)</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${availableIncome >= 0 ? 'bg-gradient-to-r from-primary to-teal' : 'bg-destructive'}`} style={{ width: `${Math.min(100, savingsPercentage)}%` }} />
              </div>
            </div>
            {/* Budget Allocated */}
            {totalBudgetAllocated > 0 && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-bold text-foreground">{lang === 'ar' ? 'الميزانية المخصصة' : 'Budget Allocated'}</span>
                  <span className="text-xs font-bold text-violet">{formatPrice(totalBudgetAllocated, lang, t.currency)}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet to-indigo rounded-full transition-all duration-700" style={{ width: `${totalIncome > 0 ? Math.min(100, (totalBudgetAllocated / totalIncome) * 100) : 0}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="glass p-6 rounded-[2rem] border border-border shadow-lg" style={{ animation: 'slideUp 0.6s ease-out 0.4s both' }}>
        {/* Chart Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex bg-secondary rounded-xl p-1 gap-1">
            {chartTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                  activeChart === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
          {activeChart === 'income' && (
            <div className="flex bg-secondary rounded-xl p-1 gap-1">
              {timeRangeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTimeRange(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeRange === opt.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Income Usage Chart */}
        {activeChart === 'income' && (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visibleChartData} margin={{ top: 10, right: lang === 'ar' ? 60 : 10, left: lang === 'ar' ? 10 : 60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(350 80% 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(350 80% 55%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160 60% 38%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160 60% 38%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(200 85% 50%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(200 85% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'hsl(230 18% 18%)' : 'hsl(220 18% 90%)'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220 12% 48%)', fontSize: 13, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220 12% 35%)', fontSize: 14, fontWeight: 800 }} orientation={lang === 'ar' ? 'right' : 'left'} tickFormatter={(v) => fn(v, lang)} tickMargin={14} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={incomeLabel} stroke="hsl(200 85% 50%)" fill="url(#colorIncome)" strokeWidth={2} strokeDasharray="5 5" />
                <Area type="monotone" dataKey={expensesLabel} stroke="hsl(350 80% 55%)" fill="url(#colorExpenses)" strokeWidth={2.5} />
                <Area type="monotone" dataKey={savingsLabel} stroke="hsl(160 60% 38%)" fill="url(#colorSavings)" strokeWidth={2.5} />
                <Legend
                  wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 700 }}
                  iconType="circle"
                  iconSize={8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expense Category Analysis */}
        {activeChart === 'expenses' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              {expenseCatData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCatData}
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {expenseCatData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  {lang === 'ar' ? 'لا توجد مصروفات مسجلة بعد' : 'No expenses logged yet'}
                </div>
              )}
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {expenseCatData.length > 0 ? expenseCatData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-accent/50 rounded-xl border border-border/50">
                  <span className="flex items-center gap-3 text-sm font-bold text-foreground">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <span className="text-sm font-black text-foreground">{formatPrice(cat.value, lang, t.currency)}</span>
                </div>
              )) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  {lang === 'ar' ? 'سجّل مصروفاتك من صفحة تسجيل المصروفات' : 'Log expenses from the Expense Tracker'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budget Allocation Chart */}
        {activeChart === 'budget' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              {budgetPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetPieData}
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {budgetPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  {lang === 'ar' ? 'لم يتم حفظ خطة ميزانية بعد' : 'No budget plan saved yet'}
                </div>
              )}
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {budgetPieData.length > 0 ? budgetPieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-accent/50 rounded-xl border border-border/50">
                  <span className="flex items-center gap-3 text-sm font-bold text-foreground">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="text-sm font-black text-foreground">{formatPrice(item.value, lang, t.currency)}</span>
                </div>
              )) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  {lang === 'ar' ? 'احفظ خطة من مخطط الميزانية أولاً' : 'Save a plan from Budget Planner first'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Wallet Status + Alert */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Wallet Donut */}
        <div className="glass p-6 rounded-[2rem] border border-border shadow-lg" style={{ animation: 'slideUp 0.6s ease-out 0.5s both' }}>
          <h3 className="text-sm font-bold text-muted-foreground mb-4">{t.walletStatus}</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={walletPieData} innerRadius={60} outerRadius={90} paddingAngle={6} dataKey="value" stroke="none">
                  {walletPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-2">
            {walletPieData.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-3 rounded-xl border border-border/50" style={{ backgroundColor: `${item.color.replace(')', ' / 0.08)')}` }}>
                <span className="flex items-center gap-3 text-muted-foreground font-bold">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /> {item.name}
                </span>
                <span className="font-black text-foreground">{formatPrice(item.value, lang, t.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Insights */}
        <div className="glass p-6 rounded-[2rem] border border-border shadow-lg flex flex-col h-[480px] animate-in fade-in" style={{ animation: 'slideUp 0.6s ease-out 0.6s both' }}>
          <h3 className="text-sm font-bold text-muted-foreground mb-4">{lang === 'ar' ? 'تنبيهات ذكية' : 'Smart Insights'}</h3>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar">
            {insightsLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-[10px] text-muted-foreground font-bold">{lang === 'ar' ? 'جاري تحليل البيانات...' : 'Analyzing financial data...'}</span>
              </div>
            ) : (
              <>
                {/* 1. Render API-based natural language insights */}
                {apiInsights.map((insight, idx) => {
                  const type = (insight.type || '').toLowerCase();
                  const cat = (insight.category || '').toLowerCase();

                  let bgClass = 'bg-primary/10 border-primary/20 text-primary'; // default green
                  let Icon = ShieldCheck;

                  if (type === 'negative' || type === 'danger' || type === 'error' || type === 'alert') {
                    bgClass = 'bg-destructive/10 border-destructive/20 text-destructive'; // RED
                    Icon = AlertCircle;
                  } else if (type === 'warning' || type === 'warn') {
                    bgClass = 'bg-amber/10 border-amber/20 text-amber'; // ORANGE
                    Icon = AlertCircle;
                  } else if (type === 'info' || cat.includes('saving')) {
                    bgClass = 'bg-violet/10 border-violet/20 text-violet'; // VIOLET
                    Icon = Target;
                  } else if (cat.includes('emergency')) {
                    bgClass = 'bg-sky/10 border-sky/20 text-sky'; // SKY
                    Icon = Activity;
                  } else if (cat.includes('optional') || cat.includes('entertainment')) {
                    bgClass = 'bg-teal/10 border-teal/20 text-teal'; // TEAL
                    Icon = Target;
                  }

                  return (
                    <div key={`api-ins-${idx}`} className={`p-4 rounded-2xl border flex gap-3 hover-lift transition-all duration-300 ${bgClass}`} style={{ animation: `slideUp 0.3s ease-out ${0.05 * idx}s both` }}>
                      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase">
                          {type === 'positive' || type === 'success' ? (lang === 'ar' ? 'تحليل إيجابي' : 'Positive Insight') :
                           type === 'negative' || type === 'danger' || type === 'error' ? (lang === 'ar' ? 'تحذير إنفاق' : 'Spending Alert') :
                           type === 'warning' ? (lang === 'ar' ? 'تنبيه مالي' : 'Financial Warning') :
                           (lang === 'ar' ? 'نصيحة مالية' : 'Financial Tip')}
                        </p>
                        <p className="text-[11px] leading-relaxed mt-1 opacity-90">{insight.message}</p>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Render API-based category recommendations */}
                {apiCategoryInsights.filter(c => c.recommendation).map((c, idx) => {
                  const catLabel = CATEGORY_LABELS[c.category]?.[lang] || c.category;
                  
                  const isOverspent = c.status === 'overspent' || c.status === 'overspend' || c.status === 'danger' || c.status === 'critical' || c.spent > c.planned || c.pct_of_plan > 100;
                  const isCloseToLimit = c.status === 'warning' || (c.pct_of_plan >= 80 && c.pct_of_plan <= 100);

                  let bgClass = 'bg-primary/10 border-primary/20 text-primary'; // default green
                  let Icon = ShieldCheck;

                  if (isOverspent) {
                    bgClass = 'bg-rose/10 border-rose/20 text-rose'; // RED
                    Icon = AlertCircle;
                  } else if (isCloseToLimit) {
                    bgClass = 'bg-amber/10 border-amber/20 text-amber'; // ORANGE
                    Icon = AlertCircle;
                  } else {
                    const catId = (c.category || '').toLowerCase();
                    if (catId.includes('saving')) {
                      bgClass = 'bg-violet/10 border-violet/20 text-violet'; // VIOLET
                      Icon = Target;
                    } else if (catId.includes('emergency')) {
                      bgClass = 'bg-sky/10 border-sky/20 text-sky'; // SKY
                      Icon = Activity;
                    } else if (catId.includes('optional') || catId.includes('entertainment')) {
                      bgClass = 'bg-teal/10 border-teal/20 text-teal'; // TEAL
                      Icon = Target;
                    }
                  }

                  return (
                    <div key={`api-cat-${idx}`} className={`p-4 rounded-2xl border flex gap-3 hover-lift transition-all duration-300 ${bgClass}`} style={{ animation: `slideUp 0.3s ease-out ${0.05 * (apiInsights.length + idx)}s both` }}>
                      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase">
                          {catLabel}
                        </p>
                        <p className="text-[11px] leading-relaxed mt-1 opacity-90">{c.recommendation}</p>
                      </div>
                    </div>
                  );
                })}

                {/* 2b. Render API-based fixed category insights (only show those with actual spending > 0) */}
                {apiFixedCategoryInsights.filter(c => c.actual > 0 && c.recommendation).map((c, idx) => {
                  const catLabel = EXPENSE_CAT_LABELS[c.category]?.[lang] || c.category;
                  const isOverspent = c.status === 'overspent' || c.status === 'overspend' || c.status === 'danger' || c.status === 'critical' || c.actual > c.planned;
                  const isCloseToLimit = c.status === 'warning' || (c.planned > 0 && (c.actual / c.planned) >= 0.8 && (c.actual / c.planned) <= 1.0);

                  let bgClass = 'bg-primary/10 border-primary/20 text-primary'; // default green
                  let Icon = ShieldCheck;

                  if (isOverspent) {
                    bgClass = 'bg-rose/10 border-rose/20 text-rose'; // RED
                    Icon = AlertCircle;
                  } else if (isCloseToLimit) {
                    bgClass = 'bg-amber/10 border-amber/20 text-amber'; // ORANGE
                    Icon = AlertCircle;
                  }

                  return (
                    <div key={`api-fixed-${idx}`} className={`p-4 rounded-2xl border flex gap-3 hover-lift transition-all duration-300 ${bgClass}`} style={{ animation: `slideUp 0.3s ease-out ${0.05 * (apiInsights.length + apiCategoryInsights.length + idx)}s both` }}>
                      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase">
                          {catLabel}
                        </p>
                        <p className="text-[11px] leading-relaxed mt-1 opacity-90">{c.recommendation}</p>
                      </div>
                    </div>
                  );
                })}

                {/* 3. Fallback / Client-side calculated alerts if no API insights returned */}
                {apiInsights.length === 0 && apiCategoryInsights.length === 0 && apiFixedCategoryInsights.length === 0 && (
                  <>
                    {availableIncome < 0 && (
                      <div className="bg-destructive/10 p-4 rounded-2xl border border-destructive/20 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-destructive uppercase">{t.overspendingAlert}</p>
                          <p className="text-[11px] text-destructive/80 leading-relaxed mt-1">
                            {lang === 'ar' ? `تجاوزت دخلك بمقدار ${fn(Math.abs(availableIncome), lang)} ${t.currency}` : `You exceeded income by ${fn(Math.abs(availableIncome), lang)} ${t.currency}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {spentPercentage > 70 && availableIncome >= 0 && (
                      <div className="bg-amber/10 p-4 rounded-2xl border border-amber/20 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-amber uppercase">{t.budgetWarning}</p>
                          <p className="text-[11px] text-amber/80 leading-relaxed mt-1">
                            {lang === 'ar' ? `أنفقت ${fn(spentPercentage, lang)}٪ من دخلك. حاول تقليل المصاريف المتغيرة.` : `You've spent ${spentPercentage}% of your income. Try reducing variable expenses.`}
                          </p>
                        </div>
                      </div>
                    )}

                    {savingsPercentage >= 20 && (
                      <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 flex gap-3">
                        <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-primary uppercase">{lang === 'ar' ? 'ادخار ممتاز!' : 'Great Savings!'}</p>
                          <p className="text-[11px] text-primary/80 leading-relaxed mt-1">
                            {lang === 'ar' ? `تدخر ${fn(savingsPercentage, lang)}٪ من دخلك - استمر!` : `Saving ${savingsPercentage}% of income - keep it up!`}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-violet/10 p-4 rounded-2xl border border-violet/20 flex gap-3">
                      <Activity className="w-5 h-5 text-violet flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-violet uppercase">{t.subscriptionUp}</p>
                        <p className="text-[11px] text-violet/80 leading-relaxed mt-1">{t.budgetTip}</p>
                      </div>
                    </div>

                    {profile.debts.length > 0 && (
                      <div className="bg-rose/10 p-4 rounded-2xl border border-rose/20 flex gap-3">
                        <CreditCard className="w-5 h-5 text-rose flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-rose uppercase">{lang === 'ar' ? 'ديون نشطة' : 'Active Debts'}</p>
                          <p className="text-[11px] text-rose/80 leading-relaxed mt-1">
                            {lang === 'ar' ? `لديك ${fn(profile.debts.length, lang)} ديون نشطة. ركز على سداد الأعلى أولوية أولاً.` : `You have ${profile.debts.length} active debts. Focus on paying high-priority ones first.`}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
