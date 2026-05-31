import React, { useState } from 'react';
import { UserProfile, InvestmentOption } from '../../types';
import { translations } from '../../translations';
import { Language } from '../../types';
import { investmentsApi } from '../../services/apiClient';
import { ShieldCheck, Info, TrendingUp, Lock, ToggleLeft as Toggle, ToggleRight } from 'lucide-react';
import { fn } from '../../utils/formatNumber';

interface InvestmentsProps {
  profile: UserProfile;
  lang: Language;
}

const Investments: React.FC<InvestmentsProps> = ({ profile, lang }) => {
  const t = translations[lang];
  const [enabled, setEnabled] = useState(true);
  const [showVault, setShowVault] = useState(false);

  const [options, setOptions] = useState<InvestmentOption[]>([
    {
      type: lang === 'ar' ? 'بنك' : 'Bank',
      title: lang === 'en' ? 'Fixed Deposit Certificates' : 'شهادات الادخار الثابتة',
      expectedReturn: lang === 'ar' ? '١٢٪ - ١٥٪ سنوي' : '12% - 15% Annual',
      riskLevel: lang === 'en' ? 'Zero Risk' : 'عديم المخاطر',
      description: lang === 'en' ? 'Capital-guaranteed certificates from top-tier national banks.' : 'شهادات مضمونة رأس المال من البنوك الوطنية الكبرى.',
      safetyReason: lang === 'en' ? 'Insured by Central Bank regulations with fixed guaranteed returns.' : 'مؤمنة من البنك المركزي بعوائد مضمونة ثابتة.'
    },
    {
      type: lang === 'ar' ? 'أصل' : 'Asset',
      title: lang === 'en' ? 'Physical Gold (Bullion)' : 'الذهب المادي (سبائك)',
      expectedReturn: lang === 'en' ? 'Variable (Value Store)' : 'متغير (مخزن قيمة)',
      riskLevel: lang === 'en' ? 'Low Risk' : 'مخاطر منخفضة',
      description: lang === 'en' ? 'Long-term wealth preservation through high-purity gold bars.' : 'الحفاظ على الثروة على المدى الطويل من خلال سبائك الذهب عالية النقاء.',
      safetyReason: lang === 'en' ? 'Historical hedge against inflation with no counterparty risk.' : 'تحوط تاريخي ضد التضخم دون مخاطر الطرف الآخر.'
    },
    {
      type: lang === 'ar' ? 'صندوق' : 'Fund',
      title: lang === 'en' ? 'Islamic Treasury Fund' : 'صندوق الخزينة الإسلامي',
      expectedReturn: lang === 'ar' ? '١٠٪ - ١٤٪ سنوي' : '10% - 14% Annual',
      riskLevel: lang === 'en' ? 'Low Risk' : 'مخاطر منخفضة',
      description: lang === 'en' ? 'Sharia-compliant fund investing in short-term government bonds.' : 'صندوق متوافق مع الشريعة يستثمر في السندات الحكومية قصيرة الأجل.',
      safetyReason: lang === 'en' ? 'Professionally managed with high liquidity and diversification.' : 'مُدار باحترافية مع سيولة عالية وتنوع كبير.'
    }
  ]);

  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await investmentsApi.getSuggestions();
        if (res.ok && res.data) {
          const fetched = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
          if (fetched.length > 0) setOptions(fetched);
        }
      } catch (error) {
        console.error('Failed to fetch investment suggestions', error);
      }
    };
    fetchOptions();
  }, [lang]);

  const totalIncome = profile.monthlySalary;
  const totalFixed = (Object.values(profile.fixedExpenses) as number[]).reduce((a, b) => a + b, 0);
  const surplus = totalIncome - totalFixed;
  const stability = surplus / totalIncome > 0.2;

  const cardGradients = [
    'hover:shadow-[0_20px_40px_-12px_hsl(var(--color-teal)/0.2)]',
    'hover:shadow-[0_20px_40px_-12px_hsl(var(--color-amber)/0.2)]',
    'hover:shadow-[0_20px_40px_-12px_hsl(var(--color-violet)/0.2)]',
  ];

  if (showVault) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between" style={{ animation: 'slideUp 0.5s ease-out' }}>
          <h2 className="text-3xl font-black text-foreground font-cairo flex items-center gap-3">
            <Lock className="w-8 h-8 text-primary" /> {t.investmentVault}
          </h2>
          <button onClick={() => setShowVault(false)} className="px-6 py-2 bg-secondary text-muted-foreground rounded-xl font-bold hover:bg-secondary/80 hover:scale-105 active:scale-95 transition-all">
            {t.back}
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass p-8 rounded-[2.5rem] border border-border space-y-6 shadow-lg" style={{ animation: 'slideUp 0.5s ease-out 0.1s both' }}>
            <h3 className="text-xl font-bold text-foreground font-cairo">{t.investLessons}</h3>
            <div className="space-y-4">
              {[
                { title: t.compoundInterest, desc: t.compoundDesc, color: 'border-l-4 border-l-teal rtl:border-l-0 rtl:border-r-4 rtl:border-r-teal' },
                { title: t.diversification, desc: t.diversificationDesc, color: 'border-l-4 border-l-amber rtl:border-l-0 rtl:border-r-4 rtl:border-r-amber' },
                { title: t.inflationHedge, desc: t.inflationDesc, color: 'border-l-4 border-l-violet rtl:border-l-0 rtl:border-r-4 rtl:border-r-violet' }
              ].map((lesson, i) => (
                <div key={i} className={`p-4 bg-secondary rounded-2xl border border-border ${lesson.color} hover:shadow-md transition-all`}
                  style={{ animation: `slideUp 0.4s ease-out ${0.15 * i}s both` }}>
                  <h4 className="font-bold text-primary mb-1">{lesson.title}</h4>
                  <p className="text-sm text-muted-foreground">{lesson.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-brand text-primary-foreground p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden shimmer" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
            <div className="absolute top-0 end-0 w-32 h-32 bg-primary-foreground/10 rounded-full -me-16 -mt-16 blur-3xl" />
            <h3 className="text-xl font-bold font-cairo relative z-10">{t.stabilityScore}</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-sm opacity-80">{t.monthlySurplus}</span>
                <span className="text-2xl font-black">{fn(surplus, lang)} {t.currency}</span>
              </div>
              <div className="w-full bg-primary-foreground/20 h-2 rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(100, (surplus / totalIncome) * 100)}%` }} className="h-full bg-primary-foreground rounded-full transition-all duration-1000" />
              </div>
              <p className="text-xs opacity-60 leading-relaxed italic">
                {stability ? t.stableProfile : t.buildEmergency}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass p-8 rounded-[32px] border border-border shadow-lg" style={{ animation: 'slideUp 0.5s ease-out' }}>
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-[24px] transition-all duration-500 ${enabled ? 'bg-gradient-brand text-primary-foreground shadow-lg' : 'bg-secondary text-muted-foreground'}`}>
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground font-cairo">{t.investmentEngine}</h2>
            <p className="text-muted-foreground">{t.curatingLowRisk}</p>
          </div>
        </div>
        <button onClick={() => setEnabled(!enabled)}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 ${enabled ? 'bg-primary text-primary-foreground shadow-xl' : 'bg-secondary text-muted-foreground'}`}>
          {enabled ? <ToggleRight className="w-8 h-8" /> : <Toggle className="w-8 h-8" />}
          {enabled ? t.systemLive : t.disabled}
        </button>
      </div>

      {!stability && (
        <div className="bg-destructive/10 p-6 rounded-3xl border border-destructive/20 flex items-start gap-4" style={{ animation: 'slideDown 0.5s ease-out' }}>
          <div className="p-3 bg-destructive/20 rounded-2xl text-destructive"><Lock className="w-6 h-6" /></div>
          <div className="space-y-1">
            <h4 className="font-black text-destructive uppercase text-xs tracking-widest font-cairo">{t.stabilityCaution}</h4>
            <p className="text-sm text-destructive/80 leading-relaxed font-medium">{t.emergencyReserve}</p>
          </div>
        </div>
      )}

      <div className={`grid md:grid-cols-3 gap-8 transition-all duration-500 ${!enabled ? 'opacity-30 pointer-events-none grayscale blur-sm' : ''}`}>
        {options.map((opt, idx) => (
          <div key={idx} className={`card-3d glass rounded-[2.5rem] border border-border overflow-hidden flex flex-col group hover:-translate-y-2 transition-all ${cardGradients[idx % cardGradients.length]}`}
            style={{ animation: `slideUp 0.5s ease-out ${0.12 * idx}s both` }}>
            <div className="p-8 space-y-6 flex-1">
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 bg-secondary text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-full border border-border">{opt.type}</span>
                <span className="text-primary font-black text-sm flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> {opt.expectedReturn.split(' ')[0]}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2 font-cairo">{opt.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{opt.description}</p>
              </div>
              <div className="bg-accent/50 p-4 rounded-2xl border border-accent">
                <div className="flex items-center gap-2 text-accent-foreground text-[10px] font-black uppercase mb-1">
                  <ShieldCheck className="w-4 h-4" /> {t.whySafe}
                </div>
                <p className="text-[11px] text-accent-foreground italic leading-snug font-medium">"{opt.safetyReason}"</p>
              </div>
            </div>
            <div className="p-8 pt-0 mt-auto">
              <div className="w-full py-4 bg-secondary text-muted-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-border">
                {t.verifiedAsset}
              </div>
            </div>
          </div>
        ))}
      </div>

      {enabled && (
        <div className="bg-foreground text-background p-10 rounded-[3rem] relative overflow-hidden shadow-2xl border border-border shimmer" style={{ animation: 'slideUp 0.6s ease-out 0.3s both' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-violet/10" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-start">
            <div className="w-24 h-24 bg-primary-foreground/10 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-primary-foreground/10 shadow-inner">
              <Info className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-2xl font-black font-cairo">{t.investmentMasterclass}</h3>
              <p className="opacity-60 font-medium">{t.learnGrowing}</p>
            </div>
            <button onClick={() => setShowVault(true)}
              className="px-10 py-5 bg-primary text-primary-foreground rounded-3xl font-black hover:opacity-90 transition-all shadow-xl hover:scale-105 active:scale-95">
              {t.investmentVault}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
