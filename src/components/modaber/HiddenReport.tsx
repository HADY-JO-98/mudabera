import React from 'react';
import { UserProfile, Language } from '../../types';
import { translations } from '../../translations';
import { fn } from '../../utils/formatNumber';

interface HiddenReportProps {
  profile: UserProfile;
  lang: Language;
}

const HiddenReport: React.FC<HiddenReportProps> = ({ profile, lang }) => {
  const t = translations[lang];
  const isAr = lang === 'ar';
  // Arabic ligatures break when uppercase/letter-spacing is applied — disable for AR.
  const upper = (extra: React.CSSProperties = {}): React.CSSProperties =>
    isAr ? extra : { textTransform: 'uppercase', letterSpacing: 2, ...extra };
  const upperTight = (extra: React.CSSProperties = {}): React.CSSProperties =>
    isAr ? extra : { textTransform: 'uppercase', letterSpacing: 1, ...extra };
  const totalFixed = (Object.values(profile.fixedExpenses) as number[]).reduce((a, b) => a + b, 0);
  const totalOptional = (Object.values(profile.optionalExpenses) as number[]).reduce((a, b) => a + b, 0);
  const totalDebts = profile.debts.reduce((sum, d) => sum + d.monthlyAmount, 0);
  const availableIncome = profile.monthlySalary - totalFixed - totalDebts;
  const burdenRatio = totalFixed > 0 ? Math.round((totalFixed / profile.monthlySalary) * 100) : 0;
  const savingsTarget = Math.round(availableIncome * (profile.preferences.emergencyFundPercentage / 100));
  const dateStr = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'full' });
  const score = 84;

  const expenseLabels: Record<string, string> = lang === 'ar' 
    ? { rent: 'الإيجار', electricity: 'الكهرباء', water: 'المياه', gas: 'الغاز', transportation: 'المواصلات', internet: 'الإنترنت', mobile: 'الموبايل' }
    : { rent: 'Rent', electricity: 'Electricity', water: 'Water', gas: 'Gas', transportation: 'Transportation', internet: 'Internet', mobile: 'Mobile' };

  const optionalLabels: Record<string, string> = lang === 'ar'
    ? { streaming: 'اشتراكات', education: 'تعليم', medical: 'طبي' }
    : { streaming: 'Streaming', education: 'Education', medical: 'Medical' };

  const priorityLabels: Record<string, string> = lang === 'ar'
    ? { cat_food: 'الطعام', cat_transport: 'المواصلات', cat_emergency: 'الطوارئ', cat_savings: 'الادخار', cat_invest: 'الاستثمار', cat_personal: 'شخصي' }
    : { cat_food: 'Food', cat_transport: 'Transport', cat_emergency: 'Emergency', cat_savings: 'Savings', cat_invest: 'Investment', cat_personal: 'Personal' };

  const maritalLabel = lang === 'ar'
    ? { single: 'أعزب', married: 'متزوج', not_specified: 'غير محدد' }
    : { single: 'Single', married: 'Married', not_specified: 'Not Specified' };

  const incomeLabel = lang === 'ar'
    ? { 'Full-time': 'دوام كامل', 'Freelance': 'حر', 'Seasonal': 'موسمي', 'Mixed': 'مختلط' }
    : { 'Full-time': 'Full-time', 'Freelance': 'Freelance', 'Seasonal': 'Seasonal', 'Mixed': 'Mixed' };

  return (
    <div id="full-report-template" className="font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ width: 900, padding: 48, background: '#ffffff', color: '#1e293b', fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}>
      
      {/* ═══ Header ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, background: '#059669', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 24 }}>💰</span>
          </div>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: '#1e293b', margin: 0, lineHeight: 1 }}>
              {isAr ? 'مُدَبِّر' : 'mudaber'}
            </h1>
          </div>
        </div>
        <div style={{ textAlign: isAr ? 'left' : 'right' }}>
          <div style={{ background: '#0f172a', color: '#fff', fontSize: 9, fontWeight: 800, padding: '4px 12px', borderRadius: 6, display: 'inline-block', marginBottom: 4, ...upper() }}>
            {isAr ? 'تحليل سري' : 'CONFIDENTIAL ANALYSIS'}
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', margin: 0 }}>
            {isAr ? 'لوحة التحكم الذكية' : 'SMART DASHBOARD'}
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{dateStr}</p>
        </div>
      </div>

      {/* ═══ Top 3 Summary Cards ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#0f172a', borderRadius: 20, padding: '20px 24px', color: 'white' }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', margin: '0 0 8px', ...upper() }}>{t.totalIncome}</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, lineHeight: 1 }}>{fn(profile.monthlySalary, lang)} <span style={{ fontSize: 14, color: '#94a3b8' }}>{t.currency}</span></h2>
          <p style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, margin: '4px 0 0' }}>✓ {isAr ? 'حالة صحية' : 'healthy status'}</p>
        </div>
        <div style={{ background: '#ecfdf5', borderRadius: 20, padding: '20px 24px', border: '2px solid #bbf7d0' }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: '#059669', margin: '0 0 8px', ...upper() }}>{t.availableCash}</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#047857', margin: 0, lineHeight: 1 }}>{fn(availableIncome, lang)} <span style={{ fontSize: 14, color: '#059669' }}>{t.currency}</span></h2>
          <p style={{ fontSize: 10, color: '#059669', fontWeight: 700, margin: '4px 0 0' }}>{isAr ? 'صافي السيولة' : 'NET LIQUIDITY'}</p>
        </div>
        <div style={{ background: '#fff1f2', borderRadius: 20, padding: '20px 24px', border: '2px solid #fecdd3' }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: '#e11d48', margin: '0 0 8px', ...upper() }}>{t.fixedCosts}</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#be123c', margin: 0, lineHeight: 1 }}>{fn(totalFixed + totalDebts, lang)} <span style={{ fontSize: 14, color: '#e11d48' }}>{t.currency}</span></h2>
          <p style={{ fontSize: 10, color: '#e11d48', fontWeight: 700, margin: '4px 0 0' }}>{fn(burdenRatio, lang)}% {isAr ? 'نسبة الأعباء' : 'BURDEN RATIO'}</p>
        </div>
      </div>

      {/* ═══ Basic Info + AI Logic ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>👤</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>{lang === 'ar' ? 'المعلومات الأساسية' : 'Basic Info'}</h3>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            {[
              [lang === 'ar' ? 'صاحب الحساب' : 'Account Holder', profile.account.name],
              [lang === 'ar' ? 'عدد الأفراد' : 'Family Members', `${fn(profile.familyMembers, lang)} ${lang === 'ar' ? 'أفراد' : 'Persons'}`],
              [lang === 'ar' ? 'الحالة الاجتماعية' : 'Marital Status', maritalLabel[profile.maritalStatus] || profile.maritalStatus],
              [lang === 'ar' ? 'استقرار الدخل' : 'Income Stability', (incomeLabel as Record<string, string>)[profile.incomeStability] || profile.incomeStability],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 12, color: '#1e293b', fontWeight: 800 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>⚙️</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>{lang === 'ar' ? 'منطق الذكاء الاصطناعي' : 'AI Logic'}</h3>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            {[
              [isAr ? 'أولوية الادخار' : 'Saving Priority', profile.preferences.savingPriority === 'not_specified' ? (isAr ? 'غير محدد' : 'Not specified') : profile.preferences.savingPriority],
              [isAr ? 'تحمل المخاطر' : 'Risk Tolerance', profile.preferences.riskTolerance === 'not_specified' ? (isAr ? 'غير محدد' : 'Not specified') : profile.preferences.riskTolerance],
              [isAr ? 'هدف صندوق الطوارئ %' : 'Emergency Fund Target %', `${fn(profile.preferences.emergencyFundPercentage, lang)}%`],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 12, color: '#059669', fontWeight: 800 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Financial Health Score ═══ */}
      <div style={{ background: '#0f172a', borderRadius: 24, padding: '32px 40px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 32, color: 'white' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', border: '6px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 900, display: 'block', lineHeight: 1 }}>{fn(score, lang)}</span>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{lang === 'ar' ? 'درجة' : 'SCORE'}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            {lang === 'ar' ? 'تحليل الصحة المالية الذكي' : 'Smart Financial Health Analysis'}
          </h3>
          <p style={{ fontSize: 12, color: '#cbd5e1', margin: '0 0 12px', lineHeight: 1.6 }}>
            {lang === 'ar' 
              ? 'وضعك المالي ممتاز. نسبة الدين إلى الدخل منخفضة ولديك أولويات ادخار واضحة. ننصح بزيادة صندوق الطوارئ ليغطي ٦ أشهر من المصاريف.'
              : 'Your financial standing is excellent. You maintain a low debt-to-income ratio and have clear saving priorities. Our AI recommends increasing your emergency fund to cover 6 months of expenses.'}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ background: '#22c55e20', color: '#22c55e', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>
              ● {lang === 'ar' ? 'مخاطر منخفضة' : 'Low Risk'}
            </span>
            <span style={{ background: '#3b82f620', color: '#60a5fa', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>
              📈 {lang === 'ar' ? 'إمكانية نمو' : 'Growth Potential'}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Page Break ═══ */}
      <div style={{ borderTop: '1px solid #e2e8f0', margin: '24px 0', display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
        <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>{isAr ? 'وحدة الذكاء المالي - مُدَبِّر' : 'MODABER FINANCIAL INTELLIGENCE UNIT'}</p>
        <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>{isAr ? `صفحة ${fn(1, lang)} / ${fn(2, lang)}` : 'PAGE 01 / 02'}</p>
      </div>

      {/* ═══ Fixed Expenses + Debts ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>📉</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>{lang === 'ar' ? 'المصاريف الثابتة' : 'Fixed Expenses'}</h3>
          </div>
          {Object.entries(profile.fixedExpenses).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e11d48', display: 'inline-block' }}></span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{expenseLabels[key] || key}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{fn(value as number, lang)} {t.currency}</span>
            </div>
          ))}
          <div style={{ background: '#fef2f2', borderRadius: 16, padding: '12px 20px', marginTop: 16, display: 'flex', justifyContent: 'space-between', border: '2px solid #fecdd3' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#991b1b', ...upperTight() }}>
              {isAr ? 'الالتزام الشهري' : 'MONTHLY COMMITMENT'}
              <br />
              <span style={{ fontSize: 10, fontWeight: 600 }}>{lang === 'ar' ? 'إجمالي التكاليف الثابتة' : 'Total Fixed Costs'}</span>
            </span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>{fn(totalFixed, lang)} {t.currency}</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>{lang === 'ar' ? 'الديون والمصاريف السنوية' : 'Debts & Annual Expenses'}</h3>
          </div>
          {profile.debts.length === 0 && profile.annualExpenses.length === 0 ? (
            <div style={{ background: '#f0fdf4', borderRadius: 16, padding: 24, textAlign: 'center', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 28, margin: '0 0 4px' }}>✅</p>
              <p style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>{lang === 'ar' ? 'لا ديون مسجلة - ممتاز!' : 'No debts recorded - Excellent!'}</p>
            </div>
          ) : (
            <>
              {profile.debts.map((d, i) => (
                <div key={d.id} style={{ background: '#fff7ed', borderRadius: 12, padding: '12px 16px', marginBottom: 8, border: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#9a3412' }}>{d.description}</span>
                    <br />
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#ea580c' }}>{fn(d.monthlyAmount, lang)} {t.currency}</span>
                    <span style={{ fontSize: 10, color: '#9a3412', fontWeight: 600, marginInlineStart: 4 }}>/{lang === 'ar' ? 'شهرياً' : 'MONTH'}</span>
                  </div>
                  <span style={{ background: d.priority === 'High' ? '#dc262620' : '#f59e0b20', color: d.priority === 'High' ? '#dc2626' : '#d97706', fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 8, ...(isAr ? {} : { textTransform: 'uppercase' }) }}>
                    {d.priority === 'High' ? (isAr ? 'عالي' : 'HIGH') : d.priority === 'Medium' ? (isAr ? 'متوسط' : 'MED') : (isAr ? 'منخفض' : 'LOW')}
                  </span>
                </div>
              ))}
              {profile.annualExpenses.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{e.description}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed' }}>{fn(e.totalAmount, lang)} {t.currency}/{lang === 'ar' ? 'سنوي' : 'yr'}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ═══ Smart Budget ═══ */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>{lang === 'ar' ? 'الميزانية الذكية' : 'Smart Budget'}</h3>
        </div>
        <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 16px' }}>
          {lang === 'ar' ? 'بناءً على أولوياتك، قمنا بتوزيع الأموال المتبقية لتحقيق أقصى قدر من الأمان المالي وجودة الحياة.' : 'Based on your priorities, we have allocated the remaining funds to maximize your financial security and lifestyle quality.'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 8, ...upper() }}>
              {isAr ? 'ترتيب الأولويات' : 'PRIORITY RANKING'}
            </p>
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              {profile.preferences.monthlyPriorities.map((p, i) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < profile.preferences.monthlyPriorities.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: ['#059669', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'][i] || '#94a3b8', color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {fn(i + 1, lang)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{priorityLabels[p] || p}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 8, ...upper() }}>
              {isAr ? 'أهداف التوزيع' : 'ALLOCATION TARGETS'}
            </p>
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
              {[
                { label: lang === 'ar' ? 'صندوق الطوارئ' : 'Emergency Fund', amount: savingsTarget, color: '#3b82f6' },
                { label: lang === 'ar' ? 'نمط الحياة الاختياري' : 'Optional Lifestyle', amount: totalOptional, color: '#8b5cf6' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i === 0 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, availableIncome > 0 ? (item.amount / availableIncome) * 100 : 0)}%`, height: '100%', background: item.color, borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{fn(item.amount, lang)} {t.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Smart Shopping + Safe Investments ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>🛒</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>{lang === 'ar' ? 'التسوق الذكي' : 'Smart Shopping'}</h3>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            {[
              lang === 'ar' ? 'اشترِ المواد غير القابلة للتلف بالجملة هذا الأسبوع.' : 'Bulk buy non-perishables this week.',
              lang === 'ar' ? 'انتقل إلى العلامات التجارية المحلية لمنتجات الألبان.' : 'Switch to local brands for dairy products.',
              lang === 'ar' ? 'راقب أسعار الوقود لإعادة التعبئة المبكرة.' : 'Monitor fuel prices for early refill.',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ color: '#059669', fontWeight: 900, fontSize: 14, lineHeight: '20px' }}>●</span>
                <span style={{ fontSize: 12, color: '#334155', fontWeight: 500, lineHeight: '20px' }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>{lang === 'ar' ? 'استثمارات آمنة' : 'Safe Investments'}</h3>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 12, marginBottom: 8, border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: '#059669', margin: '0 0 2px', ...upperTight() }}>
                {isAr ? 'موصى به' : 'RECOMMENDED'}
              </p>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', margin: '0 0 2px' }}>
                {lang === 'ar' ? 'شهادات ادخار عالية العائد (ج.م)' : 'High-Yield Savings Certificates (EGP)'}
              </p>
              <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>
                {lang === 'ar' ? 'العائد المتوقع: ١٢-١٥٪ سنوياً' : 'Expected Return: 12-15% Annually'}
              </p>
            </div>
            <div style={{ background: '#faf5ff', borderRadius: 12, padding: 12, border: '1px solid #e9d5ff' }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: '#7c3aed', margin: '0 0 2px', ...upperTight() }}>
                {isAr ? 'تنويع' : 'DIVERSIFICATION'}
              </p>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', margin: '0 0 2px' }}>
                {lang === 'ar' ? 'سبائك الذهب (تحوط طويل الأمد)' : 'Gold Bullion (Long-term hedge)'}
              </p>
              <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>
                {lang === 'ar' ? 'خطر منخفض - مخزن قيمة' : 'Risk level: low-medium'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Disclaimer ═══ */}
      <div style={{ background: '#f8fafc', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#334155', margin: '0 0 4px', ...upperTight() }}>
            {isAr ? 'إخلاء مسؤولية مالية' : 'FINANCIAL DISCLAIMER'}
          </p>
          <p style={{ fontSize: 10, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            {lang === 'ar'
              ? 'هذا التقرير تم إنشاؤه بواسطة محرك الذكاء الاصطناعي لأغراض إعلامية فقط ولا يشكل نصيحة مالية مهنية. الظروف الفعلية قد تختلف. يرجى استشارة مخطط مالي معتمد للقرارات الاستثمارية الكبيرة.'
              : 'This report is generated by an AI assistant for informational purposes only and does not constitute professional financial advice. Actual market conditions may vary. Please consult a certified financial planner for significant investment decisions. Mudaber AI uses historical data and current market trends to provide these estimates.'}
          </p>
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 9, color: '#94a3b8', margin: 0, fontWeight: 700 }}>{isAr ? '© ٢٠٢٦ مُدَبِّر · جميع الحقوق محفوظة' : '© 2026 MODABER AI · ALL RIGHTS RESERVED'}</p>
        <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>{isAr ? `صفحة ${fn(2, lang)} / ${fn(2, lang)}` : 'PAGE 02 / 02'}</p>
      </div>
    </div>
  );
};

export default HiddenReport;
