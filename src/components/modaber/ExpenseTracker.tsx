import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { Language } from '../../types';
import { translations } from '../../translations';
import { expenseApi } from '../../services/apiClient';
import { fn } from '../../utils/formatNumber';
import {
  Mic, MicOff, Plus, Wallet, Coffee, Car, Zap, Home, ShoppingBag,
  GraduationCap, Stethoscope, Gamepad2, Utensils, Fuel, Smartphone,
  Wifi, Droplets, Trash2, TrendingDown, Receipt, Sparkles, ArrowRight, AlertCircle
} from 'lucide-react';

interface ExpenseEntry {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface ExpenseTrackerProps {
  profile: UserProfile;
  lang: Language;
  onNavigate?: (page: string) => void;
}

const categoryConfig: Record<string, { icon: React.ElementType; color: string }> = {
  food: { icon: Utensils, color: 'bg-amber/15 text-amber border-amber/20' },
  transport: { icon: Car, color: 'bg-sky/15 text-sky border-sky/20' },
  rent: { icon: Home, color: 'bg-violet/15 text-violet border-violet/20' },
  electricity: { icon: Zap, color: 'bg-amber/15 text-amber border-amber/20' },
  water: { icon: Droplets, color: 'bg-sky/15 text-sky border-sky/20' },
  gas: { icon: Fuel, color: 'bg-rose/15 text-rose border-rose/20' },
  internet: { icon: Wifi, color: 'bg-primary/15 text-primary border-primary/20' },
  mobile: { icon: Smartphone, color: 'bg-teal/15 text-teal border-teal/20' },
  shopping: { icon: ShoppingBag, color: 'bg-rose/15 text-rose border-rose/20' },
  education: { icon: GraduationCap, color: 'bg-violet/15 text-violet border-violet/20' },
  medical: { icon: Stethoscope, color: 'bg-primary/15 text-primary border-primary/20' },
  entertainment: { icon: Gamepad2, color: 'bg-amber/15 text-amber border-amber/20' },
  coffee: { icon: Coffee, color: 'bg-amber/15 text-amber border-amber/20' },
  emergency: { icon: AlertCircle, color: 'bg-black/15 text-black border-black/20 dark:bg-white/15 dark:text-white dark:border-white/20' },
  other: { icon: Receipt, color: 'bg-muted text-muted-foreground border-border' },
};

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ profile, lang, onNavigate }) => {
  const t = translations[lang];
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [isListening, setIsListening] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  interface SpeechRecognitionType {
    stop: () => void; lang: string; continuous: boolean; interimResults: boolean;
    onresult: (event: { results: { transcript: string }[][] }) => void; onerror: () => void; onend: () => void; start: () => void;
  }
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  const categories = [
    { id: 'food', label: t.expCatFood },
    { id: 'transport', label: t.expCatTransport },
    { id: 'rent', label: t.rent },
    { id: 'electricity', label: t.electricity },
    { id: 'water', label: t.water },
    { id: 'gas', label: t.gas },
    { id: 'internet', label: t.internet },
    { id: 'mobile', label: t.mobile },
    { id: 'shopping', label: t.expCatShopping },
    { id: 'education', label: t.education },
    { id: 'medical', label: t.medical },
    { id: 'entertainment', label: t.expCatEntertainment },
    { id: 'coffee', label: t.expCatCoffee },
    { id: 'emergency', label: t.expCatEmergency },
    { id: 'other', label: t.expCatOther },
  ];

  useEffect(() => {
    const fetchExpenses = async () => {
      const res = await expenseApi.getAll(1, 100);
      if (res.ok && res.data) {
        const items = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
        setExpenses(items);
      }
    };
    fetchExpenses();
  }, []);

  const handleAdd = async () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;
    const entry = {
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString(),
    };
    
    const res = await expenseApi.create(entry);
    if (res.ok && res.data) {
      const newEntry = { ...entry, id: (res.data as any).id?.toString() || Date.now().toString() };
      setExpenses([newEntry, ...expenses]);
      setDescription('');
      setAmount('');
      setCategory('other');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await expenseApi.delete(parseInt(id, 10) || 0);
    if (res.ok) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  // Voice input
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const windowAny = window as unknown as { SpeechRecognition: new () => SpeechRecognitionType; webkitSpeechRecognition: new () => SpeechRecognitionType };
    const SpeechRecognition = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: { results: { transcript: string }[][] }) => {
      const transcript = event.results[0][0].transcript;
      // Try to extract amount from speech
      const numMatch = transcript.match(/(\d+[.,]?\d*)/);
      if (numMatch) {
        setAmount(numMatch[1].replace(',', '.'));
        setDescription(transcript.replace(numMatch[0], '').trim());
      } else {
        setDescription(transcript);
      }
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Calculate totals
  const today = new Date();
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const todayExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.toDateString() === today.toDateString();
  });
  const totalToday = todayExpenses.reduce((s, e) => s + e.amount, 0);

  const totalFixed = (Object.values(profile.fixedExpenses) as number[]).reduce((a, b) => a + b, 0);
  const budget = profile.monthlySalary - totalFixed;
  const remaining = budget - totalThisMonth;
  const usagePercent = budget > 0 ? Math.min((totalThisMonth / budget) * 100, 100) : 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Group by category for summary
  const categoryTotals = thisMonthExpenses.reduce((acc, e) => {
    const catId = (e.category || '').toLowerCase();
    acc[catId] = (acc[catId] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 min-h-[calc(100vh-140px)]" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-cairo">{t.expenseTracker}</h2>
          <p className="text-muted-foreground">{t.expenseTrackerDesc}</p>
        </div>
        {onNavigate && (
          <button onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all">
            {t.dashboard} <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-border space-y-1" style={{ animation: 'slideUp 0.4s ease-out both' }}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.expTodaySpent}</p>
          <p className="text-xl font-black text-foreground">{fn(totalToday.toFixed(2), lang)} <span className="text-xs font-bold text-muted-foreground">{t.currency}</span></p>
        </div>
        <div className="glass p-4 rounded-2xl border border-border space-y-1" style={{ animation: 'slideUp 0.4s ease-out 0.08s both' }}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.expMonthSpent}</p>
          <p className="text-xl font-black text-foreground">{fn(totalThisMonth.toFixed(2), lang)} <span className="text-xs font-bold text-muted-foreground">{t.currency}</span></p>
        </div>
        <div className="glass p-4 rounded-2xl border border-border space-y-1" style={{ animation: 'slideUp 0.4s ease-out 0.16s both' }}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.expBudget}</p>
          <p className="text-xl font-black text-foreground">{fn(budget.toFixed(2), lang)} <span className="text-xs font-bold text-muted-foreground">{t.currency}</span></p>
        </div>
        <div className="glass p-4 rounded-2xl border border-border space-y-1" style={{ animation: 'slideUp 0.4s ease-out 0.24s both' }}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.expRemaining}</p>
          <p className={`text-xl font-black ${remaining >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {fn(remaining.toFixed(2), lang)} <span className="text-xs font-bold text-muted-foreground">{t.currency}</span>
          </p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="glass p-6 rounded-3xl border border-border" style={{ animation: 'slideUp 0.4s ease-out 0.3s both' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">{t.expBudgetUsage}</span>
          <span className={`text-sm font-black ${usagePercent > 80 ? 'text-destructive' : 'text-primary'}`}>
            {lang === 'ar' ? `٪${fn(Math.round(usagePercent), lang)}` : `${Math.round(usagePercent)}%`}
          </span>
        </div>
        <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 80 ? 'bg-destructive' : usagePercent > 50 ? 'bg-amber' : 'bg-primary'}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        {usagePercent > 80 && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-destructive/10 rounded-xl border border-destructive/20">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-xs font-bold text-destructive">{t.expOverBudgetWarning}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass p-6 rounded-3xl border border-border space-y-5" style={{ animation: 'slideUp 0.4s ease-out 0.35s both' }}>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> {t.expAddNew}
            </h3>

            {/* Voice button */}
            <button onClick={toggleVoice}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all duration-300 ${
                isListening
                  ? 'bg-destructive text-destructive-foreground animate-pulse shadow-lg'
                  : 'bg-secondary text-foreground hover:bg-accent'
              }`}>
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isListening ? t.expStopListening : t.expSpeakExpense}
            </button>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">{t.expDescription}</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t.expDescPlaceholder}
                className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder-muted-foreground text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">{t.expAmount}</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder-muted-foreground text-sm border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                />
                <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{t.currency}</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2 block">{t.expCategory}</label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {categories.map(cat => {
                  const conf = categoryConfig[cat.id] || categoryConfig.other;
                  const isSelected = category === cat.id;
                  return (
                    <button key={cat.id} onClick={() => setCategory(cat.id)}
                      className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition-all duration-200 ${
                        isSelected ? 'bg-primary text-primary-foreground border-primary scale-105 shadow-md' : `${conf.color} hover:scale-[1.03]`
                      }`}>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleAdd}
              disabled={!description.trim() || !amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-lg">
              <Wallet className="w-4 h-4" /> {t.expLogExpense}
            </button>

            {/* Success */}
            {showSuccess && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">{t.expLoggedSuccess}</span>
              </div>
            )}
          </div>

          {/* Category Summary */}
          {sortedCategories.length > 0 && (
            <div className="glass p-6 rounded-3xl border border-border space-y-4" style={{ animation: 'slideUp 0.4s ease-out 0.4s both' }}>
              <h3 className="text-sm font-bold text-foreground">{t.expCategorySummary}</h3>
              {sortedCategories.map(([catId, total]) => {
                const conf = categoryConfig[catId] || categoryConfig.other;
                const CatIcon = conf.icon;
                const catLabel = categories.find(c => c.id === catId)?.label || catId;
                const pct = budget > 0 ? Math.round((total / budget) * 100) : 0;
                return (
                  <div key={catId} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${conf.color} border`}>
                      <CatIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground truncate">{catLabel}</span>
                        <span className="text-xs font-bold text-muted-foreground">{fn(total.toFixed(2), lang)} {t.currency}</span>
                      </div>
                      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-foreground">{t.expRecentExpenses}</h3>
          {expenses.length === 0 ? (
            <div className="glass p-16 rounded-3xl text-center border border-dashed border-border">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-bold">{t.expNoExpenses}</p>
              <p className="text-muted-foreground text-sm mt-1">{t.expNoExpensesHint}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pe-2">
              {expenses.slice(0, 50).map((exp, idx) => {
                const catKey = (exp.category || '').toLowerCase();
                const conf = categoryConfig[catKey] || categoryConfig.other;
                const CatIcon = conf.icon;
                const catLabel = categories.find(c => c.id === catKey)?.label || exp.category;
                return (
                  <div key={exp.id}
                    className="glass p-4 rounded-2xl border border-border flex items-center gap-4 group hover:border-primary/30 hover:shadow-md transition-all duration-300"
                    style={{ animation: `slideUp 0.3s ease-out ${0.05 * idx}s both` }}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${conf.color} border flex-shrink-0`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{exp.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {catLabel} • {formatDate(exp.date)}
                      </p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="font-black text-destructive text-sm">-{fn(exp.amount.toFixed(2), lang)} {t.currency}</p>
                    </div>
                    <button onClick={() => handleDelete(exp.id)}
                      className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
