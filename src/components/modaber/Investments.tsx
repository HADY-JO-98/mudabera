import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { translations } from '../../translations';
import { Language } from '../../types';
import { budgetApi } from '../../services/apiClient';
import { ShieldCheck, Info, TrendingUp, Lock, Sparkles, Star, ChevronRight, X, BookOpen, AlertTriangle } from 'lucide-react';
import { formatPrice, fn } from '../../utils/formatNumber';

interface InvestmentsProps {
  profile: UserProfile;
  lang: Language;
}

interface InvestmentAsset {
  id: string;
  name: { ar: string; en: string };
  riskLevel: { ar: string; en: string };
  riskBadgeColor: string;
  shortDesc: { ar: string; en: string };
  longDesc: { ar: string; en: string };
  mechanism: { ar: string; en: string };
  advantages: { ar: string[]; en: string[] };
  suitableFor: { ar: string; en: string };
}

const ASSETS: InvestmentAsset[] = [
  {
    id: 'gold',
    name: { ar: 'الذهب المادي', en: 'Gold' },
    riskLevel: { ar: 'منخفضة إلى متوسطة', en: 'Low to Moderate' },
    riskBadgeColor: 'bg-amber/10 text-amber border-amber/20',
    shortDesc: {
      ar: 'سبائك أو عملات ذهبية مادية عيار ٢٤ كأصل ذو قيمة ذاتية.',
      en: 'Physical gold (typically 24K bullions or coins) holding intrinsic value.'
    },
    longDesc: {
      ar: 'الذهب المادي هو وسيلة تاريخية ممتازة لحفظ الثروة وحمايتها من التضخم وفقدان العملة الورقية لقيمتها.',
      en: 'Physical gold is a commodity that holds intrinsic value globally and historically. Purchased at current market price and stored securely.'
    },
    mechanism: {
      ar: 'يتم شراؤه بسعر السوق الحالي والاحتفاظ به بشكل آمن. ترتفع قيمته مع زيادة الطلب أو انخفاض قيمة العملات.',
      en: 'Purchased at current market price and stored securely. Its value grows as market demand increases or fiat currency depreciates.'
    },
    advantages: {
      ar: [
        'أداة قوية للتحوط ضد التضخم وتراجع العملة',
        'سيولة عالمية عالية وإمكانية بيعه بسهولة',
        'عدم وجود مخاطر إفلاس أو تعثر للطرف الآخر',
        'حفظ القيمة الحقيقية للثروة على المدى الطويل'
      ],
      en: [
        'Strong hedge against inflation',
        'High global liquidity',
        'No counterparty default risk',
        'Safe long-term wealth storage'
      ]
    },
    suitableFor: {
      ar: 'المستثمرين الراغبين في حماية مدخراتهم من التضخم وتدهور العملة على المدى المتوسط والبعيد.',
      en: 'Investors looking to protect savings from inflation and devaluation over a medium/long-term horizon.'
    }
  },
  {
    id: 'bank_certificate',
    name: { ar: 'شهادات الادخار البنكية', en: 'Bank Certificate' },
    riskLevel: { ar: 'منخفضة جداً', en: 'Very Low' },
    riskBadgeColor: 'bg-primary/10 text-primary border-primary/20',
    shortDesc: {
      ar: 'شهادات وودائع ثابتة المدة بفوائد وعوائد مضمونة من بنوك خاضعة للرقابة.',
      en: 'Fixed-term deposit certificates issued by regulated banks with guaranteed rates.'
    },
    longDesc: {
      ar: 'شهادات الادخار هي أوعية استثمارية تصدرها البنوك بمدد محددة (مثل سنة إلى ٣ سنوات) وتقدم عائداً دورياً ثابتاً ومضموناً بنسبة ١٠٠٪.',
      en: 'Fixed-term deposit certificates issued by regulated banks, offering a guaranteed fixed interest rate over a set period.'
    },
    mechanism: {
      ar: 'يتم تجميد مبلغ الاستثمار طوال مدة الشهادة، ويتم صرف عوائد دورية ثابتة مع استرداد أصل المبلغ بالكامل عند الاستحقاق.',
      en: 'Funds are locked for a fixed duration (e.g., 1-3 years) with fixed periodic interest payouts and full principal returned at maturity.'
    },
    advantages: {
      ar: [
        'عوائد وأرباح مضمونة بالكامل بنسبة ١٠٠٪',
        'دخل دوري متوقع ومنتظم لتمويل الاحتياجات',
        'أعلى مستويات الأمان ومكفولة بضمانات البنك المركزي',
        'تجنب تقلبات السوق اليومية تماماً'
      ],
      en: [
        '100% guaranteed returns',
        'Regular predictable income',
        'Backed fully by central bank regulations',
        'Zero daily market volatility'
      ]
    },
    suitableFor: {
      ar: 'الأشخاص الذين يفضلون تجنب المخاطر تماماً ويرغبون في دخل مستقر وتلقائي ولا يحتاجون للسيولة بشكل مستعجل.',
      en: 'Risk-averse individuals who seek stable, predictable income and do not need immediate access to capital.'
    }
  },
  {
    id: 'money_market',
    name: { ar: 'صناديق الاستثمار النقدية', en: 'Money Market Fund' },
    riskLevel: { ar: 'منخفضة', en: 'Low' },
    riskBadgeColor: 'bg-sky/10 text-sky border-sky/20',
    shortDesc: {
      ar: 'صناديق استثمار قصيرة الأجل في أدوات الدين تتميز بمرونة عالية وعائد يومي تراكمي.',
      en: 'Mutual funds investing in short-term debt, offering daily yields and high liquidity.'
    },
    longDesc: {
      ar: 'صناديق أسواق النقد هي صناديق تدار باحترافية وتستثمر في أصول منخفضة المخاطر مثل أذون الخزانة والودائع البنكية قصيرة الأجل.',
      en: 'Mutual funds investing in short-term debt securities, offering competitive yields with high liquidity and low risk.'
    },
    mechanism: {
      ar: 'يتم تجميع أموال المستثمرين وإدارتها لشراء أدوات مالية آمنة. يحسب الصندوق عائداً تراكمياً يومياً يضاف لأصل المبلغ مع إمكانية السحب اليومي.',
      en: 'Funds are pooled and managed by professional asset managers to invest in safe bills and deposits. The fund yields daily interest, withdrawable anytime.'
    },
    advantages: {
      ar: [
        'احتساب أرباح تراكمية بشكل يومي دون انتظار مدة طويلة',
        'سيولة ممتازة وإمكانية السحب والإيداع اليومي بسهولة',
        'إدارة احترافية وتنوع كافٍ لتقليص المخاطر',
        'عائد يتفوق عادة على حسابات التوفير التقليدية'
      ],
      en: [
        'Daily yield accrual',
        'High flexibility (withdraw/deposit daily)',
        'Professional asset management',
        'Outpaces traditional savings rates'
      ]
    },
    suitableFor: {
      ar: 'المستثمرين الباحثين عن عوائد جيدة ومستمرة مع الاحتفاظ بحرية كاملة لسحب الأموال في أي وقت خلال ٢٤ ساعة.',
      en: 'Investors wanting competitive returns while retaining the flexibility to withdraw money within 24 hours.'
    }
  },
  {
    id: 'savings_account',
    name: { ar: 'حساب التوفير البنكي', en: 'Savings Account' },
    riskLevel: { ar: 'تكاد تنعدم', en: 'Virtually Zero' },
    riskBadgeColor: 'bg-teal/10 text-teal border-teal/20',
    shortDesc: {
      ar: 'حساب بنكي يمنح فوائد دورية ويوفر سيولة فورية على مدار الساعة.',
      en: 'Interest-bearing bank deposit account offering maximum security and immediate liquidity.'
    },
    longDesc: {
      ar: 'حساب التوفير هو الحساب المصرفي الأساسي المخصص لحفظ الأموال الفائضة مع الحصول على أرباح دورية والاحتفاظ بحق السحب الفوري.',
      en: 'An interest-bearing deposit account held at a regulated bank, offering maximum security and immediate liquidity.'
    },
    mechanism: {
      ar: 'تودع الأموال في البنك وتدر فوائد محسوبة شهرياً أو سنوياً. تظل الأموال متاحة للسحب عبر بطاقات الصراف الآلي والإنترنت البنكي فوراً.',
      en: 'Money is deposited in a bank, earning periodic interest. Fully accessible via ATM or online banking instantly.'
    },
    advantages: {
      ar: [
        'سيولة فورية كاملة على مدار الساعة (٢٤/٧)',
        'حماية وضمانة حكومية وقانونية تامة لرأس المال',
        'سهولة تامة في استخدام الأموال عبر البطاقات والتحويلات',
        'بدون أي فترات تجميد أو شروط لربط الأموال'
      ],
      en: [
        'Instant 24/7 liquidity',
        'Absolute capital protection by regulations',
        'Easy access via debit cards',
        'No lock-in periods'
      ]
    },
    suitableFor: {
      ar: 'الراغبين في تحقيق أهداف مالية قريبة المدى، والذين تتطلب خططهم توفير وصول فوري وغير مشروط للكاش.',
      en: 'Individuals saving for short-term goals who need total flexibility and immediate access to cash.'
    }
  }
];

const Investments: React.FC<InvestmentsProps> = ({ profile, lang }) => {
  const t = translations[lang];
  const [savingsAmount, setSavingsAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset | null>(null);
  const [preferredAssetId, setPreferredAssetId] = useState<string | null>(null);

  // Load backend budget savings & shared preference for asset selection
  useEffect(() => {
    const fetchSavingsAndPreferences = async () => {
      try {
        const res = await budgetApi.getPlan();
        if (res.ok && res.data) {
          const allocations = (res.data as any).allocations || [];
          const savingsAlloc = allocations.find(
            (b: any) => b.category === 'savings' || b.category === 'الادخار' || b.category === 'Savings'
          );
          if (savingsAlloc) {
            setSavingsAmount(savingsAlloc.amount);
          }
        }
      } catch (err) {
        console.error('Failed to fetch budget in Investments', err);
      }

      // Load preferred asset state
      const savedPref = localStorage.getItem(`modaber_preferred_asset_${profile.account.email}`);
      if (savedPref) {
        setPreferredAssetId(savedPref);
      }
      setLoading(false);
    };

    fetchSavingsAndPreferences();
  }, [profile]);

  // Preferred selection persistence toggle
  const togglePreferred = (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPref = preferredAssetId === assetId ? null : assetId;
    setPreferredAssetId(newPref);
    if (newPref) {
      localStorage.setItem(`modaber_preferred_asset_${profile.account.email}`, newPref);
    } else {
      localStorage.removeItem(`modaber_preferred_asset_${profile.account.email}`);
    }
  };

  // Rule-based Recommendation Engine Logic
  const getRecommendation = (amount: number) => {
    if (amount < 1000) {
      return {
        id: 'savings_account',
        name: lang === 'ar' ? 'حساب التوفير البنكي' : 'Savings Account',
        reason: lang === 'ar' 
          ? 'المبلغ المخصص للادخار مناسب لحساب توفير لضمان السيولة الكاملة وبناء رصيد أولي.'
          : 'The savings amount is best suited for a savings account to preserve full liquidity and build an initial buffer.'
      };
    } else if (amount < 5000) {
      return {
        id: 'bank_certificate',
        name: lang === 'ar' ? 'شهادات الادخار البنكية' : 'Bank Certificate',
        reason: lang === 'ar'
          ? 'المبلغ يقع في النطاق المناسب للاستثمار في شهادات ادخار لتأمين عوائد ثابتة ومضمونة بالكامل.'
          : 'The amount fits a stable, fixed guaranteed yield target like fixed bank certificates.'
      };
    } else {
      return {
        id: 'gold',
        name: lang === 'ar' ? 'الذهب المادي' : 'Gold (Physical)',
        reason: lang === 'ar'
          ? 'المبلغ يسمح بشراء الذهب المادي للتحوط الفعال ضد التضخم وتقلبات العملة على المدى البعيد.'
          : 'The allocated savings is sufficient to purchase physical gold as an effective inflation hedge.'
      };
    }
  };

  // Risk Profile Classification logic
  const savingRatio = profile.monthlySalary > 0 ? (savingsAmount / profile.monthlySalary) : 0;
  
  const getRiskProfile = () => {
    if (savingRatio < 0.10) {
      return {
        class: lang === 'ar' ? 'محافظ (Conservative)' : 'Conservative',
        desc: lang === 'ar' 
          ? 'سعة ادخارية منخفضة. نوصي بالتركيز على الأمان التام والسيولة (حساب توفير أو شهادات).'
          : 'Low investment capacity. Focus on capital preservation and instant liquidity.',
        recommended: lang === 'ar' ? 'حساب التوفير / شهادات الادخار' : 'Savings Account / Bank Certificate',
        color: 'text-sky bg-sky/10 border-sky/20'
      };
    } else if (savingRatio <= 0.20) {
      return {
        class: lang === 'ar' ? 'متوازن (Balanced)' : 'Balanced',
        desc: lang === 'ar' 
          ? 'سلوك مالي معتدل ومخاطرة متوازنة. نوصي بتوزيع المدخرات بين الشهادات وصناديق أسواق النقد.'
          : 'Moderate savings rate. Balanced risk preferences. Best to mix certificates and money market funds.',
        recommended: lang === 'ar' ? 'شهادات الادخار / صناديق الاستثمار النقدية' : 'Bank Certificate / Money Market Fund',
        color: 'text-primary bg-primary/10 border-primary/20'
      };
    } else {
      return {
        class: lang === 'ar' ? 'مائل للنمو (Growth-Oriented)' : 'Growth-Oriented',
        desc: lang === 'ar' 
          ? 'قدرة ادخار عالية وتوجه مالي طويل الأمد. ننصح بالذهب المادي وصناديق أسواق النقد للنمو والتحوط.'
          : 'High savings capability with a long-term horizon. Recommended assets: Gold & Money Market Funds.',
        recommended: lang === 'ar' ? 'الذهب المادي / صناديق الاستثمار النقدية' : 'Gold / Money Market Fund',
        color: 'text-amber bg-amber/10 border-amber/20'
      };
    }
  };

  const recommended = getRecommendation(savingsAmount);
  const riskProfile = getRiskProfile();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium font-cairo">{t.scanningMarkets || 'جاري تحميل تفاصيل الاستثمار...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-cairo">{t.investmentEngine || 'مساعد الاستقرار المالي'}</h2>
          <p className="text-muted-foreground">
            {lang === 'ar' 
              ? 'نظام دعم اتخاذ القرار وتوجيه المدخرات بناءً على مخرجات ميزانية الذكاء الاصطناعي.'
              : 'Rule-based decision support system analyzing savings allocated by the AI budget model.'}
          </p>
        </div>
        <div className="glass border border-border px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground flex items-center gap-2 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-primary" />
          {lang === 'ar' ? 'نظام دعم القرار المالي' : 'Decision Support System'}
        </div>
      </div>

      {/* Top Section: Savings Summary Card & Decision Recommendations */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Available Savings Display */}
        <div className="glass p-8 rounded-3xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700" />
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest block">
              {lang === 'ar' ? 'المتاح للاستثمار والادخار' : 'Available for Investment'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-primary">{formatPrice(savingsAmount, lang, '')}</span>
              <span className="text-sm font-bold text-muted-foreground">{t.currency}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
              {lang === 'ar' 
                ? 'قيمة الادخار المحددة والمستخرجة مباشرة من نموذج ميزانية الذكاء الاصطناعي.'
                : 'Directly allocated savings amount output by the AI budget distribution model.'}
            </p>
          </div>
          <div className="pt-6 border-t border-border/60 mt-4 text-[10px] font-bold text-primary flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            {lang === 'ar' ? 'مأخوذة من التوزيع المالي للذكاء الاصطناعي' : 'Based on AI budget model output'}
          </div>
        </div>

        {/* Rule-based Recommendation Card */}
        <div className="glass p-8 rounded-3xl border border-primary/20 bg-primary/[0.02] flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest block">
              {lang === 'ar' ? 'الاستثمار الموصى به' : 'Recommended Asset'}
            </span>
            <h3 className="text-xl font-bold text-foreground font-cairo flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber" />
              {recommended.name}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {recommended.reason}
            </p>
          </div>
          <div className="pt-4 mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
            {lang === 'ar' ? 'مبني على قواعد منطق الاستقرار المالي' : 'Computed using logic rules'}
          </div>
        </div>

        {/* Risk Profile Classification Card */}
        <div className="glass p-8 rounded-3xl border border-border flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest block">
              {lang === 'ar' ? 'تصنيف نمط الادخار' : 'Saving Profile Class'}
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-bold w-fit border ${riskProfile.color}`}>
              {riskProfile.class}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {riskProfile.desc}
            </p>
          </div>
          <div className="pt-4 border-t border-border/60 mt-4">
            <span className="text-[10px] font-bold text-muted-foreground block">{lang === 'ar' ? 'الأصول الموصى بها:' : 'Suggested Mix:'}</span>
            <span className="text-xs font-bold text-foreground">{riskProfile.recommended}</span>
          </div>
        </div>

      </div>

      {/* Safety Alert Warning if Savings ratio is extremely low */}
      {savingRatio < 0.10 && (
        <div className="bg-destructive/[0.04] p-5 rounded-2xl border border-destructive/20 flex items-start gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="p-2.5 bg-destructive/10 rounded-xl text-destructive">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-destructive text-sm font-cairo">{lang === 'ar' ? 'توصية صندوق الطوارئ' : 'Emergency Fund Recommendation'}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'تظهر التحليلات أن نسبة ادخارك تقل عن ١٠٪ من دخلك. ننصح بشدة بالتركيز على بناء احتياطي طوارئ يغطي مصاريف ٣ أشهر على الأقل في حساب توفير سائل قبل تجميد أي أموال في استثمارات طويلة الأجل.'
                : 'Your saving ratio is below 10%. We strongly recommend allocating your savings to a liquid Savings Account to build an emergency reserve before locking any assets.'}
            </p>
          </div>
        </div>
      )}

      {/* Investment Options Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground font-cairo">
          {lang === 'ar' ? 'خيارات الاستثمار والأصول المتاحة' : 'Structured Investment Categories'}
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ASSETS.map((asset) => {
            const isPreferred = preferredAssetId === asset.id;
            const isRec = recommended.id === asset.id;
            return (
              <div 
                key={asset.id} 
                onClick={() => setSelectedAsset(asset)}
                className={`glass rounded-3xl border p-6 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                  isPreferred 
                    ? 'border-amber ring-2 ring-amber/20 bg-amber/[0.01]' 
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {/* Preference Star Toggle */}
                <button
                  onClick={(e) => togglePreferred(asset.id, e)}
                  className={`absolute top-4 end-4 p-2 rounded-xl border transition-all ${
                    isPreferred 
                      ? 'bg-amber/10 border-amber/30 text-amber' 
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                  title={lang === 'ar' ? 'تفضيل هذا الأصل' : 'Mark as preferred selection'}
                >
                  <Star className={`w-4 h-4 ${isPreferred ? 'fill-amber' : ''}`} />
                </button>

                <div className="space-y-4 flex-1">
                  {/* Category Type & Recommendation / Preferred Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${asset.riskBadgeColor}`}>
                      {asset.riskLevel[lang]}
                    </span>
                    {isRec && (
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase">
                        {lang === 'ar' ? 'موصى به' : 'Recommended'}
                      </span>
                    )}
                  </div>

                  {/* Asset Details */}
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-foreground font-cairo flex items-center gap-1.5">
                      {asset.name[lang]}
                      {isPreferred && <Star className="w-4 h-4 text-amber fill-amber" />}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      {asset.shortDesc[lang]}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary group-hover:text-primary-foreground transition-colors">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    {lang === 'ar' ? 'معرفة المزيد' : 'Learn More'}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Educational Tips Banner */}
      <div className="glass p-8 rounded-[2.5rem] border border-border shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary flex-shrink-0">
            <Info className="w-8 h-8" />
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-lg font-bold text-foreground font-cairo">
              {lang === 'ar' ? 'قواعد التثقيف المالي الذكي' : 'Financial Literacy Guidance'}
            </h4>
            <ul className="grid md:grid-cols-2 gap-2 text-xs text-muted-foreground list-disc list-inside">
              <li>{lang === 'ar' ? 'قم ببناء صندوق طوارئ أولاً قبل الشروع في أي استثمار.' : 'Build an emergency fund before starting to invest.'}</li>
              <li>{lang === 'ar' ? 'استثمر فقط الفائض المخطط له (الادخار المعتمد بالميزانية).' : 'Invest only planned surplus income (budgeted savings).'}</li>
              <li>{lang === 'ar' ? 'تجنب المنتجات المالية عالية المخاطر ذات التقلبات الحادة.' : 'Avoid high-risk financial products with high volatility.'}</li>
              <li>{lang === 'ar' ? 'نوّع أساليب الادخار والاحتفاظ بالنقد المالي لحماية القيمة.' : 'Diversify savings methods to preserve purchasing power.'}</li>
              <li>{lang === 'ar' ? 'قم بمراجعة ميزانيتك الشهرية والتزم بنسب التوزيع والادخار.' : 'Maintain a monthly financial review and stick to targets.'}</li>
              <li>{lang === 'ar' ? 'صب اهتمامك على الاستقرار والنمو المالي الآمن والبعيد الأمد.' : 'Focus on long-term safety and financial stability.'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Learn More Bottom Sheet Modal */}
      {selectedAsset && (
        <div 
          className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-[100] flex items-end justify-center p-4 md:p-6" 
          onClick={() => setSelectedAsset(null)}
          style={{ animation: 'fadeIn 0.25s ease-out' }}
        >
          <div 
            className="bg-card w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 md:p-10 border border-border space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedAsset(null)}
              className="absolute top-6 end-6 p-2.5 hover:bg-secondary rounded-xl transition-colors border border-border"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Asset Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedAsset.riskBadgeColor}`}>
                  {selectedAsset.riskLevel[lang]}
                </span>
                {preferredAssetId === selectedAsset.id && (
                  <span className="px-3 py-1 bg-amber/10 text-amber border border-amber/20 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber" />
                    {lang === 'ar' ? 'التفضيل النشط' : 'Preferred Selection'}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-foreground font-cairo">
                {selectedAsset.name[lang]}
              </h3>
            </div>

            <hr className="border-border/60" />

            {/* Detailed Explanations */}
            <div className="space-y-6 text-sm">
              
              {/* What is it & How it works */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground font-cairo">{lang === 'ar' ? 'نبذة عن الأداة الاستثمارية' : 'About the Asset'}</h4>
                <p className="text-muted-foreground leading-relaxed">{selectedAsset.longDesc[lang]}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground font-cairo">{lang === 'ar' ? 'آلية عمل الاستثمار' : 'How it Works'}</h4>
                <p className="text-muted-foreground leading-relaxed">{selectedAsset.mechanism[lang]}</p>
              </div>

              {/* Key Advantages */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground font-cairo">{lang === 'ar' ? 'المزايا الأساسية' : 'Key Advantages'}</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
                  {selectedAsset.advantages[lang].map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>

              {/* Suitability */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground font-cairo">{lang === 'ar' ? 'من هو المستثمر المناسب؟' : 'Suitable For'}</h4>
                <p className="text-muted-foreground leading-relaxed">{selectedAsset.suitableFor[lang]}</p>
              </div>

            </div>

            {/* Actions: Toggle Preferred & Close */}
            <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row gap-3">
              <button
                onClick={(e) => {
                  togglePreferred(selectedAsset.id, e);
                  setSelectedAsset(null);
                }}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 border ${
                  preferredAssetId === selectedAsset.id
                    ? 'bg-amber/10 border-amber/30 text-amber'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                <Star className={`w-4 h-4 ${preferredAssetId === selectedAsset.id ? 'fill-amber' : ''}`} />
                {preferredAssetId === selectedAsset.id 
                  ? (lang === 'ar' ? 'إلغاء التفضيل' : 'Remove Preferred')
                  : (lang === 'ar' ? 'تحديد كاختيار مفضل' : 'Set as Preferred Choice')}
              </button>
              <button
                onClick={() => setSelectedAsset(null)}
                className="py-3.5 px-6 bg-secondary text-foreground border border-border rounded-2xl font-bold text-sm hover:bg-secondary/80 transition-all"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Investments;
