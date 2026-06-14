import React from 'react';
import { UserProfile, Language } from '../../types';
import { translations } from '../../translations';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Trophy, TrendingUp, History, X, Loader2 } from 'lucide-react';
import { fn, renderLocalized } from '../../utils/formatNumber';
import { insightsApi } from '../../services/apiClient';

interface AnalyticsProps {
  profile: UserProfile;
  lang: Language;
}

const Analytics: React.FC<AnalyticsProps> = ({ profile, lang }) => {
  const t = translations[lang];
  const [showAchievements, setShowAchievements] = React.useState(false);
  const [achievements, setAchievements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const data = [
    { month: t.jan, savings: 400, target: 800, score: 65 },
    { month: t.feb, savings: 650, target: 800, score: 72 },
    { month: t.mar, savings: 500, target: 800, score: 68 },
    { month: t.apr, savings: 850, target: 800, score: 82 },
    { month: t.may, savings: 900, target: 800, score: 85 },
    { month: t.jun, savings: 1100, target: 800, score: 91 },
  ];

  React.useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await insightsApi.evaluateAchievements();
        if (res.ok && res.data) {
          const d = res.data as any;
          if (Array.isArray(d.all_achievements)) {
            setAchievements(d.all_achievements);
          }
        }
      } catch (error) {
        console.error('Failed to fetch achievements', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, [lang]);

  const reductionData = [
    { category: t.electricity, reduction: fn(12, lang), status: t.stable, color: 'text-sky' },
    { category: t.cat_food, reduction: fn(8, lang), status: t.improving, color: 'text-primary' },
    { category: t.transportation, reduction: fn(2, lang), status: t.warning, color: 'text-amber' },
  ];

  return (
    <div className="space-y-8 relative">
      {showAchievements && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/60 p-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="bg-card p-8 md:p-12 rounded-[3rem] shadow-2xl border border-border space-y-6 max-w-2xl w-full relative" style={{ animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <button onClick={() => setShowAchievements(false)} className="absolute top-6 end-6 p-2 hover:bg-secondary rounded-xl transition-colors">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-gradient-warm rounded-full flex items-center justify-center mx-auto text-primary-foreground mb-4 shadow-lg">
                <Trophy className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black text-foreground font-cairo">{t.yourAchievements}</h3>
              <p className="text-muted-foreground font-medium">{t.trackMilestones}</p>
            </div>
            <div className="grid gap-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm font-bold text-muted-foreground">{lang === 'ar' ? 'جاري تحميل الإنجازات...' : 'Loading achievements...'}</span>
                </div>
              ) : achievements.filter(a => a.earned).length > 0 ? (
                achievements.filter(a => a.earned).map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-primary/20 bg-primary/10 hover:shadow-md transition-all duration-300"
                    style={{ animation: `slideUp 0.3s ease-out ${0.05 * i}s both` }}>
                    <span className="text-3xl flex-shrink-0">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground truncate flex items-center gap-2">
                        {renderLocalized(a.title, lang)}
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-[9px] font-black rounded-full uppercase tracking-wider">
                          {lang === 'ar' ? 'مكتمل' : 'Unlocked'}
                        </span>
                      </h4>
                      <p className="text-xs text-muted-foreground leading-normal mt-0.5">{renderLocalized(a.description, lang)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-12 px-4 space-y-2">
                  <span className="text-4xl block">🏆</span>
                  <p className="font-bold text-foreground">{lang === 'ar' ? 'لم تفتح أي إنجازات بعد' : 'No achievements unlocked yet'}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{lang === 'ar' ? 'ابدأ بتسجيل مصروفاتك وتتبع ميزانيتك لتفتح أول إنجاز لك!' : 'Start logging expenses and tracking your budget to unlock your first milestone!'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass p-8 rounded-[32px] border border-border shadow-lg" style={{ animation: 'slideUp 0.5s ease-out' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-foreground font-cairo">{t.savingsProgression}</h3>
              <p className="text-sm text-muted-foreground">{t.trackingGrowth}</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-xs font-bold text-muted-foreground">{t.actual}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-border" /><span className="text-xs font-bold text-muted-foreground">{t.target}</span></div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: lang === 'ar' ? 50 : 10, left: lang === 'ar' ? 10 : 50, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160 60% 38%)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="hsl(160 60% 38%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 18% 90%)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(220 12% 48%)', fontSize: 13, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(220 12% 35%)', fontSize: 14, fontWeight: 800}} orientation={lang === 'ar' ? 'right' : 'left'} tickFormatter={(v) => fn(v, lang)} tickMargin={14} width={60} />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: 'hsl(230 25% 10%)', color: '#fff' }}
                  formatter={(value: number) => [`${fn(value, lang)} ${t.currency}`, t.savings]}
                  labelFormatter={(label) => label}
                />
                <Area type="monotone" dataKey="savings" stroke="hsl(160 60% 38%)" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-brand p-8 rounded-[32px] text-primary-foreground space-y-6 shadow-2xl shimmer" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="opacity-80 text-sm font-medium">{t.milestoneAchieved}</p>
              <h4 className="text-2xl font-bold font-cairo">{fn(15, lang)}% {t.savingsRate}</h4>
            </div>
            <button onClick={() => setShowAchievements(true)} className="w-full py-3 bg-primary-foreground text-primary rounded-2xl font-bold text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
              {t.viewAchievements}
            </button>
          </div>

          <div className="glass p-6 rounded-[32px] border border-border space-y-4 shadow-md" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground font-cairo">{t.financialIQ}</h4>
              <span className="text-primary font-bold">{t.high}</span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-teal w-[85%] rounded-full transition-all duration-1000" />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">{t.iqDesc}</p>
          </div>
        </div>
      </div>

      <div className="glass p-8 rounded-[32px] border border-border shadow-lg" style={{ animation: 'slideUp 0.6s ease-out 0.3s both' }}>
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 font-cairo">
          <History className="w-5 h-5 text-primary" /> {t.expenseReductionHistory}
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {reductionData.map((item, i) => (
            <div key={i} className="p-6 bg-secondary rounded-2xl space-y-2 hover:shadow-md transition-all border border-border hover:scale-[1.02]"
              style={{ animation: `slideUp 0.4s ease-out ${0.1 * i}s both` }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.category}</p>
              <div className="flex items-end justify-between">
                <h4 className="text-2xl font-black text-destructive">-{item.reduction}%</h4>
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-accent text-accent-foreground">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
