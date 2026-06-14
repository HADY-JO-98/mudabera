import React, { useState } from 'react';
import { UserProfile, MaritalStatus, Language, LivingCostLevel, IncomeStability, SavingPreference, RiskTolerance, Debt, AnnualExpense } from '../../types';
import { translations } from '../../translations';
import { Wallet, Home, Shield, ChevronRight, ChevronLeft, Sun, Moon, Globe, Coffee, ChevronUp, ChevronDown, Plus, Minus, Trash2, CreditCard, Calendar, X, Loader2, AlertCircle } from 'lucide-react';
import CustomSelect from '../ui/custom-select';
import { toArabicDigits, fn } from '../../utils/formatNumber';
import { dataApi } from '../../services/apiClient.ts';

const arabicToLatin = (str: string): string => str.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const displayNum = (val: number | undefined, lang: Language): string => {
  if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) return '';
  return lang === 'ar' ? toArabicDigits(String(val)) : String(val);
};
const parseInput = (raw: string): string => arabicToLatin(raw).replace(/[^\d.]/g, '');

interface OnboardingProps {
  onComplete: (profile: Omit<UserProfile, 'account'>) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, lang, setLang, theme, setTheme }) => {
  const t = translations[lang];
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Omit<UserProfile, 'account'>>({
    monthlySalary: undefined as any, age: undefined, familyMembers: undefined as any,
    maritalStatus: '', livingCostLevel: '', incomeStability: '',
    fixedExpenses: {
      rent: undefined as any,
      electricity: undefined as any,
      water: undefined as any,
      gas: undefined as any,
      transportation: undefined as any,
      internet: undefined as any,
      mobile: undefined as any
    },
    debts: [],
    annualExpenses: [],
    optionalExpenses: {
      streaming: undefined as any,
      education: undefined as any,
      medical: undefined as any
    },
    preferences: {
      savingPriority: '',
      riskTolerance: '',
      emergencyFundPercentage: 10,
      monthlyPriorities: ['cat_food', 'cat_transport', 'cat_emergency', 'cat_savings']
    }
  });

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({ description: '', monthlyAmount: 0, priority: 'Medium' });
  const [showAnnualForm, setShowAnnualForm] = useState(false);
  const [newAnnual, setNewAnnual] = useState<Partial<AnnualExpense>>({ description: '', totalAmount: 0, priority: 'Medium' });
  const [customPriority, setCustomPriority] = useState('');
  const [showCustomPriorityInput, setShowCustomPriorityInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>()

  const updateRootField = (field: keyof Omit<UserProfile, 'account'>, value: UserProfile[keyof Omit<UserProfile, 'account'>]) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateFixedExpense = (field: keyof typeof formData.fixedExpenses, value: number) => setFormData(prev => ({ ...prev, fixedExpenses: { ...prev.fixedExpenses, [field]: value } }));
  const updateOptionalExpense = (field: keyof typeof formData.optionalExpenses, value: number) => setFormData(prev => ({ ...prev, optionalExpenses: { ...prev.optionalExpenses, [field]: value } }));
  const updatePreference = (field: keyof typeof formData.preferences, value: string | number | string[]) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, [field]: value } }));

  const addDebt = () => {
    if (!newDebt.description || !newDebt.monthlyAmount) return;
    const debt: Debt = { id: Math.random().toString(36).substring(7), description: newDebt.description!, monthlyAmount: newDebt.monthlyAmount!, priority: newDebt.priority as 'High' | 'Medium' | 'Low', dueDate: newDebt.dueDate };
    updateRootField('debts', [...formData.debts, debt]);
    setNewDebt({ description: '', monthlyAmount: 0, priority: 'Medium' });
    setShowDebtForm(false);
  };

  const addAnnual = () => {
    if (!newAnnual.description || !newAnnual.totalAmount) return;
    const annual: AnnualExpense = { id: Math.random().toString(36).substring(7), description: newAnnual.description!, totalAmount: newAnnual.totalAmount!, priority: newAnnual.priority as 'High' | 'Medium' | 'Low', expectedMonth: newAnnual.expectedMonth };
    updateRootField('annualExpenses', [...formData.annualExpenses, annual]);
    setNewAnnual({ description: '', totalAmount: 0, priority: 'Medium' });
    setShowAnnualForm(false);
  };

  const removeDebt = (id: string) => updateRootField('debts', formData.debts.filter(d => d.id !== id));
  const removeAnnual = (id: string) => updateRootField('annualExpenses', formData.annualExpenses.filter(e => e.id !== id));

  const handleSubmit = async ()=>{
    setIsLoading( true );
    setError(null);
    
    const payload={
      monthlySalary : formData.monthlySalary ?? 0,
      age : formData.age ?? 0,
      familyMembers : formData.familyMembers ?? 1,
      martialStatus : formData.maritalStatus,
      livingCostLevel : formData.livingCostLevel,
      incomeStability : formData.incomeStability,
      fixedExpenses : {
        rent : formData.fixedExpenses.rent ?? 0,
        electricity : formData.fixedExpenses.electricity ?? 0,
        water : formData.fixedExpenses.water ?? 0,
        gas : formData.fixedExpenses.gas ?? 0,
        transportation : formData.fixedExpenses.transportation ?? 0,
        internet : formData.fixedExpenses.internet ?? 0,
        mobile : formData.fixedExpenses.mobile ?? 0
      },
      debts : formData.debts.map(({id, ...rest})=>rest),
      annualExpenses : formData.debts.map(({id, ...rest})=>rest),
      optionalExpenses : {
        streaming : formData.optionalExpenses.streaming ?? 0,
        education : formData.optionalExpenses.education ?? 0,
        medical : formData.optionalExpenses.medical ?? 0
      },
      preferences : {
        savingPriority : formData.preferences?.savingPriority ?? 'not_specified',
        riskTolerance : formData.preferences?.riskTolerance ?? 'not_specified',
        emergencyFundPercentage : formData.preferences?.emergencyFundPercentage ?? 10,
        monthlyPriorities :  formData.preferences?.monthlyPriorities ?? []
      }
    };
    const res = await dataApi.onboard(payload);

    if(!res.ok){
      setError(res.error || (lang === 'ar' ? 'حدث خطأ حاول مرة اخرى' : 'Something went wrong, please try again'));
      setIsLoading(false);
      return;
    }

    onComplete(formData);
    setIsLoading(false);
  }

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newP = [...formData.preferences.monthlyPriorities];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < newP.length) { [newP[index], newP[target]] = [newP[target], newP[index]]; updatePreference('monthlyPriorities', newP); }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.monthlySalary) {
        alert(lang === 'ar' ? 'الرجاء إدخال الراتب الشهري' : 'Please enter your monthly salary');
        return;
      }
      if (!formData.familyMembers) {
        alert(lang === 'ar' ? 'الرجاء إدخال عدد أفراد الأسرة' : 'Please enter family members count');
        return;
      }
      if (!formData.age) {
        alert(lang === 'ar' ? 'الرجاء إدخال العمر' : 'Please enter your age');
        return;
      }
      if (formData.maritalStatus === 'not_specified' || !formData.maritalStatus) {
        alert(lang === 'ar' ? 'الرجاء اختيار الحالة الاجتماعية' : 'Please select your marital status');
        return;
      }
      if (!formData.livingCostLevel) {
        alert(lang === 'ar' ? 'الرجاء اختيار مستوى المعيشة' : 'Please select living cost level');
        return;
      }
      if (!formData.incomeStability) {
        alert(lang === 'ar' ? 'الرجاء اختيار استقرار الدخل' : 'Please select income stability');
        return;
      }
      if (formData.maritalStatus === 'married' && formData.familyMembers === 1) { alert(t.invalidMaritalStatus); return; }
    }
    if (step === 2) {
      for (const field of fixedFields) {
        if (field.required) {
          const val = formData.fixedExpenses[field.id as keyof typeof formData.fixedExpenses];
          if (val === undefined || val === null || isNaN(val)) {
            alert(lang === 'ar' ? `الرجاء إدخال قيمة لـ ${t[field.id as keyof typeof t] || field.id}` : `Please enter a value for ${t[field.id as keyof typeof t] || field.id}`);
            return;
          }
        }
      }
    }
    if (step === 4) {
      if (!formData.preferences.savingPriority || formData.preferences.savingPriority === 'not_specified') {
        alert(lang === 'ar' ? 'الرجاء اختيار أولوية الادخار' : 'Please select saving priority');
        return;
      }
      if (!formData.preferences.riskTolerance || formData.preferences.riskTolerance === 'not_specified') {
        alert(lang === 'ar' ? 'الرجاء اختيار مدى تحمل المخاطر' : 'Please select risk tolerance');
        return;
      }
    }
    setStep(step + 1);
  };

  const fixedFields = [
    { id: 'rent', required: true, placeholder: lang === 'ar' ? 'مثال: 1000' : 'e.g. 1000' },
    { id: 'electricity', required: true, placeholder: lang === 'ar' ? 'مثال: 100' : 'e.g. 100' },
    { id: 'water', required: true, placeholder: lang === 'ar' ? 'مثال: 50' : 'e.g. 50' },
    { id: 'gas', required: true, placeholder: lang === 'ar' ? 'مثال: 50' : 'e.g. 50' },
    { id: 'transportation', required: true, placeholder: lang === 'ar' ? 'مثال: 150' : 'e.g. 150' },
    { id: 'internet', required: false, placeholder: lang === 'ar' ? 'مثال: 50' : 'e.g. 50' },
    { id: 'mobile', required: false, placeholder: lang === 'ar' ? 'مثال: 30' : 'e.g. 30' }
  ];

  const optionalFields = [
    { id: 'streaming', placeholder: lang === 'ar' ? 'مثال: 0' : 'e.g. 0' },
    { id: 'education', placeholder: lang === 'ar' ? 'مثال: 0' : 'e.g. 0' },
    { id: 'medical', placeholder: lang === 'ar' ? 'مثال: 0' : 'e.g. 0' }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-0 sm:p-4 transition-colors duration-300 relative">
      <div className={`absolute top-4 sm:top-6 ${lang === 'ar' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} flex items-center gap-2 sm:gap-3 z-50`}>
        <div className="glass flex items-center p-1 rounded-2xl shadow-sm">
          <button type="button" onClick={() => setTheme('light')} className={`p-2 rounded-xl transition-all flex items-center justify-center ${theme === 'light' ? 'bg-accent text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Sun className="w-5 h-5" />
            <span className="sr-only">sun</span>
          </button>
          <button type="button" onClick={() => setTheme('dark')} className={`p-2 rounded-xl transition-all flex items-center justify-center ${theme === 'dark' ? 'bg-accent text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Moon className="w-5 h-5" />
            <span className="sr-only">moon</span>
          </button>
        </div>
        <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="glass px-4 rounded-2xl text-muted-foreground hover:text-foreground hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-sm h-[48px]">
          <span className="text-xs font-black uppercase mt-0.5">{lang === 'en' ? 'AR' : 'EN'}</span>
          <Globe className="w-5 h-5" />
        </button>
      </div>

      <div className="glass sm:rounded-[2.5rem] sm:shadow-2xl w-full max-w-[1200px] min-h-[100dvh] sm:min-h-0 sm:max-h-[90vh] flex flex-col overflow-hidden bg-card">
        <div className="bg-gradient-brand p-6 pt-20 sm:p-8 text-primary-foreground relative overflow-hidden shrink-0">
          <div className="absolute top-0 end-0 w-64 h-64 bg-primary-foreground/10 rounded-full -me-32 -mt-32 blur-3xl" />
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h1 className="text-2xl font-bold font-cairo">{t.financialProfile}</h1>
            <span className="opacity-80 font-medium">{t.step} {fn(step, lang)} {t.of} {fn(5, lang)}</span>
          </div>
          <div className="flex gap-1.5 relative z-10">
            {[1,2,3,4,5].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary-foreground' : 'bg-primary-foreground/20'}`} />)}
          </div>
        </div>

        <div className="p-6 sm:p-8 md:p-12 flex-1 overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent rounded-lg text-primary"><Wallet className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold font-cairo text-foreground">{t.basicInfo}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: t.monthlySalary, value: formData.monthlySalary, field: 'monthlySalary', required: true, type: 'number', placeholder: lang === 'ar' ? 'مثال: 5000' : 'e.g. 5000' },
                  { label: t.familyMembers, value: formData.familyMembers, field: 'familyMembers', required: true, type: 'number', min: 1, max: 10, placeholder: lang === 'ar' ? 'مثال: 3' : 'e.g. 3' },
                  { label: t.age, value: formData.age, field: 'age', required: true, type: 'number', placeholder: lang === 'ar' ? 'مثال: 25' : 'e.g. 25' },
                ].map(f => (
                  <div key={f.field}>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{f.label} {f.required ? <span className="text-destructive">*</span> : `(${t.optional})`}</label>
                    <input type="text" inputMode="numeric" required={f.required} placeholder={f.placeholder}
                      value={displayNum(f.value as number | undefined, lang)} onChange={(e) => {
                        const cleaned = parseInput(e.target.value);
                        const val = cleaned ? Number(cleaned) : undefined;
                        if (f.min !== undefined && val !== undefined && val < f.min) return;
                        if (f.max !== undefined && val !== undefined && val > f.max) return;
                        updateRootField(f.field as keyof Omit<UserProfile, 'account'>, val as never);
                        if (f.field === 'familyMembers' && val === 1) {
                          updateRootField('maritalStatus', 'single');
                        }
                      }}
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-foreground"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t.maritalStatus} <span className="text-destructive">*</span></label>
                  <CustomSelect value={formData.maritalStatus} onChange={(v) => updateRootField('maritalStatus', v)}
                    placeholder={lang === 'ar' ? 'اختر الحالة الاجتماعية' : 'Select marital status'}
                    options={[
                      { value: 'single', label: t.single },
                      { value: 'married', label: t.married },
                    ]} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t.livingCostLevel} <span className="text-destructive">*</span></label>
                  <CustomSelect value={formData.livingCostLevel} onChange={(v) => updateRootField('livingCostLevel', v)}
                    placeholder={lang === 'ar' ? 'اختر مستوى تكلفة المعيشة' : 'Select living cost level'}
                    options={[
                      { value: 'High', label: t.high },
                      { value: 'Medium', label: t.medium },
                      { value: 'Low', label: t.low },
                    ]} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">{t.incomeStability} <span className="text-destructive">*</span></label>
                  <CustomSelect value={formData.incomeStability} onChange={(v) => updateRootField('incomeStability', v)}
                    placeholder={lang === 'ar' ? 'اختر استقرار الدخل' : 'Select income stability'}
                    options={[
                      { value: 'Full-time', label: t.full_time },
                      { value: 'Freelance', label: t.freelance },
                      { value: 'Seasonal', label: t.seasonal },
                      { value: 'Mixed', label: t.mixed },
                    ]} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent rounded-lg text-primary"><Home className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold font-cairo text-foreground">{t.fixedExpenses}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {fixedFields.map(f => (
                  <div key={f.id}>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t[f.id as keyof typeof t] || f.id} {f.required && <span className="text-destructive">*</span>}</label>
                    <input type="text" inputMode="numeric" required={f.required} placeholder={f.placeholder}
                      value={displayNum(formData.fixedExpenses[f.id as keyof typeof formData.fixedExpenses], lang)}
                      onChange={(e) => updateFixedExpense(f.id as keyof typeof formData.fixedExpenses, Number(parseInput(e.target.value) || 0))}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm outline-none focus:border-primary transition-all text-foreground" />
                  </div>
                ))}
              </div>

              {/* Debts */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />{t.debts}</h4>
                  <button onClick={() => setShowDebtForm(!showDebtForm)} className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 transition-colors">
                    {showDebtForm ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {t.addDebt}
                  </button>
                </div>
                {formData.debts.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-foreground">{d.description}</p>
                      <p className="text-xs text-muted-foreground">{fn(d.monthlyAmount, lang)} {t.currency}/{t.monthlyPer} • {t[d.priority?.toLowerCase() as keyof typeof t] || d.priority}</p>
                    </div>
                    <button onClick={() => removeDebt(d.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {showDebtForm && (
                  <div className="p-6 bg-secondary rounded-2xl border border-primary/20 space-y-4 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder={t.debtName} value={newDebt.description} onChange={e => setNewDebt({...newDebt, description: e.target.value})}
                        className="col-span-2 px-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground" />
                      <input type="text" inputMode="numeric" placeholder={t.monthlyAmount}
                        value={displayNum(newDebt.monthlyAmount, lang)}
                        onChange={e => setNewDebt({...newDebt, monthlyAmount: Number(parseInput(e.target.value) || 0)})}
                        className="px-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground" />
                      <CustomSelect value={newDebt.priority || 'Medium'} onChange={(v) => setNewDebt({...newDebt, priority: v as 'High' | 'Medium' | 'Low'})}
                        options={[{ value: 'Low', label: t.low }, { value: 'Medium', label: t.medium }, { value: 'High', label: t.high }]} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDebtForm(false)} className="flex-1 py-2 text-xs font-bold text-muted-foreground">{t.cancel}</button>
                      <button onClick={addDebt} className="flex-[2] py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">{t.addDebt}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Annual Expenses */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />{t.annualExpenses}</h4>
                  <button onClick={() => setShowAnnualForm(!showAnnualForm)} className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80">
                    {showAnnualForm ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {t.addAnnual}
                  </button>
                </div>
                {formData.annualExpenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-foreground">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{fn(e.totalAmount, lang)} {t.currency}/{t.yearlyPer}</p>
                    </div>
                    <button onClick={() => removeAnnual(e.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {showAnnualForm && (
                  <div className="p-6 bg-secondary rounded-2xl border border-primary/20 space-y-4 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder={t.debtName} value={newAnnual.description} onChange={e => setNewAnnual({...newAnnual, description: e.target.value})}
                        className="col-span-2 px-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground" />
                      <input type="text" inputMode="numeric" placeholder={t.totalAmount}
                        value={displayNum(newAnnual.totalAmount, lang)}
                        onChange={e => setNewAnnual({...newAnnual, totalAmount: Number(parseInput(e.target.value) || 0)})}
                        className="px-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground" />
                      <CustomSelect value={newAnnual.priority || 'Medium'} onChange={(v) => setNewAnnual({...newAnnual, priority: v as 'High' | 'Medium' | 'Low'})}
                        options={[{ value: 'Low', label: t.low }, { value: 'Medium', label: t.medium }, { value: 'High', label: t.high }]} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowAnnualForm(false)} className="flex-1 py-2 text-xs font-bold text-muted-foreground">{t.cancel}</button>
                      <button onClick={addAnnual} className="flex-[2] py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">{t.addAnnual}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent rounded-lg text-primary"><Coffee className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold font-cairo text-foreground">{t.optionalExpenses}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {optionalFields.map(f => (
                  <div key={f.id}>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t[f.id as keyof typeof t] || f.id} ({t.optional})</label>
                    <input type="text" inputMode="numeric" placeholder={f.placeholder}
                      value={displayNum(formData.optionalExpenses[f.id as keyof typeof formData.optionalExpenses], lang)}
                      onChange={(e) => updateOptionalExpense(f.id as keyof typeof formData.optionalExpenses, Number(parseInput(e.target.value) || 0))}
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary transition-all text-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent rounded-lg text-primary"><Shield className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold font-cairo text-foreground">{t.aiLogic}</h3>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3">{t.savingPriority} <span className="text-destructive">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map(p => (
                      <button key={p} onClick={() => updatePreference('savingPriority', p)}
                        className={`py-2 rounded-xl border-2 transition-all font-bold text-xs ${formData.preferences.savingPriority === p ? 'border-primary bg-accent text-primary' : 'border-border text-muted-foreground'}`}>
                        {t[p.toLowerCase() as keyof typeof t] || p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3">{t.riskTolerance} <span className="text-destructive">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map(p => (
                      <button key={p} onClick={() => updatePreference('riskTolerance', p)}
                        className={`py-2 rounded-xl border-2 transition-all font-bold text-xs ${formData.preferences.riskTolerance === p ? 'border-primary bg-accent text-primary' : 'border-border text-muted-foreground'}`}>
                        {t[p.toLowerCase() as keyof typeof t] || p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3">{t.monthlyPriorities}</label>
                  <div className="space-y-2">
                    {formData.preferences.monthlyPriorities.map((p, idx) => (
                      <div key={p} className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-border">
                        <span className="text-sm font-bold text-foreground flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-muted text-[10px] flex items-center justify-center text-muted-foreground">{fn(idx + 1, lang)}</span>
                          {t[p as keyof typeof t] || p}
                        </span>
                        <div className="flex gap-1">
                          <button disabled={idx === 0} onClick={() => movePriority(idx, 'up')} className="p-1.5 hover:bg-card rounded-lg text-muted-foreground disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                          <button disabled={idx === formData.preferences.monthlyPriorities.length - 1} onClick={() => movePriority(idx, 'down')} className="p-1.5 hover:bg-card rounded-lg text-muted-foreground disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-8 space-y-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-accent text-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl float-3d">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold font-cairo text-foreground">{t.profileInitialized}</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">{t.readyRoadmap}</p>
              {error && (
                <div className="...same red error style as Auth.tsx...">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 border-t border-border flex gap-4 shrink-0 bg-card">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 px-6 py-4 border-2 border-border rounded-2xl font-bold text-muted-foreground hover:bg-secondary transition-all flex items-center justify-center gap-2">
              <ChevronLeft className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />{t.back}
            </button>
          )}
          <button onClick={step === 5 ? handleSubmit : nextStep}
            disabled={isLoading}
            className="flex-[2] px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-2">
            {step === 5 ? (
              isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>{t.launchDashboard} <ChevronRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} /></>
              )
            ) : (
              <>{t.continue} <ChevronRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
