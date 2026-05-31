import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertApi, profileApi } from '../services/apiClient';
import type { AppNotification } from '../components/modaber/NotificationSystem';
import type { UserProfile } from '../types';

export const ALERTS_KEY = ['alerts'] as const;

const generateFallbackAlerts = (profile: UserProfile | null, lang: 'ar' | 'en'): AppNotification[] => {
  const alerts: AppNotification[] = [];
  const now = new Date().toISOString();

  if (!profile) {
    return [
      {
        id: 'fb-welcome',
        type: 'saving',
        title: lang === 'ar' ? 'مرحبًا بك في مدبّر!' : 'Welcome to Modaber!',
        message: lang === 'ar' 
          ? 'ابدأ بإكمال بياناتك وتحديد ميزانيتك لنتمكن من تزويدك بأدق النصائح المالية والذكية.'
          : 'Start by filling your profile and planning your budget to receive tailored smart insights.',
        timestamp: now,
        read: false
      },
      {
        id: 'fb-rule-50',
        type: 'budget',
        title: lang === 'ar' ? 'نصيحة الميزانية الذكية' : 'Smart Budgeting Tip',
        message: lang === 'ar'
          ? 'قسّم دخلك دائمًا باتباع قاعدة 50/30/20: 50% للاحتياجات، 30% للرغبات، و20% للادخار والاستثمار.'
          : 'Always divide your income using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and investing.',
        timestamp: now,
        read: false
      }
    ];
  }

  // Calculate Fixed Costs
  const fixedSum = Object.values(profile.fixedExpenses).reduce((a, b) => a + b, 0);
  const salary = profile.monthlySalary;

  // 1. High Fixed Costs Alert
  if (salary > 0 && fixedSum / salary > 0.5) {
    alerts.push({
      id: 'fb-fixed-high',
      type: 'budget',
      title: lang === 'ar' ? 'التزامات ثابتة مرتفعة' : 'High Fixed Commitments',
      message: lang === 'ar'
        ? `التزاماتك الثابتة (${Math.round((fixedSum / salary) * 100)}% من دخلك) تتجاوز الحد الموصى به (50%). فكر في مراجعة الاشتراكات أو ترشيد استهلاك الطاقة.`
        : `Your fixed expenses (${Math.round((fixedSum / salary) * 100)}% of your income) exceed the recommended 50% limit. Consider reviewing subscriptions or optimizing utilities.`,
      timestamp: now,
      read: false
    });
  }

  // 2. Debt Alert
  if (profile.debts && profile.debts.length > 0) {
    const totalDebt = profile.debts.reduce((a, b) => a + b.monthlyAmount, 0);
    alerts.push({
      id: 'fb-debt-info',
      type: 'budget',
      title: lang === 'ar' ? 'خطة إدارة الديون' : 'Debt Management Plan',
      message: lang === 'ar'
        ? `لديك أقساط ديون شهرية بقيمة ${totalDebt} لـ ${profile.debts.length} من الالتزامات. ركز على تصفية الديون ذات الأولوية أو الفائدة الأعلى أولاً.`
        : `You have monthly debt payments of ${totalDebt} for ${profile.debts.length} obligations. Focus on paying off the highest priority or interest debts first.`,
      timestamp: now,
      read: false
    });
  }

  // 3. Emergency Fund Alert
  const emergencyPct = profile.preferences?.emergencyFundPercentage ?? 10;
  alerts.push({
    id: 'fb-emergency-fund',
    type: 'saving',
    title: lang === 'ar' ? 'بناء صندوق الطوارئ' : 'Emergency Fund Goal',
    message: lang === 'ar'
      ? `هدف صندوق الطوارئ الخاص بك هو ${emergencyPct}% من الدخل. نوصي بالاحتفاظ بما يعادل 3 إلى 6 أشهر من نفقاتك المعيشية لمواجهة أي ظرف طارئ بسلام.`
      : `Your emergency fund target is ${emergencyPct}% of your income. We recommend holding 3 to 6 months' worth of living expenses to safely navigate unexpected situations.`,
    timestamp: now,
    read: false
  });

  // 4. Investment Recommendation based on Risk Tolerance
  const risk = profile.preferences?.riskTolerance ?? 'Medium';
  if (risk === 'High') {
    alerts.push({
      id: 'fb-invest-high',
      type: 'investment',
      title: lang === 'ar' ? 'استثمار ذو نمو مرتفع' : 'High-Growth Investing',
      message: lang === 'ar'
        ? 'بما أن قدرتك على تحمل المخاطر عالية، يمكنك دراسة خيارات مثل الأسهم الفردية، أو صناديق الاستثمار المشتركة النشطة، أو الذهب للتحوط من التضخم.'
        : 'Since your risk tolerance is high, you might want to look into individual stocks, active index mutual funds, or gold as inflation hedges.',
      timestamp: now,
      read: false
    });
  } else if (risk === 'Medium') {
    alerts.push({
      id: 'fb-invest-med',
      type: 'investment',
      title: lang === 'ar' ? 'توزيع استثماري متوازن' : 'Balanced Investment Mix',
      message: lang === 'ar'
        ? 'تقييمك للمخاطر متوازن. ابحث عن صناديق المؤشرات المتداولة (ETFs) أو الصناديق الاستثمارية المتنوعة التي تضمن نمواً جيداً بمخاطر متوسطة.'
        : 'Your risk profile is balanced. Look into diversified index ETFs or mutual funds that offer solid growth with moderate risk.',
      timestamp: now,
      read: false
    });
  } else {
    alerts.push({
      id: 'fb-invest-low',
      type: 'investment',
      title: lang === 'ar' ? 'حفظ الأصول الآمنة' : 'Conservative Asset Saving',
      message: lang === 'ar'
        ? 'بناءً على تفضيلك للمخاطر المنخفضة، ننصحك بالتركيز على الودائع لأجل، أو الصكوك الإسلامية، أو حسابات الادخار ذات العوائد المرتفعة لضمان أمان رأس المال.'
        : 'Based on your low risk preference, we suggest looking into high-yield savings accounts, time deposits, or low-risk government sukuks to secure principal.',
      timestamp: now,
      read: false
    });
  }

  // 5. Smart Shopping Insight
  alerts.push({
    id: 'fb-shopping-smart',
    type: 'shopping',
    title: lang === 'ar' ? 'التسوق بموجب القائمة الذكية' : 'Shop with Smart List',
    message: lang === 'ar'
      ? 'لتوفير ما يصل إلى 25% من فاتورة البقالة، تجنب التسوق دون قائمة محددة سلفاً وتأكد من شراء السلع الأساسية أولاً في مواسم العروض.'
      : 'To save up to 25% on your groceries bill, avoid shopping without a predefined smart list and buy essentials first during seasonal discounts.',
    timestamp: now,
    read: false
  });

  return alerts;
};

const toAlertList = (data: unknown): AppNotification[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as AppNotification[];
  return ((data as { items: AppNotification[] }).items ?? []);
};

export const useAlerts = () =>
  useQuery({
    queryKey: ALERTS_KEY,
    queryFn: async () => {
      const res = await alertApi.getAll();
      if (!res.ok) {
        try {
          const profileRes = await profileApi.get().catch(() => null);
          const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
          const profile = profileRes?.ok && profileRes.data ? (profileRes.data as UserProfile) : null;
          return generateFallbackAlerts(profile, lang);
        } catch {
          const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
          return generateFallbackAlerts(null, lang);
        }
      }
      return toAlertList(res.data);
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

export const useMarkAlertRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  });
};

export const useDeleteAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  });
};
