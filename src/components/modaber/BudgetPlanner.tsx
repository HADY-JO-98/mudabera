import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, BudgetAllocation } from '../../types';
import { translations } from '../../translations';
import { Language } from '../../types';
import { budgetApi } from '../../services/apiClient';
import { Sparkles, Save, RotateCcw, Loader2, Wallet, Plus, Minus } from 'lucide-react';
import { fn } from '../../utils/formatNumber';

interface BudgetPlannerProps {
  profile: UserProfile;
  lang: Language;
}

// Internal category keys (language-neutral) for storage
const CATEGORY_KEYS = ['emergency', 'savings', 'food', 'entertainment', 'development', 'misc'] as const;

const CATEGORY_LABELS: Record<string, Record<Language, string>> = {
  emergency:     { ar: 'صندوق الطوارئ', en: 'Emergency Fund' },
  savings:       { ar: 'الادخار', en: 'Savings' },
  food:          { ar: 'الطعام والبقالة', en: 'Food & Groceries' },
  entertainment: { ar: 'الترفيه', en: 'Entertainment' },
  development:   { ar: 'التطوير الشخصي', en: 'Personal Development' },
  misc:          { ar: 'متنوع', en: 'Miscellaneous' },
  // Backend ML category
  optional:      { ar: 'المصاريف الاختيارية', en: 'Optional Expenses' },
};

const CATEGORY_ADVICE: Record<string, Record<Language, string>> = {
  emergency:     { ar: 'احتفظ بـ ٣-٦ أشهر من المصاريف كاحتياطي.', en: 'Keep 3-6 months of expenses as a reserve.' },
  savings:       { ar: 'استثمر في شهادات الادخار عالية العائد.', en: 'Invest in high-yield savings certificates.' },
  food:          { ar: 'اشترِ بالجملة لتوفير ١٥-٢٠٪.', en: 'Buy in bulk to save 15-20%.' },
  entertainment: { ar: 'خصص ميزانية ثابتة للترفيه لتجنب الإنفاق العشوائي.', en: 'Set a fixed entertainment budget to avoid random spending.' },
  development:   { ar: 'استثمر في تعلم مهارات جديدة لزيادة الدخل.', en: 'Invest in learning new skills to increase income.' },
  misc:          { ar: 'احتفظ بمبلغ للمصاريف غير المتوقعة.', en: 'Keep a buffer for unexpected expenses.' },
  // Backend ML category
  optional:      { ar: 'راجع اشتراكاتك وقلّل ما لا تحتاجه.', en: 'Review subscriptions and cut what you do not need.' },
};

const DEFAULT_PERCENTAGES: Record<string, number> = {
  emergency: 20, savings: 25, food: 20, entertainment: 10, development: 15, misc: 10,
};

interface StoredBudget {
  percentages: Record<string, number>;
  amounts: Record<string, number>;
}

const getStorageKey = (email: string) => `modaber_budget_${email}`;

const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ profile, lang }) => {
  const t = translations[lang];
  const [apiTotalIncome, setApiTotalIncome] = useState<number | null>(null);
  const [backendPlan, setBackendPlan] = useState<(BudgetAllocation & { key: string })[] | null>(null);
  const [allocations, setAllocations] = useState<(BudgetAllocation & { key: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [showAdjust, setShowAdjust] = useState(false);
  const initializedRef = useRef(false);

  const totalFixed = (Object.values(profile.fixedExpenses) as number[]).reduce((a, b) => a + b, 0);
  const available = apiTotalIncome ?? (profile.monthlySalary - totalFixed);
  const totalIncome = apiTotalIncome ? (apiTotalIncome + totalFixed) : profile.monthlySalary;

  // Build allocations from percentages/amounts with current language
  const buildAllocations = useCallback((stored?: StoredBudget) => {
    return CATEGORY_KEYS.map(key => {
      const pct = stored?.percentages?.[key] ?? DEFAULT_PERCENTAGES[key];
      const amt = stored?.amounts?.[key] ?? (available * pct / 100);
      return {
        key,
        category: CATEGORY_LABELS[key][lang],
        amount: amt,
        percentage: pct,
        advice: CATEGORY_ADVICE[key][lang],
      };
    });
  }, [lang, available]);

  /** Map raw backend allocations array → component state (respects current language) */
  const mapApiAllocations = useCallback((apiAllocations: any[]) =>
    apiAllocations.map((a: any) => ({
      key: a.category as string,
      category: CATEGORY_LABELS[a.category]?.[lang] ?? a.category,
      amount: Number(a.amount ?? 0),
      percentage: Number(a.percentage ?? 0),
      advice: a.advice || (CATEGORY_ADVICE[a.category]?.[lang] ?? ''),
    })), [lang]);

  useEffect(() => {
    const fetchBudget = async () => {
      const res = await budgetApi.getPlan();
      if (res.ok && res.data) {
        const data = res.data as any;
        if (data?.totalIncome !== undefined && data?.totalIncome !== null) {
          setApiTotalIncome(Number(data.totalIncome));
        }
        if (data?.allocations?.length > 0) {
          const mapped = mapApiAllocations(data.allocations);
          setAllocations(mapped);
          setBackendPlan(mapped);
        } else {
          const defaults = buildAllocations();
          setAllocations(defaults);
          setBackendPlan(defaults);
        }
      } else {
        const defaults = buildAllocations();
        setAllocations(defaults);
        setBackendPlan(defaults);
      }

      const adj: Record<string, number> = {};
      CATEGORY_KEYS.forEach(k => { adj[k] = 0; });
      setAdjustments(adj);
      setLoading(false);
      initializedRef.current = true;
    };
    
    fetchBudget();
  }, [profile.account.email, buildAllocations, mapApiAllocations]);

  // When language changes, re-translate labels & advice (keep amounts)
  useEffect(() => {
    if (!initializedRef.current) return;
    setAllocations(prev => prev.map(item => ({
      ...item,
      category: CATEGORY_LABELS[item.key]?.[lang] ?? item.category,
      advice: CATEGORY_ADVICE[item.key]?.[lang] ?? item.advice,
    })));
  }, [lang]);

  const handleSave = async () => {
    const payload = allocations.map(a => ({
      category: a.key,
      amount: Math.round(a.amount),
      percentage: a.percentage,
    }));
    const res = await budgetApi.reallocate(payload);
    if (res.ok) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } else {
      console.error("Reallocate failed:", res.error);
    }
  };

  const handleRecalculate = () => {
    const hasAdjustments = Object.values(adjustments).some(v => v !== 0);
    if (hasAdjustments) {
      const updated = allocations.map(item => {
        const adj = adjustments[item.key] || 0;
        const newAmount = Math.max(0, item.amount + adj);
        return { ...item, amount: newAmount };
      });
      const totalAdj = updated.reduce((s, i) => s + i.amount, 0);
      const finalAllocations = updated.map(item => ({
        ...item,
        percentage: totalAdj > 0 ? Math.round((item.amount / totalAdj) * 100) : 0,
      }));
      setAllocations(finalAllocations);

      // Auto-save: trigger backend reallocate to persist adjustments
      const payload = finalAllocations.map(a => ({
        category: a.key,
        amount: Math.round(a.amount),
        percentage: a.percentage,
      }));
      budgetApi.reallocate(payload).catch(console.error);

      const adj: Record<string, number> = {};
      allocations.forEach(a => { adj[a.key] = 0; });
      setAdjustments(adj);
      setShowAdjust(false);
    } else {
      // Reset to defaults
      setIsRefreshing(true);
      setTimeout(() => {
        setAllocations(backendPlan ?? buildAllocations());
        const adj: Record<string, number> = {};
        allocations.forEach(a => { adj[a.key] = 0; });
        setAdjustments(adj);
        setIsRefreshing(false);
      }, 800);
    }
  };

  const totalAllocated = allocations.reduce((sum, item) => sum + item.amount, 0);
  const totalAdjustment = Object.values(adjustments).reduce((a, b) => a + b, 0);
  const remainingCash = totalIncome - totalFixed - totalAllocated + totalAdjustment;

  const categoryColors = [
    'bg-primary', 'bg-sky', 'bg-amber', 'bg-violet', 'bg-rose', 'bg-teal', 'bg-orange', 'bg-lime', 'bg-indigo'
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium font-cairo">{t.loadingBudget}</p>
      </div>
    );
  }

  return (
    <div id="print-area" className="space-y-8">
      <div className="hidden print:flex items-center justify-between border-b-2 border-primary pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center">
            <Wallet className="text-primary-foreground w-7 h-7" />
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-3xl font-bold text-foreground leading-none font-cairo">{t.appName}</span>
          </div>
        </div>
        <div className="text-end">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t.smartBudget}</p>
          <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between no-print" style={{ animation: 'slideUp 0.5s ease-out' }}>
        <div>
          <h2 className="text-2xl font-bold text-foreground font-cairo">{t.smartDistribution}</h2>
          <p className="text-muted-foreground">
            {t.aiOptimizes} {fn(totalIncome - totalFixed, lang)} {t.currency} {t.afterBills}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
            {showSaved ? <Sparkles className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {showSaved ? t.saved : t.savePlan}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4 relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[2rem]">
              <div className="glass p-4 rounded-2xl shadow-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm font-bold text-foreground">{t.optimizing}</span>
              </div>
            </div>
          )}
          {allocations.map((item, idx) => (
            <div key={item.key} className="card-3d glass p-6 rounded-3xl border border-border space-y-4 group transition-all hover:border-primary/30 hover:shadow-lg"
              style={{ animation: `slideUp 0.4s ease-out ${0.08 * idx}s both` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${categoryColors[idx % categoryColors.length]}/15 flex items-center justify-center font-bold text-foreground border border-border`}>
                    {item.category[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{item.category}</h4>
                    <p className="text-xs text-muted-foreground">{fn(item.percentage, lang)}% {t.ofAvailable}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="font-bold text-foreground">{fn(Number(item.amount ?? 0).toFixed(0), lang)} {t.currency}</p>
                  <p className="text-xs text-muted-foreground">{t.targetMonthly}</p>
                </div>
              </div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded-full bg-secondary">
                  <div style={{ width: `${Math.min(100, Math.max(0, item.percentage ?? 0))}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-primary-foreground justify-center ${categoryColors[idx % categoryColors.length]} rounded-full`}
                    ref={(el) => {
                      if (el) { el.style.transition = 'width 1s ease-out'; }
                    }}></div>
                </div>
              </div>
              {item.advice && (
                <div className="flex items-start gap-2 bg-amber/8 p-3 rounded-xl border border-amber/15">
                  <Sparkles className="w-4 h-4 text-amber flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-tight italic">{item.advice}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-foreground text-background p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden border border-border shimmer" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
            <div className="absolute top-0 end-0 w-32 h-32 bg-primary/10 rounded-full -me-16 -mt-16 blur-3xl" />
            <h3 className="font-bold text-lg relative z-10">{t.allocationSummary}</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-sm opacity-60">
                <span>{t.totalIncome}</span>
                <span className="font-bold opacity-100">{fn(totalIncome, lang)} {t.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">{t.fixedCosts}</span>
                <span className="text-destructive font-bold">-{fn(totalFixed, lang)} {t.currency}</span>
              </div>
              <hr className="border-background/20" />
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase opacity-50">{t.bufferFund}</span>
                <span className={`text-2xl font-black ${remainingCash < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {fn(remainingCash.toFixed(0), lang)} {t.currency}
                </span>
              </div>
            </div>

            {/* Budget Adjustment Section */}
            <button onClick={() => setShowAdjust(!showAdjust)}
              className="w-full py-2 text-xs font-bold text-primary bg-primary/15 rounded-xl flex items-center justify-center gap-1 hover:bg-primary/25 transition-all no-print">
              {showAdjust ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {lang === 'ar' ? 'تعديل الميزانية' : 'Adjust Budget'}
            </button>

            <div className={`overflow-hidden transition-all duration-500 ${showAdjust ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-3 pt-2 no-print">
                {allocations.map((item, idx) => (
                  <div key={item.key} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold truncate flex-1 opacity-70">{item.category}</span>
                    <div className="flex items-center gap-1">
                      {item.key !== 'optional' && (
                        <button onClick={() => {
                          const currentAmount = item.amount + (adjustments[item.key] || 0);
                          const step = Math.min(50, currentAmount);
                          if (step > 0) {
                            setAdjustments(prev => ({
                              ...prev,
                              [item.key]: (prev[item.key] || 0) - step,
                              optional: (prev.optional || 0) + step,
                            }));
                          }
                        }}
                          className="w-6 h-6 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                      
                      <span className={`text-xs font-black w-16 text-center ${(adjustments[item.key] || 0) > 0 ? 'text-primary' : (adjustments[item.key] || 0) < 0 ? 'text-destructive' : 'opacity-50'}`}>
                        {(adjustments[item.key] || 0) > 0 ? '+' : ''}{fn(adjustments[item.key] || 0, lang)}
                      </span>
                      
                      {item.key !== 'optional' && (
                        <button onClick={() => {
                          const optionalItem = allocations.find(a => a.key === 'optional');
                          const optionalAmount = optionalItem ? (optionalItem.amount + (adjustments.optional || 0)) : 0;
                          const step = Math.min(50, optionalAmount);
                          if (step > 0) {
                            setAdjustments(prev => ({
                              ...prev,
                              [item.key]: (prev[item.key] || 0) + step,
                              optional: (prev.optional || 0) - step,
                            }));
                          }
                        }}
                          className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleRecalculate} disabled={isRefreshing}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg disabled:opacity-50 group no-print hover:scale-[1.02] active:scale-[0.98]">
              <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-45 transition-transform'}`} />
              {t.recalculate}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;
